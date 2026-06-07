"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  // Pages without full top nav (admin has its own, mobile redirect)
  if (pathname === "/mobile") return null;

  const showBack = pathname !== "/";

  const getBackLink = () => {
    if (pathname.startsWith("/create/quick") || pathname.startsWith("/create/interview"))
      return "/create";
    if (pathname.startsWith("/admin")) return "/";
    if (pathname.startsWith("/profile")) return "/";
    return "/";
  };

  const getTitle = () => {
    if (pathname === "/") return "实验同学录";
    if (pathname === "/create") return "创建个人主页";
    if (pathname.startsWith("/create/quick")) return "快速创建";
    if (pathname.startsWith("/create/interview")) return "AI 采访模式";
    if (pathname.startsWith("/profile")) return "个人主页";
    if (pathname.startsWith("/admin")) return "AI Lab";
    return "实验同学录";
  };

  return (
    <nav className="top-nav">
      <div className="flex items-center gap-4">
        {showBack && (
          <Link href={getBackLink()} className="text-sm font-medium text-brand-dark hover:text-primary transition-colors flex items-center gap-1">
            ← 返回
          </Link>
        )}
        <span className="top-nav__brand">{getTitle()}</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="nav-gear"
          title="AI Lab 后台"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="9" cy="9" r="2.5"/>
            <path d="M9 1.5v2M9 14.5v2M2.5 9h2M13.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4"/>
          </svg>
        </Link>
      </div>
    </nav>
  );
}
