import { NextResponse } from "next/server";
import { getAuthCapabilities, AUTH_CAPABILITY_STATE } from "@/lib/auth/authCapabilities.js";

export const runtime = "nodejs";

async function probeSupabaseServerSettings() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || rawUrl.includes("placeholder")) {
    return { reachable: false, error: "MISSING_URL" };
  }

  if (!publishableKey || publishableKey.includes("placeholder")) {
    return { reachable: false, error: "MISSING_PUBLISHABLE_KEY" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const settingsUrl = `${rawUrl.replace(/\/$/, "")}/auth/v1/settings`;

    const res = await fetch(settingsUrl, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        apikey: publishableKey,
      },
    });

    if (!res.ok) {
      return {
        reachable: false,
        error: "AUTH_SETTINGS_HTTP_ERROR",
        status: res.status,
      };
    }

    const data = await res.json();
    return {
      reachable: true,
      emailEnabled: data?.external?.email !== false,
      googleEnabled: Boolean(data?.external?.google),
      githubEnabled: Boolean(data?.external?.github),
    };
  } catch (error) {
    return {
      reachable: false,
      error: error?.name === "AbortError" ? "TIMEOUT" : "UNREACHABLE",
    };
  } finally {
    clearTimeout(timeoutId);
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
      status: probe.status || null,
    },
  };

  if (!probe.reachable) {
    capabilities.emailPassword = AUTH_CAPABILITY_STATE.DEGRADED;
    capabilities.emailPasswordReason = probe.error || "AUTH_SERVER_UNREACHABLE";
    capabilities.emailPasswordMessage =
      "Máy chủ xác thực hiện tạm thời không phản hồi. Vui lòng thử lại sau.";

    capabilities.google = AUTH_CAPABILITY_STATE.DEGRADED;
    capabilities.googleReason = probe.error || "AUTH_SERVER_UNREACHABLE";
    capabilities.googleMessage =
      "Máy chủ xác thực hiện tạm thời không phản hồi. Vui lòng thử lại sau.";

    capabilities.github = AUTH_CAPABILITY_STATE.DEGRADED;
    capabilities.githubReason = probe.error || "AUTH_SERVER_UNREACHABLE";
    capabilities.githubMessage =
      "Máy chủ xác thực hiện tạm thời không phản hồi. Vui lòng thử lại sau.";
  } else {
    // Server-authoritative override: environment flags ALONE must not produce a false READY state.
    if (capabilities.google === AUTH_CAPABILITY_STATE.READY && !probe.googleEnabled) {
      capabilities.google = AUTH_CAPABILITY_STATE.DISABLED;
      capabilities.googleReason = "GOOGLE_AUTH_BLOCKED_BY_PROVIDER_CONFIGURATION";
      capabilities.googleMessage =
        "Google OAuth chưa được kích hoạt trên hệ thống máy chủ xác thực (Dashboard provider disabled).";
    }

    if (capabilities.github === AUTH_CAPABILITY_STATE.READY && !probe.githubEnabled) {
      capabilities.github = AUTH_CAPABILITY_STATE.DISABLED;
      capabilities.githubReason = "GITHUB_AUTH_BLOCKED_BY_PROVIDER_CONFIGURATION";
      capabilities.githubMessage =
        "GitHub OAuth chưa được kích hoạt trên hệ thống máy chủ xác thực (Dashboard provider disabled).";
    }

    if (capabilities.emailPassword === AUTH_CAPABILITY_STATE.READY && !probe.emailEnabled) {
      capabilities.emailPassword = AUTH_CAPABILITY_STATE.DISABLED;
      capabilities.emailPasswordReason = "EMAIL_AUTH_DISABLED_ON_SERVER";
      capabilities.emailPasswordMessage =
        "Đăng ký và đăng nhập Email hiện bị tắt trên máy chủ xác thực.";
    }
  }

  return NextResponse.json(capabilities, {
    headers: { "cache-control": "no-store" },
  });
}
