import assert from "node:assert/strict";
import test from "node:test";

import { EntityResolutionService } from "../../src/lib/server/trust/EntityResolutionService.js";

const explicitInstitutions = [
  {
    query: "Đại học Kinh tế - Luật tra cứu thông tin tuyển sinh",
    entityId: "UEL",
    domain: "uel.edu.vn",
    rejectedIds: ["UEH"],
  },
  {
    query: "Đại học Kinh tế Đà Nẵng tra cứu thông tin tuyển sinh",
    entityId: "DUE",
    domain: "due.udn.vn",
    rejectedIds: ["UEH"],
  },
  {
    query: "Đại học Kinh tế - Tài chính TP.HCM tra cứu thông tin tuyển sinh",
    entityId: "UEF",
    domain: "uef.edu.vn",
    rejectedIds: ["UEH"],
  },
  {
    query: "Đại học Quốc tế Sài Gòn tra cứu thông tin tuyển sinh",
    entityId: "SIU",
    domain: "siu.edu.vn",
    rejectedIds: ["HCMIU_VNUHCM", "SGU"],
  },
  {
    query: "Đại học Khoa học Xã hội và Nhân văn ĐHQG Hà Nội tuyển sinh",
    entityId: "USSH_HANOI",
    domain: "ussh.vnu.edu.vn",
    rejectedIds: ["VNU", "VNUHN"],
  },
  {
    query: "Đại học Điện lực tra cứu thông tin tuyển sinh",
    entityId: "EPU",
    domain: "epu.edu.vn",
  },
  {
    query: "Đại học Tài nguyên và Môi trường Hà Nội tuyển sinh",
    entityId: "HUNRE",
    domain: "hunre.edu.vn",
  },
  {
    query: "Đại học Công nghiệp TP.HCM tuyển sinh",
    entityId: "IUH",
    domain: "iuh.edu.vn",
  },
  {
    query: "Đại học Đà Lạt tuyển sinh",
    entityId: "DLU",
    domain: "dlu.edu.vn",
  },
  {
    query: "Đại học Tây Đô tuyển sinh",
    entityId: "TDU",
    domain: "tdu.edu.vn",
  },
  {
    query: "Đại học Việt Đức tuyển sinh",
    entityId: "VGU",
    domain: "vgu.edu.vn",
  },
  {
    query: "Đại học Văn Hiến tuyển sinh",
    entityId: "VHU",
    domain: "vhu.edu.vn",
  },
  {
    query: "Đại học Lạc Hồng tuyển sinh",
    entityId: "LHU",
    domain: "lhu.edu.vn",
  },
  {
    query: "Đại học Thủ Dầu Một tuyển sinh",
    entityId: "TDMU",
    domain: "tdmu.edu.vn",
  },
  {
    query: "Đại học Bình Dương tuyển sinh",
    entityId: "BDU",
    domain: "bdu.edu.vn",
  },
  {
    query: "Trường Đại học Đồng Nai tuyển sinh",
    entityId: "DNU",
    domain: "dongnaiuni.edu.vn",
  },
  {
    query: "Đại học Hà Nội tuyển sinh",
    entityId: "HANU",
    domain: "hanu.vn",
  },
];

test("specific institution names resolve to their own canonical identity", () => {
  for (const expected of explicitInstitutions) {
    const result = EntityResolutionService.resolveEntitiesDetailed(expected.query);

    assert.equal(result.status, "RESOLVED", expected.query);
    assert.equal(result.matches.length, 1, expected.query);
    assert.equal(result.matches[0].entityId, expected.entityId, expected.query);
    assert.equal(result.matches[0].officialDomain, expected.domain, expected.query);
    for (const rejectedId of expected.rejectedIds || []) {
      assert.equal(result.matches.some((match) => match.entityId === rejectedId), false, expected.query);
    }
  }
});

test("generic institution labels remain unresolved or explicitly ambiguous", () => {
  const economics = EntityResolutionService.resolveEntitiesDetailed("Đại học Kinh tế");
  const international = EntityResolutionService.resolveEntitiesDetailed("Đại học Quốc tế");

  assert.equal(economics.status, "AMBIGUOUS");
  assert.equal(economics.matches.some((match) => match.entityId === "UEH"), false);
  assert.equal(international.status, "UNKNOWN");
  assert.equal(international.matches.some((match) => match.entityId === "HCMIU_VNUHCM"), false);
});

test("specific HCMIU wording still resolves to its official identity", () => {
  const result = EntityResolutionService.resolveEntitiesDetailed("Đại học Quốc tế ĐHQG TP.HCM");

  assert.equal(result.status, "RESOLVED");
  assert.equal(result.matches[0].entityId, "HCMIU_VNUHCM");
  assert.equal(result.matches[0].officialDomain, "hcmiu.edu.vn");
});
