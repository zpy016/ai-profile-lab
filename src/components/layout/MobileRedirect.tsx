"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Client-side mobile detection as a supplementary check.
 * The middleware already handles this server-side, but this provides
 * an immediate client-side redirect for SPA navigation as well.
 */
export default function MobileRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/mobile") return;

    const width = window.innerWidth;
    if (width < 1024) {
      router.replace("/mobile");
    }
  }, [pathname, router]);

  return null;
}
