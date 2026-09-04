// frontend/src/app/api/[...path]/route.js
// Next.js API Proxy Route Handler: chuyển tiếp request từ frontend tới Backend ASP.NET Core
// Giải quyết triệt để vấn đề CORS & Preflight 405 khi gọi từ trình duyệt.

import { NextResponse } from "next/server";
import { validateRemoteUrlSync } from "@/lib/security/hardening/SafeRemoteUrl.js";
import { RateLimiter } from "@/lib/security/hardening/RateLimiter.js";

const BACKEND_URL = process.env.STUDENTHUB_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL
  || "https://studenthub-api-8fqp.onrender.com";
const MAX_PROXY_BODY_BYTES = 64 * 1024;
const MAX_PROXY_RESPONSE_BYTES = 2 * 1024 * 1024;
const ALLOWED_AUTH_PROXY_CONTRACTS = new Map([
  ["auth/login", new Set(["POST"])],
  ["auth/register", new Set(["POST"])],
  ["auth/me", new Set(["GET"])],
]);

async function proxyRequest(req, context) {
  try {
    const params = context?.params ? await context.params : {};
    const path = params?.path || [];
    const pathStr = Array.isArray(path) ? path.join("/") : (path || "");
    const method = req.method.toUpperCase();
    const allowedMethods = ALLOWED_AUTH_PROXY_CONTRACTS.get(pathStr);
    if (!allowedMethods?.has(method)) {
      return NextResponse.json({ message: "API route not found." }, { status: 404 });
    }

    const backendGuard = validateRemoteUrlSync(BACKEND_URL);
    if (!backendGuard.ok) {
      return NextResponse.json({ error: { code: "AUTH_BACKEND_UNAVAILABLE", userMessage: "Dịch vụ xác thực hiện chưa khả dụng." } }, { status: 503 });
    }
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    RateLimiter.assertRateLimit(`auth-proxy:${clientIp}:${pathStr}:${method}`, 60, 60);

    const url = new URL(req.url);
    const search = url.search || "";
    const targetUrl = `${backendGuard.url.replace(/\/$/, "")}/api/${pathStr}${search}`;


    const headers = new Headers();
    // Chuyển tiếp các header quan trọng
    const authHeader = req.headers.get("authorization");
    if (authHeader) headers.set("authorization", authHeader);

    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    let body = null;
    if (method !== "GET" && method !== "HEAD") {
      body = await req.text();
      if (new TextEncoder().encode(body).byteLength > MAX_PROXY_BODY_BYTES) {
        return NextResponse.json({ message: "Request body is too large." }, { status: 413 });
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout cho Render cold start

    const backendRes = await fetch(targetUrl, {
      method,
      headers,
      body: body ? body : undefined,
      signal: controller.signal,
      redirect: "manual",
    }).finally(() => clearTimeout(timeoutId));

    const resContentType = backendRes.headers.get("content-type") || "";
    const declaredResponseLength = Number(backendRes.headers.get("content-length") || 0);
    if (Number.isFinite(declaredResponseLength) && declaredResponseLength > MAX_PROXY_RESPONSE_BYTES) {
      return NextResponse.json({ error: { code: "UPSTREAM_RESPONSE_TOO_LARGE", userMessage: "Máy chủ xác thực trả về dữ liệu vượt giới hạn an toàn." } }, { status: 502 });
    }
    const responseText = await backendRes.text();
    if (new TextEncoder().encode(responseText).byteLength > MAX_PROXY_RESPONSE_BYTES) {
      return NextResponse.json({ error: { code: "UPSTREAM_RESPONSE_TOO_LARGE", userMessage: "Máy chủ xác thực trả về dữ liệu vượt giới hạn an toàn." } }, { status: 502 });
    }
    if (resContentType.includes("application/json")) {
      try {
        return NextResponse.json(JSON.parse(responseText), { status: backendRes.status });
      } catch {
        return NextResponse.json({ error: { code: "UPSTREAM_INVALID_RESPONSE", userMessage: "Máy chủ xác thực trả về dữ liệu không hợp lệ." } }, { status: 502 });
      }
    }
    return new NextResponse(responseText, {
      status: backendRes.status,
      headers: { "content-type": resContentType || "text/plain" },
    });
  } catch (error) {
    console.error("[API Proxy Error] request failed");
    const statusCode = Number(error?.statusCode) || (error.name === "AbortError" ? 504 : 502);
    const isRateLimited = statusCode === 429;
    return NextResponse.json(
      {
        error: {
          code: isRateLimited ? "RATE_LIMIT_EXCEEDED" : (error.name === "AbortError" ? "AUTH_BACKEND_TIMEOUT" : "AUTH_BACKEND_UNAVAILABLE"),
          userMessage: isRateLimited
            ? "Quá nhiều yêu cầu, vui lòng thử lại sau."
            : error.name === "AbortError"
            ? "Máy chủ đang khởi động, vui lòng thử lại sau vài giây."
            : "Không thể kết nối đến máy chủ xác thực.",
          retryable: true,
          requestId: req.headers.get("x-request-id") || undefined
        }
      },
      { status: statusCode }
    );
  }
}

export async function GET(req, context) {
  return proxyRequest(req, context);
}

export async function POST(req, context) {
  return proxyRequest(req, context);
}

export async function PUT(req, context) {
  return proxyRequest(req, context);
}

export async function DELETE(req, context) {
  return proxyRequest(req, context);
}

export async function PATCH(req, context) {
  return proxyRequest(req, context);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
