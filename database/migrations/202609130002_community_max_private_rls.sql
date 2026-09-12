begin;

-- Private Community Max queues are service-boundary only.  RLS is enabled
-- without browser policies; service_role retains access through BYPASSRLS.
alter table private.community_review_candidates enable row level security;
alter table private.community_expert_requests enable row level security;
alter table private.community_risk_clusters enable row level security;
alter table private.community_risk_cluster_members enable row level security;
alter table private.community_data_candidates enable row level security;

commit;
