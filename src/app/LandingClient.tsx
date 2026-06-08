"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProfileState = "empty" | "draft" | "active" | "dirty";

export default function LandingClient() {
  const [profileState, setProfileState] = useState<ProfileState>("active");
  const [deltaCount, setDeltaCount] = useState(2);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile/test-user-001");
        if (!res.ok) {
          setProfileState("empty");
          return;
        }
        const data = await res.json();
        if (data.status === "draft") setProfileState("draft");
        else if (data.hasUnconfirmedDelta) {
          setProfileState("dirty");
          // Count delta items
          const deltaTags = data.tags?.filter((t: { isDelta: boolean }) => t.isDelta).length || 0;
          const deltaIntro = data.aiDeltaIntro ? 1 : 0;
          setDeltaCount(deltaTags + deltaIntro);
        } else setProfileState("active");
      } catch {
        setProfileState("empty");
      }
    }
    fetchProfile();
  }, []);

  return (
    <main>
      <div className="container--narrow">
        {/* Hero */}
        <div className="text-center pt-[48px] pb-[32px]">
          <div className="font-serif text-[20px] font-semibold text-brand-dark tracking-[0.02em] mb-1">
            实验同学录
          </div>
          <div className="text-sm text-text-placeholder mb-6">
            2006 届校友的数字纪念册
          </div>
          <div className="w-[60px] h-[2px] bg-accent mx-auto mb-6 rounded-[1px]" />
          <h1 className="font-serif text-display text-text-heading mb-6">
            用 AI 重新认识彼此
          </h1>
          <p className="text-body-lg text-text-secondary leading-relaxed max-w-[480px] mx-auto mb-8">
            告诉 AI 你是谁，它帮你写出你的数字档案。克制、体面、有温度。
          </p>
        </div>

        {/* CTA Cards */}
        <div className="mb-8">
          {profileState === "empty" && (
            <div className="card border-primary flex items-center justify-between cursor-pointer hover:shadow-md transition-all">
              <div className="flex-1">
                <div className="text-h2 text-text-primary mb-1">创建我的主页</div>
                <div className="text-body text-text-secondary">
                  让 AI 帮你整理 2006 年的回忆和现在的生活
                </div>
              </div>
              <Link href="/create" className="btn-primary">
                开始创建
              </Link>
            </div>
          )}

          {profileState === "dirty" && (
            <>
              <Link
                href="/profile/test-user-001"
                className="flex items-center gap-2 px-4 py-2.5 bg-accent-surface border border-accent rounded-md mb-6 text-sm font-medium text-text-primary no-underline hover:opacity-90 transition-opacity"
              >
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-[10px] px-1.5 text-xs font-semibold bg-accent text-[#FFFAF5]">
                  {deltaCount}
                </span>
                <span>
                  你有 {deltaCount} 条 AI 更新待确认
                </span>
                <span className="ml-auto text-[13px] text-accent font-medium">
                  查看 →
                </span>
              </Link>
              <div className="card flex items-center justify-between cursor-pointer hover:shadow-md transition-all">
                <div className="flex-1">
                  <div className="text-h2 text-text-primary mb-1">查看我的主页</div>
                  <div className="text-body text-text-secondary">
                    张明远 · 2006 届高三（3）班 · 有未确认的 AI 更新
                  </div>
                </div>
                <Link href="/profile/test-user-001" className="btn-primary">
                  进入
                </Link>
              </div>
            </>
          )}

          {profileState === "draft" && (
            <>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-elevated border border-border rounded-md mb-6 text-sm font-medium text-text-primary">
                <span>✎</span>
                <span>你的主页尚未发布，其他校友暂时看不到</span>
              </div>
              <div className="card border-primary flex items-center justify-between cursor-pointer hover:shadow-md transition-all">
                <div className="flex-1">
                  <div className="text-h2 text-text-primary mb-1">继续创建</div>
                  <div className="text-body text-text-secondary">
                    你有一个未完成的草稿，快速创建模式
                  </div>
                </div>
                <Link href="/create/quick" className="btn-primary">
                  继续
                </Link>
              </div>
            </>
          )}

          {profileState === "active" && (
            <div
              className="card flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
              onClick={() => (window.location.href = "/profile/test-user-001")}
            >
              <div className="flex-1">
                <div className="text-h2 text-text-primary mb-1">查看我的主页</div>
                <div className="text-body text-text-secondary">
                  张明远 · 2006 届高三（3）班
                </div>
              </div>
              <Link href="/profile/test-user-001" className="btn-primary">
                进入
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-8 border-t border-border-light mt-12">
          <Link href="/admin" className="text-[13px] text-primary font-medium no-underline hover:text-primary-hover transition-colors">
            AI Lab 后台
          </Link>
        </div>
      </div>
    </main>
  );
}
