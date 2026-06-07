import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Mobile redirect middleware.
 * POC is desktop-only (≥1024px). Mobile/tablet users are redirected to /mobile.
 *
 * Bypass methods (for local dev/debugging):
 *   1. Add ?desktop=1 to any URL — e.g., http://localhost:3000/?desktop=1
 *   2. Turn off DevTools "Device Toolbar" in Chrome (it spoofs a mobile UA)
 *   3. If your browser has a mobile User-Agent, the middleware will redirect
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip middleware for API routes, static assets, and the mobile page itself
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/mobile" ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Debug bypass: ?desktop=1 skips mobile detection
  if (searchParams.get("desktop") === "1") {
    return NextResponse.next();
  }

  // Also skip redirect for localhost/127.0.0.1 during development
  const host = request.headers.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    // In dev mode, only redirect if UA is clearly mobile AND not desktop
    const userAgent = (request.headers.get("user-agent") || "").toLowerCase();

    // Explicit desktop indicators — never redirect these
    const isDesktop = /macintosh|windows nt|linux|x11|cros/i.test(userAgent) &&
      !/android|iphone|ipad|ipod|mobile/i.test(userAgent);

    // Only redirect if UA is unambiguously mobile (not desktop)
    if (!isDesktop) {
      const isMobileUA = /android|iphone|ipad|ipod|webos|blackberry|iemobile|opera mini/i.test(userAgent);
      if (isMobileUA) {
        const url = request.nextUrl.clone();
        url.pathname = "/mobile";
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  }

  // Production: strict UA-based redirect
  const userAgent = request.headers.get("user-agent") || "";
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  if (isMobile) {
    const url = request.nextUrl.clone();
    url.pathname = "/mobile";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
