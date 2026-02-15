// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const url = req.nextUrl;

  const isProtocolSubdomain =
    host === "protocol.hash42.xyz" || host.startsWith("protocol.hash42.xyz:");

  const p = url.pathname;
  const isNext =
    p.startsWith("/_next") ||
    p.startsWith("/favicon") ||
    p.startsWith("/assets") ||
    p.startsWith("/robots.txt") ||
    p.startsWith("/sitemap.xml") ||
    p.startsWith("/.well-known") ||
    p.startsWith("/api");

  if (isNext) return NextResponse.next();

  // On protocol.hash42.xyz serve the app from /app/*
  if (isProtocolSubdomain) {
    if (!p.startsWith("/app")) {
      url.pathname = `/app${p === "/" ? "" : p}`;
      return NextResponse.rewrite(url);
    }
  }

  // Optional: block direct access to internal /app on main domain
  if (!isProtocolSubdomain && p.startsWith("/app")) {
    url.pathname = "/";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };