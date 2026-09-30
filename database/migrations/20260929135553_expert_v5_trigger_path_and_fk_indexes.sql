-- Follow-up hardening after the first approved staging advisor pass.
-- The immutable trigger references only built-in PL/pgSQL operations; pin its
-- search path to pg_catalog and cover remaining user foreign-key lookups.

create or replace function private.expert_v5_reject_immutable_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'Expert V5 audit records are append-only' using errcode = '55000';
end;
$$;

create index if not exists expert_v5_config_updated_by_idx
  on private.expert_v5_config(updated_by) where updated_by is not null;
create index if not exists expert_room_answers_expert_idx
  on private.expert_room_answers(expert_user_id, round_id);
create index if not exists expert_room_adjudications_host_ack_idx
  on private.expert_room_adjudications(host_acknowledged_by)
  where host_acknowledged_by is not null;
