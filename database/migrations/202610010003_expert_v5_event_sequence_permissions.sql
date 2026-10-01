-- Explicit sequence privileges for server-owned Expert V5 audit event writes.
-- Historical table grants do not imply privileges on later-created sequences.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare
  event_table text;
  sequence_name text;
begin
  foreach event_table in array array[
    'expert_v5_source_events', 'expert_v5_question_events',
    'expert_mission_events', 'expert_room_events'
  ] loop
    if to_regclass('private.' || event_table) is null then
      raise exception 'EXPERT_V5_EVENT_TABLE_REQUIRED: %', event_table;
    end if;
    if not exists (select 1 from pg_attribute where attrelid = to_regclass('private.' || event_table)
                   and attname = 'id' and atttypid = 'bigint'::regtype and attidentity <> '' and not attisdropped) then
      raise exception 'EXPERT_V5_EVENT_IDENTITY_REQUIRED: %', event_table;
    end if;
    sequence_name := pg_get_serial_sequence('private.' || event_table, 'id');
    if sequence_name is null then
      raise exception 'EXPERT_V5_EVENT_SEQUENCE_REQUIRED: %', event_table;
    end if;
    execute format('grant usage, select on sequence %s to service_role', sequence_name);
  end loop;
end;
$$;

commit;
