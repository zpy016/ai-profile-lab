"use client";

import { useState, useCallback, useRef } from "react";
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

// ── Mock Data ──
const MOCK_BLOCKS: ProfileBlock[] = [
  { id: "b1", category: "self_intro", label: "自我介绍", text: "我是一名 AI 创业者，前大厂产品负责人，2006 年从实验中学毕业。", source: "AI", visibility: "public" },
  { id: "b2", category: "background", label: "历史背景", text: "清华计算机系毕业，15 年互联网行业经验，曾在字节跳动、美团担任产品负责人。", source: "AI", visibility: "public" },
  { id: "b3", category: "offer", label: "能提供的", text: "AI 产品设计咨询、创业经验分享、技术团队管理经验。可以帮校友评估 AI 创业方向。", source: "AI", visibility: "public" },
  { id: "b4", category: "need", label: "具体需求", text: "正在寻找技术合伙人（后端/算法方向），以及天使轮融资机会。", source: "AI", visibility: "search_only" },
];

const CAT_NAMES: Record<string, string> = {
  self_intro: "自我介绍",
  background: "历史背景",
  offer: "能提供的",
  need: "具体需求",
  custom: "自定义",
};

export default function ProfilePage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const params = useParams();

  // ── State ──
  const [editMode, setEditMode] = useState(false);
  const [blocks, setBlocks] = useState<ProfileBlock[]>(MOCK_BLOCKS);
  const [deltaIntroVisible, setDeltaIntroVisible] = useState(true);
  const [deltaIntroAccepted, setDeltaIntroAccepted] = useState(false);
  const [deltaTag1Visible, setDeltaTag1Visible] = useState(true);
  const [deltaTag2Visible, setDeltaTag2Visible] = useState(true);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [newBlockCategory, setNewBlockCategory] = useState("custom");
  const [newBlockText, setNewBlockText] = useState("");
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showVisDrawer, setShowVisDrawer] = useState(false);
  const [visTargetBlockId, setVisTargetBlockId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Toast ──
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
  }, []);

  // ── Delta Intro Actions ──
  const keepDelta = () => {
    setDeltaIntroAccepted(true);
    showToast("增量内容已融入正文");
  };
  const rejectDelta = () => {
    setDeltaIntroVisible(false);
    showToast("已抹除 AI 增量内容");
  };

  // ── Delta Tag Actions ──
  const keepDeltaTag = (which: 1 | 2) => {
    if (which === 1) setDeltaTag1Visible(false);
    else setDeltaTag2Visible(false);
    showToast("标签已确认");
  };
  const rejectDeltaTag = (which: 1 | 2) => {
    if (which === 1) setDeltaTag1Visible(false);
    else setDeltaTag2Visible(false);
    showToast("已抹除 AI 增量标签");
  };

  // ── Content Block Actions ──
  const startEdit = (block: ProfileBlock) => {
    setEditingBlockId(block.id);
    setEditText(block.text);
  };
  const cancelEdit = () => setEditingBlockId(null);
  const saveEdit = (blockId: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, text: editText } : b)));
    setEditingBlockId(null);
    showToast("已保存，AI 不会修改您的内容");
  };

  const showDelete = (blockId: string) => {
    setDeleteTargetId(blockId);
    setShowDeleteModal(true);
  };
  const confirmDelete = () => {
    if (deleteTargetId) {
      setBlocks((prev) => prev.filter((b) => b.id !== deleteTargetId));
    }
    setShowDeleteModal(false);
    setDeleteTargetId(null);
    showToast("内容块已删除");
  };

  // ── Inline Add Block ──
  const confirmAdd = () => {
    if (!newBlockText.trim()) return;
    const newBlock: ProfileBlock = {
      id: Date.now().toString(),
      category: newBlockCategory,
      label: CAT_NAMES[newBlockCategory] || "自定义",
      text: newBlockText.trim(),
      source: "user",
      visibility: "public",
    };
    setBlocks((prev) => [...prev, newBlock]);
    setShowInlineAdd(false);
    setNewBlockText("");
    showToast("已记录，AI 正在补充相关内容");
  };

  // ── Visibility ──
  const toggleVisibility = (blockId: string) => {
    setVisTargetBlockId(blockId);
    setShowVisDrawer(true);
  };
  const confirmVisibility = () => {
    if (visTargetBlockId) {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === visTargetBlockId
            ? { ...b, visibility: b.visibility === "public" ? "search_only" : "public" }
            : b
        )
      );
    }
    setShowVisDrawer(false);
    showToast("可见性已更新");
  };

  const targetBlock = blocks.find((b) => b.id === visTargetBlockId);
  const isPublic = targetBlock?.visibility === "public";

  return (
    <main className="py-12 pb-20">
      <div className="container--narrow">
        {/* Dirty Banner */}
        {(deltaIntroVisible || deltaTag1Visible || deltaTag2Visible) && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-accent-surface border border-accent rounded-md mb-6 text-sm text-accent font-medium">
            <span className="bg-accent text-[#FFFAF5] rounded-[10px] px-2 py-0.5 text-xs font-bold min-w-[20px] text-center">
              {[deltaIntroVisible, deltaTag1Visible, deltaTag2Visible].filter(Boolean).length}
            </span>
            条 AI 更新待确认 — 向下滚动至标签与简介区域查看
          </div>
        )}

        {/* Hero */}
        <section className="mb-12">
          <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden mb-6"
            style={{
              background: "linear-gradient(135deg, #E8D5C4 0%, #C49A6C 25%, #9B4D4D 50%, #4A6670 75%, #2C3E50 100%)",
            }}
          >
            <div className="absolute inset-0 opacity-20"
              style={{
                background: "radial-gradient(ellipse at 30% 50%, rgba(196,154,108,0.25) 0%, transparent 60%), radial-gradient(ellipse at 70% 40%, rgba(155,77,77,0.15) 0%, transparent 50%)",
              }}
            />
            {/* Stale image bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/85 backdrop-blur-[4px] px-4 py-2 flex items-center justify-between text-xs text-text-secondary">
              <span>内容已更新，图片可能需要刷新</span>
              <button className="btn-image-refresh" onClick={() => showToast("正在生成新图片...")}>
                <span>↻</span> 更新图片
              </button>
            </div>
          </div>
          <div className="text-center">
            <h1 className="font-serif text-display text-text-heading mb-1">张明远</h1>
            <p className="text-body text-text-secondary">2006 届 · 高三（3）班</p>
          </div>
        </section>

        {/* Intro */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-text-primary">简介</h2>
            <button className="text-[13px] font-medium text-brand-dark bg-transparent border-none cursor-pointer px-2 py-1 rounded-sm hover:bg-elevated transition-colors" onClick={() => showToast("已进入编辑模式")}>
              编辑
            </button>
          </div>
          <p className="text-body-lg leading-relaxed text-text-primary mb-6">
            前大厂产品负责人，现 AI 创业者。2006 年从实验中学毕业后，进入清华计算机系，之后在互联网行业深耕 15 年。2024 年创立 AI 初创公司，专注于企业知识管理领域。
          </p>

          {deltaIntroVisible && (
            <div className={`bg-accent-bg border border-dashed border-accent rounded-md p-3.5 mb-3 relative ${deltaIntroAccepted ? "!bg-transparent !border-transparent" : ""}`}>
              <p className="text-body-lg leading-relaxed text-text-primary mb-3">
                目前在寻找志同道合的技术合伙人，也希望能与校友们交流 AI 创业的心得。周末经常回海淀，偶尔在五道口附近喝咖啡，欢迎约聊。
              </p>
              {!deltaIntroAccepted && (
                <div className="flex gap-2 justify-end">
                  <button className="btn-delta--keep" onClick={keepDelta}>保留</button>
                  <button className="btn-delta--reject" onClick={rejectDelta}>抹除</button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Tags */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-text-primary">标签</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="tag tag--belong">实验中学 2006</span>
            <span className="tag tag--belong">清华计算机系</span>
            <span className="tag tag--offer">AI 创业</span>
            <span className="tag tag--offer">企业知识管理</span>
            <span className="tag tag--offer">产品设计</span>
            <span className="tag tag--follow">科技前沿</span>
            <span className="tag tag--follow">独立音乐</span>

            {deltaTag1Visible && (
              <span className="tag tag--delta cursor-pointer" onClick={() => keepDeltaTag(1)}>
                寻找技术合伙人
                <span className="tag__close" onClick={(e) => { e.stopPropagation(); rejectDeltaTag(1); }}>✕</span>
              </span>
            )}
            {deltaTag2Visible && (
              <span className="tag tag--delta cursor-pointer" onClick={() => keepDeltaTag(2)}>
                海淀咖啡
                <span className="tag__close" onClick={(e) => { e.stopPropagation(); rejectDeltaTag(2); }}>✕</span>
              </span>
            )}

            <span className="tag tag--need tag--search-only">天使投资</span>
            <span className="tag tag--belong tag--user-edited">北京</span>
          </div>
        </section>

        {/* Content Blocks */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-text-primary">内容块</h2>
          </div>

          <div className="flex flex-col gap-3">
            {blocks.map((block) => (
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
                  setBlocks((prev) => prev.map((b) => (b.id === visTargetBlockId ? { ...b, visibility: "public" } : b)));
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
                  setBlocks((prev) => prev.map((b) => (b.id === visTargetBlockId ? { ...b, visibility: "search_only" } : b)));
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
