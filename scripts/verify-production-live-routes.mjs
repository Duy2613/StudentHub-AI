const baseUrl = "https://student-hub-ai-topaz.vercel.app";

async function checkRoute(path, method = "GET", body = null) {
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    return {
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get("content-type") || "",
      location: res.headers.get("location") || null,
    };
  } catch (err) {
    return { status: "ERROR", error: err.message };
  }
}

async function main() {
  console.log("=== VERIFYING LIVE PRODUCTION ROUTES ===");
  console.log("Base URL:", baseUrl);

  // 1. /academic page
  const academicPage = await checkRoute("/academic");
  console.log("\n/academic Page:", academicPage.status);

  // 2. Private Timetable APIs (unauthenticated)
  // They should return canonical auth denial (401 or 403 or 422 or redirect), NOT 404!
  const timetableApi = await checkRoute("/api/academic/timetable");
  console.log("/api/academic/timetable (GET unauth):", timetableApi.status, timetableApi.status !== 404 ? "PASS (NOT 404)" : "FAIL (404)");

  const importApi = await checkRoute("/api/academic/timetable/import", "POST", {});
  console.log("/api/academic/timetable/import (POST unauth):", importApi.status, importApi.status !== 404 ? "PASS (NOT 404)" : "FAIL (404)");

  const confirmApi = await checkRoute("/api/academic/timetable/confirm", "POST", {});
  console.log("/api/academic/timetable/confirm (POST unauth):", confirmApi.status, confirmApi.status !== 404 ? "PASS (NOT 404)" : "FAIL (404)");

  const remindersApi = await checkRoute("/api/academic/timetable/reminders");
  console.log("/api/academic/timetable/reminders (GET unauth):", remindersApi.status, remindersApi.status !== 404 ? "PASS (NOT 404)" : "FAIL (404)");

  // 3. Contract check removal
  const contractPage = await checkRoute("/contract-check");
  console.log("\n/contract-check Page:", contractPage.status, (contractPage.status === 404 || contractPage.status === 307 || contractPage.status === 308) ? "PASS (404/Redirect)" : "FAIL");

  const contractApi = await checkRoute("/api/contract-check/analyze", "POST", {});
  console.log("/api/contract-check/analyze API:", contractApi.status, contractApi.status === 404 ? "PASS (404 ABSENT)" : "FAIL");

  // 4. Trust page HTML verification (check if "Hợp đồng" tab is absent)
  const trustRes = await fetch(`${baseUrl}/trust`);
  const trustHtml = await trustRes.text();
  const hasHopDongTab = /tab.*hợp đồng|Hợp đồng/i.test(trustHtml) && !/hợp đồng kỹ thuật/i.test(trustHtml);
  console.log("Trust Page /trust status:", trustRes.status);
  console.log("Trust page has user-facing 'Hợp đồng' contract tab:", hasHopDongTab ? "FAIL (FOUND)" : "PASS (ABSENT)");
}

main().catch(console.error);
