import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("the retired Contract product surface is absent while Trust remains available", () => {
  assert.equal(fs.existsSync(path.join(root, "src/app/contract-check/page.jsx")), false);
  assert.equal(fs.existsSync(path.join(root, "src/app/api/contract-check/analyze/route.js")), false);
  assert.equal(fs.existsSync(path.join(root, "src/components/trust/ContractCheckIntakeTab.jsx")), false);
  assert.equal(fs.existsSync(path.join(root, "src/lib/intelligence/contract/contractIntelligenceEngine.js")), false);
  const trust = `${read("src/components/trust/TrustWorkspaceClient.jsx")}\n${read("src/components/trust/AiTrustStudioView.jsx")}\n${read("src/components/trust/TrustMasterUltraJourney.jsx")}`;
  assert.doesNotMatch(trust, /ContractCheckIntakeTab|tab=contract|Hợp đồng/);
  assert.doesNotMatch(read("src/lib/ultra/routes.js"), /contract-check/);
  assert.doesNotMatch(read("src/lib/intelligence/copilot/studentCopilotEngine.js"), /contract|hợp đồng/i);
  assert.doesNotMatch(read("src/lib/intelligence/radar/studentRadarEngine.js"), /contract|hợp đồng/i);
  assert.doesNotMatch(read("src/lib/legal/legalSosRegistry.js"), /CONTRACT_LEGAL_RULES|contract|hợp đồng/i);
});
