"use client";

import { useState, useEffect } from "react";
import ResultRenderer, { SandboxResult, SandboxTag, SandboxBlock } from "./ResultRenderer";

const TEST_PROFILES = [
  { id: "test-user-001", name: "张明远", className: "高三（3）班" },
  { id: "test-user-002", name: "李晓雯", className: "高三（1）班" },
  { id: "test-user-003", name: "王建国", className: "高三（5）班" },
  { id: "test-user-004", name: "陈思琪", className: "高三（2）班" },
  { id: "test-user-005", name: "刘浩宇", className: "高三（4）班" },
];

interface ProfileData {
  id: string;
  userName: string;
  className: string;
  userConfirmedIntro: string;
  aiDeltaIntro: string;
  tags: Array<{ id: string; tagText: string; tagType: string; isDelta: boolean }>;
  blocks: Array<{ id: string; category: string; label: string; text: string }>;
}

interface Props {
  showToast: (msg: string) => void;
}

export default function DeltaSandbox({ showToast }: Props) {
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [deltaInput, setDeltaInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [deltaResult, setDeltaResult] = useState<SandboxResult | null>(null);

  // Load profile
  useEffect(() => {
    if (!selectedProfileId) {
      setProfile(null);
      setDeltaResult(null);
      return;
    }
    setLoadingProfile(true);
    fetch(`/api/profile/${selectedProfileId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setProfile(data);
        setDeltaResult(null);
      })
      .catch(() => {
        // If profile doesn't exist in DB, create a mock one
        const mock = TEST_PROFILES.find((p) => p.id === selectedProfileId);
        if (mock) {
          setProfile({
            id: mock.id,
            userName: mock.name,
            className: mock.className,
            userConfirmedIntro: "",
            aiDeltaIntro: "",
            tags: [],
            blocks: [],
          });
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [selectedProfileId]);

  const currentTags: SandboxTag[] = profile?.tags.map((t) => ({
    name: t.tagText,
    type: t.tagType,
  })) || [];

  const currentBlocks: SandboxBlock[] = profile?.blocks.map((b) => ({
    category: b.category,
    label: b.label,
    text: b.text,
  })) || [];

  const handleGenerateDelta = async () => {
    if (!deltaInput.trim() || !profile) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/extract-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: deltaInput.trim(),
          userId: selectedProfileId,
          existingContext: {
            tags: currentTags,
            intro: profile.userConfirmedIntro || "",
            blocks: currentBlocks,
          },
        }),
      });
      if (!res.ok) {
        showToast("增量生成失败");
        setIsGenerating(false);
        return;
      }
      const data = await res.json();
      const normalized: SandboxResult = {
        intro: profile.userConfirmedIntro || data.intro || "",
        delta_intro: data.delta_intro || "",
        tags: [
          ...currentTags,
          ...(data.delta_tags || []).map((t: any) => ({
            name: t.text || t.name || String(t),
            type: t.type || "delta",
            delta: true,
          })),
        ],
        content_blocks: [
          ...currentBlocks,
          ...(data.content_blocks || []).map((b: any) => ({
            category: b.category || b.cat || "custom",
            label: b.label || b.category || "内容",
            text: b.content || b.text || "",
            delta: true,
          })),
        ],
      };
      setDeltaResult(normalized);
      showToast("增量生成完成");
    } catch {
      showToast("网络错误");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmDeltaIntro = () => {
    if (!deltaResult?.delta_intro || !profile) return;
    const merged = profile.userConfirmedIntro
      ? profile.userConfirmedIntro + " " + deltaResult.delta_intro
      : deltaResult.delta_intro;
    setProfile({ ...profile, userConfirmedIntro: merged });
    setDeltaResult({ ...deltaResult, delta_intro: undefined });
    showToast("增量简介已合并到档案");
  };

  const handleRejectDeltaIntro = () => {
    if (!deltaResult) return;
    setDeltaResult({ ...deltaResult, delta_intro: undefined });
    showToast("增量简介已抹除");
  };

  const handleConfirmDeltaTag = (tag: SandboxTag) => {
    if (!deltaResult) return;
    setDeltaResult({
      ...deltaResult,
      tags: deltaResult.tags.map((t) =>
        t.name === tag.name ? { ...t, type: t.type === "delta" ? "belong" : t.type, delta: false } : t
      ),
    });
    showToast(`标签「${tag.name}」已确认加入档案`);
  };

  const handleRejectDeltaTag = (tag: SandboxTag) => {
    if (!deltaResult) return;
    setDeltaResult({
      ...deltaResult,
      tags: deltaResult.tags.filter((t) => t.name !== tag.name),
    });
    showToast(`标签「${tag.name}」已拒绝`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Profile Selector */}
      <div className="px-5 py-3 border-b border-border-light bg-surface">
        <label className="block text-[13px] font-medium text-text-primary mb-1.5">选择测试档案</label>
        <select
          className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface cursor-pointer appearance-none focus:outline-none focus:border-brand-dark"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%23546E7A' stroke-width='1.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            paddingRight: "32px",
          }}
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value)}
        >
          <option value="">请选择...</option>
          {TEST_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>{p.name} · {p.className}</option>
          ))}
        </select>
      </div>

      {/* Profile Content */}
      {loadingProfile && (
        <div className="flex-1 flex items-center justify-center text-text-placeholder text-sm">加载中...</div>
      )}

      {!loadingProfile && profile && (
        <div className="flex-1 overflow-y-auto">
          {/* Current Profile Preview */}
          <div className="px-5 py-3 border-b border-border-light">
            <div className="text-[11px] font-medium text-text-secondary mb-2">当前档案</div>
            <div className="bg-elevated rounded-md p-3 border border-border-light">
              <div className="text-sm font-medium text-text-primary mb-1">{profile.userName} · {profile.className}</div>
              {profile.userConfirmedIntro && (
                <p className="text-xs text-text-secondary mb-2">{profile.userConfirmedIntro}</p>
              )}
              {currentTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {currentTags.map((t, i) => (
                    <span key={i} className={`tag text-[10px] tag--${t.type} py-0.5 px-1.5`}>{t.name}</span>
                  ))}
                </div>
              )}
              {currentBlocks.length === 0 && currentTags.length === 0 && !profile.userConfirmedIntro && (
                <div className="text-xs text-text-placeholder">（空档案，无内容）</div>
              )}
            </div>
          </div>

          {/* Delta Input */}
          <div className="px-5 py-3 border-b border-border-light">
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">新增信息</label>
            <textarea
              className="w-full border border-border rounded-sm p-3 text-sm leading-relaxed resize-y min-h-[80px] focus:outline-none focus:border-brand-dark"
              placeholder="输入新增信息，例如：最近我开始学吉他了，想找校友组乐队..."
              value={deltaInput}
              onChange={(e) => setDeltaInput(e.target.value)}
            />
            <button
              className="btn-primary w-full mt-2 gap-1.5"
              onClick={handleGenerateDelta}
              disabled={isGenerating || !deltaInput.trim()}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="20" strokeLinecap="round" />
                  </svg>
                  生成增量中...
                </>
              ) : (
                <>🔍 生成增量更新</>
              )}
            </button>
          </div>

          {/* Delta Result */}
          {deltaResult && (
            <div className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-text-primary">增量建议</span>
                <span className="text-[10px] text-text-placeholder">可确认或拒绝</span>
              </div>
              <ResultRenderer
                data={deltaResult}
                onChange={setDeltaResult}
                showDeltaActions={true}
                onConfirmDeltaIntro={handleConfirmDeltaIntro}
                onRejectDeltaIntro={handleRejectDeltaIntro}
                onConfirmDeltaTag={handleConfirmDeltaTag}
                onRejectDeltaTag={handleRejectDeltaTag}
              />
            </div>
          )}
        </div>
      )}

      {!loadingProfile && !profile && (
        <div className="flex-1 flex flex-col items-center justify-center text-text-placeholder">
          <div className="text-4xl mb-3">📂</div>
          <div className="text-sm">选择一个测试档案</div>
          <div className="text-xs mt-1">或选择空档案从头开始</div>
        </div>
      )}
    </div>
  );
}
