begin;

-- Keep the Community-to-Expert bridge private.  The assigned reviewer receives
-- only the already-published, redacted contribution through the blind dossier.
alter table private.expert_review_requests
  add column if not exists community_contribution_id uuid
  references public.community_contributions(id) on delete set null;

create index if not exists expert_review_requests_community_contribution_idx
  on private.expert_review_requests(community_contribution_id)
  where community_contribution_id is not null;

commit;
