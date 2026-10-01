-- Forward repair for the production outbox predating lease/shadow support.
-- Do not rewrite or replay the historical integration_outbox migration ID.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $$
declare
  expected record;
  actual record;
  status_expression text;
  status_checks integer;
begin
  if to_regclass('private.integration_outbox') is null then
    raise exception 'OUTBOX_RECONCILIATION_BASE_REQUIRED';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'private.integration_outbox'::regclass) then
    raise exception 'OUTBOX_RECONCILIATION_RLS_REQUIRED';
  end if;

  -- Existing incompatible fields cause a transactional failure, not a silent
  -- IF NOT EXISTS success. New counters use constant defaults, no UPDATE.
  for expected in select * from (values
    ('lease_token', 'uuid', false, null::text),
    ('lease_count', 'integer', true, '0'),
    ('shadow_count', 'integer', true, '0'),
    ('shadowed_at', 'timestamp with time zone', false, null::text)
  ) as fields(column_name, type_name, not_null, default_expression) loop
    select format_type(a.atttypid, a.atttypmod) as type_name,
           a.attnotnull as not_null, pg_get_expr(d.adbin, d.adrelid) as default_expression
      into actual
      from pg_attribute a
      left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
     where a.attrelid = 'private.integration_outbox'::regclass
       and a.attname = expected.column_name and not a.attisdropped;
    if found then
      if actual.type_name <> expected.type_name
         or actual.not_null <> expected.not_null
         or actual.default_expression is distinct from expected.default_expression then
        raise exception 'OUTBOX_RECONCILIATION_INCOMPATIBLE_FIELD: %', expected.column_name;
      end if;
    else
      execute format('alter table private.integration_outbox add column %I %s%s',
        expected.column_name, expected.type_name,
        case when expected.not_null then ' not null default 0' else '' end);
    end if;
  end loop;

  select count(*), min(regexp_replace(pg_get_expr(c.conbin, c.conrelid), '[[:space:]()]', '', 'g'))
    into status_checks, status_expression
    from pg_constraint c
   where c.conrelid = 'private.integration_outbox'::regclass and c.contype = 'c'
     and c.conkey @> array[(select attnum from pg_attribute
       where attrelid = c.conrelid and attname = 'status')];
  if status_checks <> 1 or status_expression not in (
    'status=ANYARRAY[''PENDING''::text,''IN_FLIGHT''::text,''DELIVERED''::text,''FAILED''::text]',
    'status=ANYARRAY[''PENDING''::text,''IN_FLIGHT''::text,''DELIVERED''::text,''FAILED''::text,''SHADOW''::text,''CONFLICT''::text]'
  ) or not exists (select 1 from pg_constraint where conrelid = 'private.integration_outbox'::regclass
                   and conname = 'integration_outbox_status_check' and convalidated) then
    raise exception 'OUTBOX_RECONCILIATION_UNREVIEWED_STATUS_CHECK';
  end if;
  if status_expression = 'status=ANYARRAY[''PENDING''::text,''IN_FLIGHT''::text,''DELIVERED''::text,''FAILED''::text]' then
    alter table private.integration_outbox drop constraint integration_outbox_status_check;
    alter table private.integration_outbox add constraint integration_outbox_status_check
      check (status in ('PENDING','IN_FLIGHT','DELIVERED','FAILED','SHADOW','CONFLICT'));
  end if;

  for expected in select * from (values
    ('lease_count', 'integration_outbox_lease_count_check'),
    ('shadow_count', 'integration_outbox_shadow_count_check')
  ) as checks(column_name, constraint_name) loop
    if not exists (select 1 from pg_constraint where conrelid = 'private.integration_outbox'::regclass
                   and conname = expected.constraint_name) then
      execute format('alter table private.integration_outbox add constraint %I check (%I >= 0)',
        expected.constraint_name, expected.column_name);
    elsif not exists (
      select 1 from pg_constraint where conrelid = 'private.integration_outbox'::regclass
       and conname = expected.constraint_name and contype = 'c' and convalidated
       and regexp_replace(pg_get_expr(conbin, conrelid), '[[:space:]()]', '', 'g') = expected.column_name || '>=0'
    ) then
      raise exception 'OUTBOX_RECONCILIATION_UNREVIEWED_COUNTER_CHECK: %', expected.column_name;
    end if;
  end loop;
end;
$$;

-- Keep the established private/server-only authorization boundary unchanged.
commit;
