import { NextResponse } from "next/server";
import { getAuthCapabilities, AUTH_CAPABILITY_STATE } from "@/lib/auth/authCapabilities.js";

export const runtime = "nodejs";

async function probeSupabaseServerSettings() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl || rawUrl.includes("placeholder")) {
    return { reachable: false, error: "MISSING_URL" };
  }

  try {
    const settingsUrl = `${rawUrl.replace(/\/$/, "")}/auth/v1/settings`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(settingsUrl, {
      signal: controller.signal,
      headers: { "Accept": "application/json" }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { reachable: false, status: res.status };
    }

    const data = await res.json();
    return {
      reachable: true,
      emailEnabled: data?.external?.email !== false,
      googleEnabled: Boolean(data?.external?.google),
      githubEnabled: Boolean(data?.external?.github),
      rawExternal: data?.external || {}
    };
  } catch (error) {
    return { reachable: false, error: error?.name === "AbortError" ? "TIMEOUT" : "UNREACHABLE" };
  }
}

export async function GET() {
  const envCapabilities = getAuthCapabilities();
  const probe = await probeSupabaseServerSettings();

  const capabilities = {
    ...envCapabilities,
    serverProbe: {
      performed: true,
      reachable: probe.reachable,
      error: probe.error || null,
    }
  };

  if (!probe.reachable) {
    capabilities.emailPassword = AUTH_CAPABILITY_STATE.DEGRADED;
    capabilities.emailPasswordReason = "AUTH_SERVER_UNREACHABLE";
    capabilities.emailPasswordMessage = "Máy chủ xác thực hiện tạm thời không phản hồi. Vui lòng thử lại sau.";

    capabilities.google = AUTH_CAPABILITY_STATE.DEGRADED;
    capabilities.googleReason = "AUTH_SERVER_UNREACHABLE";
    capabilities.googleMessage = "Máy chủ xác thực hiện tạm thời không phản hồi. Vui lòng thử lại sau.";

    capabilities.github = AUTH_CAPABILITY_STATE.DEGRADED;
    capabilities.githubReason = "AUTH_SERVER_UNREACHABLE";
    capabilities.githubMessage = "Máy chủ xác thực hiện tạm thời không phản hồi. Vui lòng thử lại sau.";
  } else {
    // Server-authoritative override: environment flags ALONE must not produce a false READY state
    if (capabilities.google === AUTH_CAPABILITY_STATE.READY && !probe.googleEnabled) {
      capabilities.google = AUTH_CAPABILITY_STATE.DISABLED;
      capabilities.googleReason = "GOOGLE_AUTH_BLOCKED_BY_PROVIDER_CONFIGURATION";
      capabilities.googleMessage = "Google OAuth chưa được kích hoạt trên hệ thống máy chủ xác thực (Dashboard provider disabled).";
    }

    if (capabilities.github === AUTH_CAPABILITY_STATE.READY && !probe.githubEnabled) {
      capabilities.github = AUTH_CAPABILITY_STATE.DISABLED;
      capabilities.githubReason = "GITHUB_AUTH_BLOCKED_BY_PROVIDER_CONFIGURATION";
      capabilities.githubMessage = "GitHub OAuth chưa được kích hoạt trên hệ thống máy chủ xác thực (Dashboard provider disabled).";
    }

    if (capabilities.emailPassword === AUTH_CAPABILITY_STATE.READY && !probe.emailEnabled) {
      capabilities.emailPassword = AUTH_CAPABILITY_STATE.DISABLED;
      capabilities.emailPasswordReason = "EMAIL_AUTH_DISABLED_ON_SERVER";
      capabilities.emailPasswordMessage = "Đăng ký và đăng nhập Email hiện bị tắt trên máy chủ xác thực.";
    }
  }

  return NextResponse.json(capabilities, {
    headers: { "cache-control": "no-store" }
  });
}
