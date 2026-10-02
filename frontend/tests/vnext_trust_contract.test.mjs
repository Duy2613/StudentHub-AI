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

test("Trust route delegates to the current workspace and keeps evidence limits explicit", () => {
  const route = read("src/app/trust/page.jsx");
  const routeClient = read("src/components/trust/TrustWorkspaceClient.jsx");
  const workspace = read("src/components/trust/TrustV4Workspace.jsx");
  const journey = read("src/components/trust/TrustMasterUltraJourney.jsx");
  const result = read("src/components/trust/TrustV4Result.jsx");
  const model = read("src/lib/trust/trustV4Model.js");
  const css = read("src/components/trust/trust-v4.module.css");
  const globalCss = read("src/app/globals.css");

  assert.match(route, /<TrustWorkspaceClient\s*\/>/);
  assert.match(routeClient, /import TrustV4Workspace from ["']\.\/TrustV4Workspace["']/);
  assert.match(routeClient, /return <TrustV4Workspace\s*\/>/);
  assert.match(workspace, /<h1>Hiểu rõ trước khi tin\.<\/h1>/);
  assert.match(workspace, /<TrustMasterUltraJourney/);
  assert.match(journey, /Chỉ mở khi backend công bố kết quả cuối cùng/);
  assert.match(journey, /data-primary-layer-count="4"/);
  assert.match(journey, /id: "text", label: "Văn bản"[\s\S]*id: "url", label: "Đường dẫn"[\s\S]*id: "image", label: "Hình ảnh"[\s\S]*id: "qr", label: "Mã QR"/);
  assert.match(journey, /master-ultra-composer \$\{hideHero \? "is-compact"/);
  assert.match(globalCss, /\.master-ultra-composer\.is-compact\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(globalCss, /\.master-ultra-mode-switch\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(model, /INSUFFICIENT_EVIDENCE:\s*"Chưa đủ bằng chứng để kết luận"/);
  assert.match(result, /Liên kết do AI tham chiếu không tự trở thành bằng chứng/);
  assert.match(result, /Nguồn xuất hiện trong danh sách không tự chứng minh mệnh đề/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\(max-width:600px\)/);
  assert.doesNotMatch(workspace, /CinematicTaskBackdrop|FILM 02|24FPS LOOP/);
});
