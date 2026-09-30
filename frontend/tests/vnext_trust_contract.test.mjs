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
  const result = read("src/components/trust/TrustV4Result.jsx");
  const model = read("src/lib/trust/trustV4Model.js");
  const css = read("src/components/trust/trust-v4.module.css");

  assert.match(route, /<TrustWorkspaceClient\s*\/>/);
  assert.match(routeClient, /import TrustV4Workspace from ["']\.\/TrustV4Workspace["']/);
  assert.match(routeClient, /return <TrustV4Workspace\s*\/>/);
  assert.match(workspace, /<h1>Hiểu rõ trước khi tin\.<\/h1>/);
  assert.match(workspace, /Bằng chứng trước\.<br\s*\/>Kết luận sau\./);
  assert.match(workspace, /Không phải mọi thông tin đều có đủ bằng chứng để kết luận\./);
  assert.match(workspace, /\[\["text", "Văn bản"[\s\S]*\["qr", "Mã QR"/);
  assert.match(model, /INSUFFICIENT_EVIDENCE:\s*"Chưa đủ bằng chứng để kết luận"/);
  assert.match(result, /Liên kết do AI tham chiếu không tự trở thành bằng chứng/);
  assert.match(result, /Nguồn xuất hiện trong danh sách không tự chứng minh mệnh đề/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\(max-width:600px\)/);
  assert.doesNotMatch(workspace, /CinematicTaskBackdrop|FILM 02|24FPS LOOP/);
});
