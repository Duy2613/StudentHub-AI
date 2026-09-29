BEGIN;

ALTER TABLE public.trust_stage_runs
  DROP CONSTRAINT IF EXISTS trust_stage_runs_stage_id_check;

ALTER TABLE public.trust_stage_runs
  ADD CONSTRAINT trust_stage_runs_stage_id_check
  CHECK (stage_id IN ('l1', 'l2', 'l2a', 'l2b', 'l2c', 'l3', 'l4', 'l5'));

COMMIT;
