begin;

-- QA/product access is not an identity claim and is never stored in auth
-- metadata.  The user UUID is the only identity join key; the exact email
-- allowlist remains in the server-owned provisioning policy.
create table if not exists private.demo_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_code text not null check (entitlement_code in (
    'DEMO_FULL_USER_ACCESS',
    'DEMO_FULL_EXPERT_ACCESS',
    'QA_STUDENT_FEATURE_ACCESS'
  )),
  source text not null default 'QA_PROVISIONED' check (source = 'QA_PROVISIONED'),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  primary key (user_id, entitlement_code),
  check (expires_at is null or expires_at > granted_at)
);

create index if not exists demo_entitlements_active_user_idx
  on private.demo_entitlements(user_id, entitlement_code)
  where revoked_at is null;

alter table private.demo_entitlements enable row level security;
drop policy if exists demo_entitlements_service_only on private.demo_entitlements;
create policy demo_entitlements_service_only on private.demo_entitlements
  for all to service_role
  using (true)
  with check (true);

revoke all on private.demo_entitlements from public, anon, authenticated;
grant select, insert, update on private.demo_entitlements to service_role;

commit;
