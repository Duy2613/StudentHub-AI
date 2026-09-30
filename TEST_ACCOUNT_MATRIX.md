# Test Account Matrix

No authenticated staging account was used or revalidated in this continuation. The previous staging login must not be treated as a live session guarantee.

| Persona | Code-defined identity | Classification | Live ID / role / scope / state verified? | Use in this run |
|---|---|---|---|---|
| Student full-active | `demo-user@gmail.com` | DEMO_USER spec | No | Deterministic fixture only |
| Student new-user | `demo-user1@gmail.com` | DEMO_USER spec | No | Deterministic fixture only |
| Student heavy-returning | `demo-user2@gmail.com` | DEMO_USER spec | No | Deterministic fixture only |
| Student edge-restricted | `demo-user3@gmail.com` | DEMO_USER spec | No | Deterministic fixture only |
| Expert senior full-QA | `demo-expert@gmail.com` | DEMO_EXPERT spec | No | Deterministic fixture only |
| Expert newly-qualified | `demo-expert1@gmail.com` | DEMO_EXPERT spec | No | Deterministic fixture only |
| Expert mid-level | `demo-expert2@gmail.com` | DEMO_EXPERT spec | No | Deterministic fixture only |
| Expert near-promotion | `demo-expert3@gmail.com` | DEMO_EXPERT spec | No | Deterministic fixture only |
| Staging owner/admin | Not recorded here | OWNER_ADMIN / UNKNOWN until session proof | No | Not used |
| RLS fixtures | None verified | RLS_FIXTURE | No | Not used |
| Real users | None selected | REAL_USER | N/A | Not used |

The first eight are source-controlled demo policy specifications, not proof that matching Supabase auth users or expert profiles exist. No user IDs, roles, expert scope, star/level, reputation, mission state, or online presence were read from staging. No personal user was repurposed.
