-- Widen the two known staging presentation checks to the canonical contract.
-- Existing values remain valid; identity/role/scope/progression are untouched.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare
  expected record;
  actual record;
  existing_checks integer;
  existing_name text;
  existing_expression text;
begin
  if to_regclass('public.profiles') is null then
    raise exception 'PROFILE_PRESENTATION_BASE_REQUIRED';
  end if;
  for expected in select * from (values
    ('major', 180, 'profiles_major_check', 'char_lengthmajor<=180',
     'majorISNULLORchar_lengthmajor<=160'),
    ('avatar_id', 80, 'profiles_avatar_id_check', 'char_lengthavatar_id<=80',
     'avatar_idISNULLORavatar_id~''^[a-z0-9-]{1,80}$''::text')
  ) as checks(column_name, max_length, constraint_name, canonical_expression, legacy_expression) loop
    select a.attnum, a.atttypid, a.attnotnull into actual from pg_attribute a
     where a.attrelid = 'public.profiles'::regclass and a.attname = expected.column_name and not a.attisdropped;
    if not found or actual.atttypid <> 'text'::regtype or actual.attnotnull then
      raise exception 'PROFILE_PRESENTATION_INCOMPATIBLE_FIELD: %', expected.column_name;
    end if;
    select count(*), min(c.conname),
           min(regexp_replace(pg_get_expr(c.conbin, c.conrelid), '[[:space:]()]', '', 'g'))
      into existing_checks, existing_name, existing_expression
      from pg_constraint c where c.conrelid = 'public.profiles'::regclass and c.contype = 'c'
       and c.conkey @> array[actual.attnum];
    if existing_checks <> 1 or existing_expression not in (expected.canonical_expression, expected.legacy_expression)
       or not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass
                      and conname = existing_name and convalidated) then
      raise exception 'PROFILE_PRESENTATION_UNREVIEWED_CHECK: %', expected.column_name;
    end if;
    if existing_expression = expected.legacy_expression then
      execute format('alter table public.profiles drop constraint %I', existing_name);
      execute format('alter table public.profiles add constraint %I check (char_length(%I) <= %s)',
        expected.constraint_name, expected.column_name, expected.max_length);
    end if;
  end loop;
end;
$$;

-- No UPDATE, destructive column operation, RLS change or authority grant.
commit;
