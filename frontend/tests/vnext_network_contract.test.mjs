import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");
}

test("VNext network lanes remain scoped evidence and Passport remains read-only in the UI", () => {
  const community = read("src/components/community/CommunityIntelligenceView.jsx");
  const expert = read("src/components/expert/ExpertIntelligenceView.jsx");
  const trust = read("src/components/trust/AiTrustStudioView.jsx");
  const cases = read("src/components/competition/CompetitionCaseStudio.jsx");

  assert.match(community, /vnext-secondary-workspace vnext-community-workspace/);
  assert.match(community, /caseScope/);
  assert.match(community, /không biến trải nghiệm thành sự thật chính thức/);
  assert.match(expert, /vnext-secondary-workspace vnext-expert-workspace/);
  assert.match(expert, /Expertise không đồng nghĩa với authority/);
  assert.match(expert, /phạm vi/);
  assert.match(trust, /getPassport/);
  assert.doesNotMatch(trust, /appendPassport|createPassport|setTrustVerdict|writeback/i);
  assert.match(cases, /Evidence Passport/);
  assert.match(cases, /Decision Twin/);
});
