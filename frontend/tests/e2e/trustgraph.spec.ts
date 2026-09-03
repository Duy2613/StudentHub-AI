import { expect, test } from "@playwright/test";
import { completeTextScan, mockTrustPipeline } from "./fixtures/trust";

test("TrustGraph supports filters, zoom, inspection, list mode and empty state", async ({ page }) => {
  await mockTrustPipeline(page);
  await completeTextScan(page);
  const graph = page.locator("section", { has: page.getByRole("heading", { name: "StudentHub TrustGraph" }) });
  await expect(graph.getByLabel("Đồ thị quan hệ bằng chứng")).toBeVisible();
  await graph.getByRole("button", { name: "SOURCE", exact: true }).click();
  await expect(graph.getByRole("heading", { name: "StudentHub Safety" })).toBeVisible();
  await expect(graph.getByText("được hỗ trợ bởi")).toBeVisible();
  await expect(graph.getByLabel("Chú giải loại node")).toContainText("SOURCE");
  await graph.getByRole("button", { name: "Phóng to" }).click();
  await graph.getByRole("button", { name: "Xem danh sách" }).click();
  await expect(graph.getByRole("list")).toContainText("Quan hệ:");
  await graph.getByPlaceholder("Tìm claim hoặc nguồn").fill("không tồn tại");
  await expect(graph.getByText("Không tìm thấy node phù hợp.")).toBeVisible();
});
