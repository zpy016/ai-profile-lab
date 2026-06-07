"use client";

import { useEffect, useState } from "react";

export default function MobilePage() {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.origin);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-bg px-6">
      <div className="bg-surface rounded-md px-8 py-10 text-center max-w-[360px] w-full shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center text-brand-dark opacity-60">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="6" width="40" height="28" rx="3" />
            <path d="M16 38h16" />
            <path d="M24 34v4" />
            <path d="M4 22h40" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="font-serif text-h1 text-text-primary mb-2">
          请使用电脑访问
        </h1>

        {/* Description */}
        <p className="text-body text-text-secondary leading-relaxed mb-5">
          这是一个桌面端应用，请在电脑浏览器中打开以下地址
        </p>

        {/* URL Copy */}
        <div className="flex items-center justify-center gap-2 p-2.5 bg-elevated rounded-sm mb-5">
          <code className="font-mono text-[13px] text-text-primary break-all">
            {url}
          </code>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded-sm hover:bg-primary-surface transition-colors"
          >
            {copied ? "已复制" : "复制链接"}
          </button>
        </div>

        {/* Footer */}
        <p className="text-[13px] text-text-placeholder leading-relaxed">
          大屏幕体验更好，AI 和你都需要舒适的空间
        </p>
      </div>
    </main>
  );
}
