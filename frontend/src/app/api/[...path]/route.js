// frontend/src/app/api/[...path]/route.js
// Next.js API Proxy Route Handler: chuyển tiếp request từ frontend tới Backend ASP.NET Core
// Giải quyết triệt để vấn đề CORS & Preflight 405 khi gọi từ trình duyệt.

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://studenthub-api-8fqp.onrender.com";

async function proxyRequest(req, context) {
  try {
    const { path } = await context.params;
    const pathStr = Array.isArray(path) ? path.join("/") : path;
    const url = new URL(req.url);
    const search = url.search || "";
    const targetUrl = `${BACKEND_URL}/api/${pathStr}${search}`;

    const headers = new Headers();
    // Chuyển tiếp các header quan trọng
    const authHeader = req.headers.get("authorization");
    if (authHeader) headers.set("authorization", authHeader);

    const contentType = req.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    const method = req.method;
    let body = null;
    if (method !== "GET" && method !== "HEAD") {
      body = await req.text();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout cho Render cold start

    const backendRes = await fetch(targetUrl, {
      method,
      headers,
      body: body ? body : undefined,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const resContentType = backendRes.headers.get("content-type") || "";
    let data;
    if (resContentType.includes("application/json")) {
      data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    } else {
      const text = await backendRes.text();
      return new NextResponse(text, {
        status: backendRes.status,
        headers: { "content-type": resContentType || "text/plain" },
      });
    }
  } catch (error) {
    console.error("[API Proxy Error]:", error);
    return NextResponse.json(
      {
        message: error.name === "AbortError"
          ? "Máy chủ đang khởi động (Render Cold Start), vui lòng thử lại sau vài giây."
          : "Không thể kết nối đến máy chủ Backend ASP.NET Core.",
        error: error.message,
      },
      { status: 502 }
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
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
