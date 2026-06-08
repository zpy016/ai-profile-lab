"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

// ── Types ──
interface ProfileBlock {
  id: string;
  category: string;
  label: string;
  text: string;
  source: string;
  visibility: "public" | "search_only";
}

interface ProfileTag {
  id: string;
  tagText: string;
  tagType: string;
  source: string;
  visibility: string;
  isDelta: boolean;
}

interface ProfileData {
  id: string;
  userName: string;
  className: string;
  userConfirmedIntro: string;
  aiDeltaIntro: string;
  introSource: string;
  status: string;
  hasUnconfirmedDelta: boolean;
  imageUrl: string;
  imageOutdated: boolean;
  tags: ProfileTag[];
  blocks: ProfileBlock[];
}

const CAT_NAMES: Record<string, string> = {
  self_intro: "自我介绍",
  background: "历史背景",
  offer: "能提供的",
  need: "具体需求",
  custom: "自定义",
};

const TAG_CLASS_MAP: Record<string, string> = {
  belong: "tag--belong",
  offer: "tag--offer",
  need: "tag--need",
  follow: "tag--follow",
};

export default function ProfilePage() {
  const params = useParams();
  const userId = (params.id as string) || "test-user-001";

  // ── Data state ──
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Edit state ──
  const [editMode, setEditMode] = useState(false);
  const [deltaIntroVisible, setDeltaIntroVisible] = useState(true);
  const [deltaIntroAccepted, setDeltaIntroAccepted] = useState(false);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [newBlockCategory, setNewBlockCategory] = useState("custom");
  const [newBlockText, setNewBlockText] = useState("");
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showVisDrawer, setShowVisDrawer] = useState(false);
  const [visTargetBlockId, setVisTargetBlockId] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // ── Toast ──
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Fetch profile data ──
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/profile/${userId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setProfile(null);
          return;
        }
        throw new Error(`Fetch error: ${res.status}`);
      }
      const data = await res.json();
      setProfile({
        ...data,
        tags: data.tags || [],
        blocks: (data.blocks || []).map(b => ({
          id: b.id,
          category: b.category,
          label: CAT_NAMES[b.category] || "自定义",
          text: b.content,
          source: b.source,
          visibility: b.visibility,
        })),
      });
      setDeltaIntroVisible(!!data.aiDeltaIntro);
      setDeltaIntroAccepted(false);
    } catch {
      console.error("Fetch profile error:", e);
      showToast("加载失败，请刷新重试");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Toast ──
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
  }, []);

  // ── Delta Intro Actions ──
  const keepDelta = async () => {
    if (!profile) return;
    const newIntro = profile.userConfirmedIntro
      ? profile.userConfirmedIntro + " " + profile.aiDeltaIntro
      : profile.aiDeltaIntro;

    try {
      const res = await fetch(`/api/profile/${userId}/intro`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intro: newIntro, aiDelta: "", source: "user_edited" }),
      });
      if (!res.ok) throw new Error("Save failed");
      setDeltaIntroAccepted(true);
      await fetchProfile();
      showToast("增量内容已融入正文");
    } catch {
      showToast("保存失败，请重试");
    }
  };

  const rejectDelta = async () => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/profile/${userId}/intro`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intro: profile.userConfirmedIntro, aiDelta: "", source: profile.introSource }),
      });
      if (!res.ok) throw new Error("Save failed");
      setDeltaIntroVisible(false);
      await fetchProfile();
      showToast("已抹除 AI 增量内容");
    } catch {
      showToast("保存失败，请重试");
    }
  };

  // ── Delta Tag Actions ──
  const confirmDeltaTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/profile/${userId}/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      if (!res.ok) throw new Error("Confirm failed");
      await fetchProfile();
      showToast("标签已确认");
    } catch {
      showToast("操作失败，请重试");
    }
  };

  const rejectDeltaTag = async (tagId: string) => {
    try {
      const res = await fetch(`/api/profile/${userId}/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchProfile();
      showToast("已抹除 AI 增量标签");
    } catch {
      showToast("操作失败，请重试");
    }
  };

  // ── Content Block Actions ──
  const startEdit = (block: ProfileBlock) => {
    setEditingBlockId(block.id);
    setEditText(block.text);
  };
  const cancelEdit = () => setEditingBlockId(null);

  const saveEdit = async (blockId: string) => {
    try {
      const res = await fetch(`/api/profile/${userId}/blocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });
      if (!res.ok) throw new Error("Save failed");
      setEditingBlockId(null);
      await fetchProfile();
      showToast("已保存，AI 不会修改您的内容");
    } catch {
      showToast("保存失败，请重试");
    }
  };

  const showDelete = (blockId: string) => {
    setDeleteTargetId(blockId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`/api/profile/${userId}/blocks/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      await fetchProfile();
      showToast("内容块已删除");
    } catch {
      showToast("删除失败，请重试");
    }
  };

  // ── Inline Add Block ──
  const confirmAdd = async () => {
    if (!newBlockText.trim()) return;
    try {
      const res = await fetch(`/api/profile/${userId}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newBlockCategory,
          content: newBlockText.trim(),
          visibility: "public",
          source: "user",
        }),
      });
      if (!res.ok) throw new Error("Add failed");
      setShowInlineAdd(false);
      setNewBlockText("");
      await fetchProfile();
      showToast("已记录，AI 正在补充相关内容");
    } catch {
      showToast("添加失败，请重试");
    }
  };

  // ── Visibility ──
  const toggleVisibility = (blockId: string) => {
    setVisTargetBlockId(blockId);
    setShowVisDrawer(true);
  };

  const confirmVisibility = async () => {
    if (!visTargetBlockId) return;
    const block = profile?.blocks.find((b) => b.id === visTargetBlockId);
    if (!block) return;
    const newVis = block.visibility === "public" ? "search_only" : "public";
    try {
      const res = await fetch(`/api/profile/${userId}/blocks/${visTargetBlockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVis }),
      });
      if (!res.ok) throw new Error("Update failed");
      setShowVisDrawer(false);
      await fetchProfile();
      showToast("可见性已更新");
    } catch {
      showToast("更新失败，请重试");
    }
  };

  // ── Generate Image ──
  const handleUpdateImage = async () => {
    if (!profile) return;
    setIsGeneratingImage(true);
    try {
      const tagsText = profile.tags.map((t) => t.tagText).join(", ");
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: tagsText,
          userId,
          profileId: profile.id,
        }),
      });
      if (!res.ok) throw new Error("Image generation failed");
      const data = await res.json();
      if (data.imageUrl) {
        await fetchProfile();
        showToast(data.source === "placeholder" ? "图片占位已更新" : "图片已更新");
      }
    } catch {
      showToast("图片生成失败");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <main className="py-12 pb-20">
        <div className="container--narrow text-center py-20">
          <div className="skeleton skeleton--text skeleton--text-medium mx-auto mb-4" />
          <div className="skeleton skeleton--text skeleton--text-short mx-auto" />
        </div>
      </main>
    );
  }

  // ── Empty profile state ──
  if (!profile) {
    return (
      <main className="py-12 pb-20">
        <div className="container--narrow text-center py-20">
          <h1 className="font-serif text-display text-text-heading mb-4">个人主页</h1>
          <p className="text-body-lg text-text-secondary mb-8">你还没有创建个人主页</p>
          <a href="/create" className="btn-primary">创建我的主页</a>
        </div>
      </main>
    );
  }

  const targetBlock = profile.blocks.find((b) => b.id === visTargetBlockId);
  const isPublic = targetBlock?.visibility === "public";

  const deltaTags = profile.tags.filter((t) => t.isDelta);
  const hasDelta = profile.hasUnconfirmedDelta || deltaTags.length > 0 || !!profile.aiDeltaIntro;

  return (
    <main className="py-12 pb-20">
      <div className="container--narrow">
        {/* Draft Banner */}
        {profile.status === "draft" && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-elevated border border-border rounded-md mb-6 text-sm text-text-primary font-medium">
            <div className="flex items-center gap-2">
              <span>✎</span>
              <span>你的主页尚未发布，其他校友暂时看不到</span>
            </div>
            <a href="/create/quick" className="text-[13px] font-semibold text-primary hover:text-primary-hover transition-colors no-underline">
              继续创建 →
            </a>
          </div>
        )}

        {/* Dirty Banner */}
        {hasDelta && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-accent-surface border border-accent rounded-md mb-6 text-sm text-accent font-medium">
            <span className="bg-accent text-[#FFFAF5] rounded-[10px] px-2 py-0.5 text-xs font-bold min-w-[20px] text-center">
              {deltaTags.length + (profile.aiDeltaIntro ? 1 : 0)}
            </span>
            条 AI 更新待确认 — 向下滚动至标签与简介区域查看
          </div>
        )}

        {/* Hero */}
        <section className="mb-12">
          <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden mb-6"
            style={{
              background: profile.imageUrl && !profile.imageOutdated
                ? `url(${profile.imageUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, #E8D5C4 0%, #C49A6C 25%, #9B4D4D 50%, #4A6670 75%, #2C3E50 100%)",
            }}
          >
            {!profile.imageUrl && (
              <div className="absolute inset-0 opacity-20"
                style={{
                  background: "radial-gradient(ellipse at 30% 50%, rgba(196,154,108,0.25) 0%, transparent 60%), radial-gradient(ellipse at 70% 40%, rgba(155,77,77,0.15) 0%, transparent 50%)",
                }}
              />
            )}
            {/* Stale image bar */}
            {profile.imageOutdated && (
              <div className="absolute bottom-0 left-0 right-0 bg-white/85 backdrop-blur-[4px] px-4 py-2 flex items-center justify-between text-xs text-text-secondary">
                <span>内容已更新，图片可能需要刷新</span>
                <button className="btn-image-refresh" onClick={handleUpdateImage} disabled={isGeneratingImage}>
                  <span>{isGeneratingImage ? "⟳" : "↻"}</span> {isGeneratingImage ? "生成中..." : "更新图片"}
                </button>
              </div>
            )}
          </div>
          <div className="text-center">
            <h1 className="font-serif text-display text-text-heading mb-1">{profile.userName}</h1>
            <p className="text-body text-text-secondary">2006 届 · {profile.className}</p>
          </div>
        </section>

        {/* Intro */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-text-primary">简介</h2>
            <button
              className="text-[13px] font-medium text-brand-dark bg-transparent border-none cursor-pointer px-2 py-1 rounded-sm hover:bg-elevated transition-colors"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "完成" : "编辑"}
            </button>
          </div>
          {profile.userConfirmedIntro && (
            <p className="text-body-lg leading-relaxed text-text-primary mb-6">
              {profile.userConfirmedIntro}
            </p>
          )}

          {profile.aiDeltaIntro && deltaIntroVisible && (
            <div className={`bg-accent-bg border border-dashed border-accent rounded-md p-3.5 mb-3 relative ${deltaIntroAccepted ? "!bg-transparent !border-transparent" : ""}`}>
              <p className="text-body-lg leading-relaxed text-text-primary mb-3">
                {profile.aiDeltaIntro}
              </p>
              {!deltaIntroAccepted && (
                <div className="flex gap-2 justify-end">
                  <button className="btn-delta--keep" onClick={keepDelta}>保留</button>
                  <button className="btn-delta--reject" onClick={rejectDelta}>抹除</button>
                </div>
              )}
            </div>
          )}

          {!profile.userConfirmedIntro && !profile.aiDeltaIntro && (
            <div className="text-center py-6 border-y border-border-light">
              <p className="text-body text-text-placeholder font-serif">
                你的故事，将由 AI 与你一起书写
              </p>
            </div>
          )}
        </section>

        {/* Tags */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-text-primary">标签</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.tags.length > 0 ? (
              profile.tags.map((tag) => {
                const isDelta = tag.isDelta;
                const isSearchOnly = tag.visibility === "search_only";
                const isUserEdited = tag.source === "user_edited";
                if (isDelta) {
                  return (
                    <span key={tag.id} className="tag tag--delta cursor-pointer">
                      {tag.tagText}
                      <span className="tag__close" onClick={(e) => { e.stopPropagation(); rejectDeltaTag(tag.id); }}>✕</span>
                      <span
                        className="absolute inset-0"
                        onClick={() => confirmDeltaTag(tag.id)}
                        title="点击确认标签"
                      />
                    </span>
                  );
                }
                return (
                  <span
                    key={tag.id}
                    className={`tag ${TAG_CLASS_MAP[tag.tagType] || "tag--follow"} ${isSearchOnly ? "tag--search-only" : ""} ${isUserEdited ? "tag--user-edited" : ""}`}
                  >
                    {tag.tagText}
                    {isSearchOnly && <span className="ml-0.5 text-[8px]">🔒</span>}
                  </span>
                );
              })
            ) : (
              <>
                <span className="tag tag--belong opacity-40" style={{ borderStyle: "dashed", background: "transparent" }}>属于</span>
                <span className="tag tag--offer opacity-40" style={{ borderStyle: "dashed", background: "transparent" }}>提供</span>
                <span className="tag tag--need opacity-40" style={{ borderStyle: "dashed", background: "transparent" }}>需要</span>
                <span className="tag tag--follow opacity-40" style={{ borderStyle: "dashed", background: "transparent" }}>关注</span>
              </>
            )}
          </div>
        </section>

        {/* Content Blocks */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-text-primary">内容块</h2>
          </div>

          {profile.blocks.length === 0 ? (
            <div className="card card--placeholder mb-4">
              <p className="placeholder-text">点击下方按钮，开始添加你的第一个内容块</p>
              <button
                className="btn-primary"
                onClick={() => { setShowInlineAdd(true); setEditMode(true); }}
              >
                开始添加
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {profile.blocks.map((block) => (
                <div
                  key={block.id}
                  className={`card card--content-block ${block.category} ${editingBlockId === block.id ? "!border-accent !bg-accent-surface" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-text-primary">{block.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-1.5 py-px text-[10px] font-medium text-accent rounded-[2px] tracking-[0.02em]" style={{ background: "rgba(196,154,108,0.12)" }}>
                        {block.source}
                      </span>
                      <span
                        className={`inline-flex items-center gap-[3px] px-1.5 py-px text-[10px] font-medium rounded-[2px] cursor-pointer select-none transition-all hover:brightness-90 ${
                          block.visibility === "public"
                            ? "text-accent-green bg-[rgba(122,139,111,0.12)]"
                            : "text-accent bg-[rgba(196,154,108,0.12)]"
                        }`}
                        onClick={() => toggleVisibility(block.id)}
                      >
                        {block.visibility === "public" ? "公开" : "仅搜索"}
                      </span>
                    </div>
                  </div>

                  {editingBlockId === block.id ? (
                    <>
                      <textarea
                        className="w-full border border-border rounded-sm px-3 py-2.5 text-sm font-sans text-text-primary bg-surface leading-relaxed min-h-[60px] resize-y focus:outline-none focus:border-accent"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end mt-2.5">
                        <button className="btn-ghost text-[13px] py-1.5 px-3" onClick={cancelEdit}>取消</button>
                        <button className="btn-primary text-xs py-1.5 px-3.5" onClick={() => saveEdit(block.id)}>保存</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed text-text-primary">{block.text}</p>
                      {editMode && (
                        <div className="flex gap-2 justify-end mt-2.5">
                          <button className="btn-ghost text-[13px] py-1.5 px-3" onClick={() => startEdit(block)}>编辑</button>
                          <button className="btn-ghost text-[13px] py-1.5 px-3 !text-error hover:!bg-error-surface" onClick={() => showDelete(block.id)}>删除</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inline Add Form */}
          {showInlineAdd && (
            <div className="bg-accent-surface border border-accent rounded-md p-4 mt-3 animate-review-fade-in">
              <div className="flex items-center gap-2 mb-3">
                {(["custom", "self_intro", "background", "offer", "need"]).map((cat) => (
                  <button
                    key={cat}
                    className={`px-3 py-1 text-xs font-semibold rounded-[16px] border transition-all cursor-pointer ${
                      newBlockCategory === cat
                        ? "bg-primary text-[#FFFAF5] border-primary"
                        : "bg-surface text-text-secondary border-border hover:border-accent"
                    }`}
                    onClick={() => setNewBlockCategory(cat)}
                  >
                    {cat === "custom" ? "自定义" : CAT_NAMES[cat]}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full border border-border rounded-sm px-3.5 py-3 text-sm font-sans text-text-primary bg-surface leading-relaxed min-h-[80px] resize-y mb-3 focus:outline-none focus:border-accent focus:shadow-[0_0_0_2px_rgba(196,154,108,0.15)]"
                placeholder="试试用键盘语音输入，口述你想添加的内容..."
                value={newBlockText}
                onChange={(e) => setNewBlockText(e.target.value)}
              />
              <div className="flex gap-2.5 justify-end">
                <button className="btn-secondary text-[13px] py-1.5 px-4" onClick={() => { setShowInlineAdd(false); setNewBlockText(""); }}>取消</button>
                <button className="btn-primary text-[13px] py-1.5 px-5" onClick={confirmAdd}>添加</button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Floating Add Button */}
      {!showInlineAdd && (
        <button
          className="fixed bottom-8 right-8 inline-flex items-center gap-1.5 bg-primary text-[#FFFAF5] border-none rounded-md px-5 py-3 text-sm font-semibold font-sans tracking-[0.02em] cursor-pointer shadow-md transition-all hover:bg-primary-hover hover:shadow-lg hover:-translate-y-px z-[5]"
          onClick={() => { setShowInlineAdd(true); setEditMode(true); }}
        >
          <span className="text-base font-normal">+</span> 新增内容块
        </button>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)} />
          <div className="modal-content" style={{ display: "block" }}>
            <p className="text-h2 text-text-primary mb-3">确认删除</p>
            <p className="text-sm text-text-secondary leading-relaxed mb-5">删除后无法恢复，你确定要删除这个内容块吗？</p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>取消</button>
              <button className="btn-danger" onClick={confirmDelete}>确认删除</button>
            </div>
          </div>
        </>
      )}

      {/* Visibility Drawer */}
      {showVisDrawer && (
        <>
          <div className="modal-overlay" style={{ zIndex: 109 }} onClick={() => setShowVisDrawer(false)} />
          <div
            className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-lg shadow-lg z-[110] p-6 pb-8 max-w-[720px] mx-auto animate-slide-up-damped"
          >
            <div className="w-9 h-1 rounded-[2px] bg-border -mt-3 mx-auto mb-5" />
            <div className="text-h2 text-text-primary mb-2">选择可见性</div>
            <div className="text-[13px] text-text-secondary mb-5">当前内容块：{targetBlock?.label}</div>
            <div className="flex flex-col gap-1">
              <div
                className={`flex items-start gap-3 p-3.5 border rounded-md cursor-pointer transition-all ${
                  isPublic ? "border-primary bg-primary-surface" : "border-border-light hover:border-border hover:bg-elevated"
                }`}
                onClick={() => {
                  if (targetBlock) {
                    targetBlock.visibility = "public";
                  }
                }}
              >
                <div className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 mt-px transition-all ${
                  isPublic ? "border-primary bg-primary shadow-[inset_0_0_0_3px_#fff]" : "border-border"
                }`} />
                <div>
                  <div className="text-sm font-medium text-text-primary mb-0.5">公开</div>
                  <div className="text-xs text-text-secondary leading-relaxed">所有校友都能在搜索结果中看到</div>
                </div>
              </div>
              <div
                className={`flex items-start gap-3 p-3.5 border rounded-md cursor-pointer transition-all ${
                  !isPublic ? "border-primary bg-primary-surface" : "border-border-light hover:border-border hover:bg-elevated"
                }`}
                onClick={() => {
                  if (targetBlock) {
                    targetBlock.visibility = "search_only";
                  }
                }}
              >
                <div className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 mt-px transition-all ${
                  !isPublic ? "border-primary bg-primary shadow-[inset_0_0_0_3px_#fff]" : "border-border"
                }`} />
                <div>
                  <div className="text-sm font-medium text-text-primary mb-0.5">仅搜索</div>
                  <div className="text-xs text-text-secondary leading-relaxed">只有搜索关键词匹配时才会出现在结果中</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button className="btn-secondary" onClick={() => setShowVisDrawer(false)}>取消</button>
              <button className="btn-primary" onClick={confirmVisibility}>确认</button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      <div className={`toast ${toastVisible ? "toast--visible" : ""}`}>{toastMsg}</div>
    </main>
  );
}
