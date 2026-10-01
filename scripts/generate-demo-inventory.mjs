// Inventory is derived from the existing server policy, never used as authority.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEMO_ACCOUNT_SPECS } from '../frontend/src/lib/server/auth/demoAccountPolicy.js';
const folder = resolve(import.meta.dirname, '../../operator-fixtures');
mkdirSync(folder, { recursive: true });
const target = resolve(folder, 'DEMO_ACCOUNT_INVENTORY.json');
const inventory = [...DEMO_ACCOUNT_SPECS.values()].map((spec, index) => ({
  accountId: `DEMO-${String(index + 1).padStart(2, '0')}`,
  email: spec.email,
  role: spec.role,
  enabled: true,
  authMethod: 'SUPABASE_PASSWORD',
  scenario: spec.scenario,
  displayName: `Demo ${spec.role} ${index + 1}`,
}));
writeFileSync(target, JSON.stringify(inventory, null, 2) + '\n');
console.log(JSON.stringify({ status: 'CANONICAL_INVENTORY_GENERATED', count: inventory.length, target, secretsWritten: false, accountsChanged: false }));
