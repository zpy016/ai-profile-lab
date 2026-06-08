"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ──
type CabinState = "idle" | "parsing" | "field_filling" | "error";
type ReviewTag = { name: string; cat: string; delta: boolean; id?: string };
type ReviewBlock = { label: string; text: string; cat: string; delta: boolean; id?: string };

type BreadcrumbStep = "quick" | "review" | "published";

const USER_ID = "test-user-001";

export default function QuickCreatePage() {
  // ── State ──
  const [step, setStep] = useState<BreadcrumbStep>("quick");
  const [cabinState, setCabinState] = useState<CabinState>("idle");
  const [inputText, setInputText] = useState("");
  const [showParsingSkeleton, setShowParsingSkeleton] = useState(false);
  const [tags, setTags] = useState<ReviewTag[]>([]);
  const [baseIntro, setBaseIntro] = useState("");
  const [deltaIntro, setDeltaIntro] = useState("");
  const [blocks, setBlocks] = useState<ReviewBlock[]>([]);
  const [rejectedTags, setRejectedTags] = useState<Set<string>>(new Set());
  const [deltaAccepted, setDeltaAccepted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Auto-resize textarea ──
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(120, el.scrollHeight) + "px";
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [inputText, autoResize]);

  // ── Draft auto-save ──
  useEffect(() => {
    if (inputText.trim()) {
      localStorage.setItem("draft:quick", inputText);
    }
  }, [inputText]);

  useEffect(() => {
    const saved = localStorage.getItem("draft:quick");
    if (saved) {
      setHasDraft(true);
      setInputText(saved);
      setTimeout(autoResize, 50);
    }

    // Check for interview-to-quick handoff
    const handoff = localStorage.getItem("draft:interview-to-quick");
    if (handoff) {
      try {
        const data = JSON.parse(handoff) as {
          previewTags?: Array<{ text: string; type?: string }>;
          previewBlocks?: Array<{ label: string; text: string; cat: string }>;
          previewIntro?: string;
        };
        if (data.previewTags?.length || data.previewBlocks?.length || data.previewIntro) {
          // Convert interview preview data to review format
          const apiTags: ReviewTag[] = (data.previewTags || []).map((t) => ({
            name: t.text,
            cat: t.type || "follow",
            delta: false,
          }));
          const apiBlocks: ReviewBlock[] = (data.previewBlocks || []).map((b) => ({
            label: b.label,
            text: b.text,
            cat: b.cat,
            delta: false,
          }));
          setTags(apiTags);
          setBaseIntro(data.previewIntro || "");
          setBlocks(apiBlocks);
          setStep("review");
          localStorage.removeItem("draft:interview-to-quick");
        }
      } catch {
        localStorage.removeItem("draft:interview-to-quick");
      }
    }
  }, [autoResize]);

  // ── Call AI Extract Tags API ──
  const handleGenerate = useCallback(async () => {
    if (!inputText.trim()) {
      setCabinState("error");
      setTimeout(() => setCabinState("idle"), 400);
      return;
    }
    if (inputText.length > 2000) {
      setErrorMsg("内容过长，请精简至 2000 字以内");
      return;
    }

    setCabinState("parsing");
    setIsGenerating(true);
    setShowParsingSkeleton(true);
    setErrorMsg("");
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      const res = await fetch("/api/ai/extract-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, userId: USER_ID }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      // Map API response to review format
      const apiTags: ReviewTag[] = [
        ...(data.tags || []).map((t: any) => ({
          name: t.text || t.tagText,
          cat: t.type || t.tagType || "follow",
          delta: false,
        })),
        ...(data.delta_tags || []).map((t: any) => ({
          name: t.text || t.tagText,
          cat: t.type || t.tagType || "need",
          delta: true,
        })),
      ];

      const apiBlocks: ReviewBlock[] = (data.content_blocks || []).map((b: any) => ({
        label: b.category === "self_intro" ? "自我介绍" :
               b.category === "background" ? "历史背景" :
               b.category === "offer" ? "能提供的" :
               b.category === "need" ? "具体需求" : "自定义",
        text: b.content,
        cat: b.category,
        delta: false,
      }));

      setCabinState("idle");
      setIsGenerating(false);
      setShowParsingSkeleton(false);
      setTags(apiTags);
      setBaseIntro(data.intro || "");
      setDeltaIntro(data.delta_intro || "");
      setBlocks(apiBlocks);
      setRejectedTags(new Set());
      setDeltaAccepted(false);
      setStep("review");
    } catch (err: any) {
      console.error("Generate error:", err);
      setCabinState("error");
      setIsGenerating(false);
      setShowParsingSkeleton(false);
      setErrorMsg(err.message || "AI 分析失败，请重试");
      setTimeout(() => setCabinState("idle"), 800);
    }
  }, [inputText]);

  // ── Review Tag Toggle ──
  const toggleTag = useCallback((name: string, isDelta: boolean) => {
    if (!isDelta) return;
    setRejectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  // ── Review Intro Actions ──
  const acceptDeltaIntro = useCallback(() => {
    setDeltaAccepted(true);
    setBaseIntro((prev) => (prev ? prev + " " + deltaIntro : deltaIntro));
  }, [deltaIntro]);

  const rejectDeltaIntro = useCallback(() => {
    setDeltaIntro("");
  }, []);

  // ── Publish ──
  const handlePublish = useCallback(async () => {
    const acceptedTags = tags
      .filter((t) => !rejectedTags.has(t.name))
      .map((t) => ({
        text: t.name,
        type: t.cat,
        source: t.delta ? "ai" : "user_edited",
        visibility: "public" as const,
      }));

    const acceptedBlocks = blocks.map((b) => ({
      category: b.cat,
      content: b.text,
      source: "ai_extracted",
      visibility: "public" as const,
    }));

    const finalIntro = deltaAccepted || !deltaIntro
      ? baseIntro
      : baseIntro;

    try {
      const res = await fetch(`/api/profile/${USER_ID}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: acceptedTags,
          intro: finalIntro,
          blocks: acceptedBlocks,
        }),
      });

      if (!res.ok) {
        throw new Error(`Publish failed: ${res.status}`);
      }

      setStep("published");
      localStorage.removeItem("draft:quick");

      // Trigger image generation asynchronously
      fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: acceptedTags.map((t) => t.text).join(", "),
          userId: USER_ID,
        }),
      }).catch((e) => console.error("Background image gen error:", e));
    } catch (err: any) {
      setErrorMsg(err.message || "发布失败，请重试");
    }
  }, [tags, rejectedTags, blocks, baseIntro, deltaIntro, deltaAccepted]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    setInputText("");
    setCabinState("idle");
    setShowParsingSkeleton(false);
    setStep("quick");
    setTags([]);
    setBaseIntro("");
    setDeltaIntro("");
    setBlocks([]);
    setRejectedTags(new Set());
    setDeltaAccepted(false);
    setIsGenerating(false);
    setHasDraft(false);
    setErrorMsg("");
    localStorage.removeItem("draft:quick");
    if (textareaRef.current) {
      textareaRef.current.style.height = "120px";
    }
  }, []);

  // ── Compute remaining delta count ──
  const unreviewedDeltaTags = tags.filter((t) => t.delta && !rejectedTags.has(t.name)).length;
  const totalDeltas = unreviewedDeltaTags + (deltaIntro && !deltaAccepted ? 1 : 0);

  return (
    <>
      <main className="max-w-[860px] mx-auto px-8 pt-10 pb-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-0 mb-6">
          <span className={`flex items-center gap-1.5 text-xs font-medium ${step === "quick" ? "text-accent" : "text-brand-dark"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${step === "quick" ? "bg-accent w-2 h-2" : "bg-brand-dark"}`} />
            选择方式
          </span>
          <span className={`w-8 h-px mx-2 ${step !== "quick" ? "bg-brand-dark" : "bg-border-light"}`} />
          <span className={`flex items-center gap-1.5 text-xs font-medium ${step === "review" ? "text-accent" : step === "published" ? "text-brand-dark" : "text-text-placeholder"}`}>
            <span className={`rounded-full flex-shrink-0 ${step === "review" ? "w-2 h-2 bg-accent" : step === "published" ? "w-1.5 h-1.5 bg-brand-dark" : "w-1.5 h-1.5 bg-border"}`} />
            快速创建
          </span>
          <span className={`w-8 h-px mx-2 ${step === "published" ? "bg-brand-dark" : "bg-border-light"}`} />
          <span className={`flex items-center gap-1.5 text-xs font-medium ${step === "published" ? "text-accent" : "text-text-placeholder"}`}>
            <span className={`rounded-full flex-shrink-0 ${step === "published" ? "w-2 h-2 bg-accent" : "w-1.5 h-1.5 bg-border"}`} />
            确认发布
          </span>
        </div>

        {/* Heading */}
        {step === "quick" && (
          <div className="mb-8">
            <h1 className="font-serif text-display text-text-heading mb-2">用一段话，让 AI 了解你</h1>
            <p className="text-body-lg text-text-secondary leading-relaxed">
              输入一段自我介绍，AI 会帮你提取标签、整理内容块、撰写简介。
            </p>
          </div>
        )}

        {step === "review" && (
          <div className="mb-8">
            <h1 className="font-serif text-display text-text-heading mb-2">AI 已完成分析</h1>
            <p className="text-body-lg text-text-secondary leading-relaxed">
              以下是 AI 为你提取的内容，请逐条确认。AI 新增的内容以琥珀金色标示。
            </p>
          </div>
        )}

        {/* Error banner */}
        {errorMsg && (
          <div className="px-4 py-2.5 bg-error-surface border border-error rounded-md mb-4 text-sm text-error">
            {errorMsg}
          </div>
        )}

        {/* ===== QUICK CREATE STEP ===== */}
        {step === "quick" && (
          <>
            {/* Draft restore banner */}
            {hasDraft && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-accent-surface border border-dashed border-accent rounded-md mb-4 text-sm text-accent">
                <span>你有未完成的创建，已自动恢复</span>
                <button
                  onClick={() => { handleReset(); localStorage.removeItem("draft:quick"); }}
                  className="bg-transparent border-none text-accent cursor-pointer text-xs font-semibold"
                >
                  从头开始
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="mb-8">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  className={`input-intent ${cabinState === "parsing" ? "input-intent--parsing" : ""} ${cabinState === "error" ? "input-intent--error" : ""}`}
                  placeholder={`试试用键盘语音输入，口述你的自我介绍\n\n比如：\n我叫张明远，2006年从实验中学高三3班毕业。后来上了清华计算机系，一直在互联网行业，做过产品、带过团队。去年开始自己创业，做企业AI知识管理。平时喜欢独立音乐，周末经常回海淀喝咖啡...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-text-secondary bg-elevated rounded-sm cursor-default select-none">
                  <span>🎤</span> 提示：可以使用手机键盘的语音输入功能
                </div>
                <div className={`text-xs ${inputText.length > 2000 ? "text-error font-semibold" : "text-text-placeholder"}`}>
                  {inputText.length} / 2000 字
                  {inputText.length > 2000 && <span className="ml-1">请精简内容</span>}
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div ref={previewRef} className="min-h-[200px] mb-6" style={{ opacity: inputText.trim().length > 10 ? 1 : 0.5 }}>
              <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-4 after:content-[''] after:flex-1 after:h-px after:bg-border-light">
                实时预览
              </div>

              {/* Tags */}
              {showParsingSkeleton ? (
                <div className="flex flex-wrap gap-2 mb-5">
                  {[...Array(4)].map((_, i) => (
                    <span key={i} className="skeleton skeleton--tag skeleton--ai-field" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="tag tag--belong animate-tag-pop-in">实验中学 2006</span>
                  <span className="tag tag--belong animate-tag-pop-in" style={{ animationDelay: "0.05s" }}>清华计算机系</span>
                  <span className="tag tag--offer animate-tag-pop-in" style={{ animationDelay: "0.1s" }}>AI 创业</span>
                  <span className="tag tag--offer animate-tag-pop-in" style={{ animationDelay: "0.15s" }}>产品设计</span>
                  <span className="tag tag--follow animate-tag-pop-in" style={{ animationDelay: "0.2s" }}>独立音乐</span>
                </div>
              )}

              {/* Content Blocks */}
              {showParsingSkeleton ? (
                <div className="flex flex-col gap-2.5 mb-5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton skeleton--block skeleton--ai-field" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 mb-5">
                  {[
                    { cat: "self_intro", label: "自我介绍", text: "AI 创业者，前大厂产品负责人" },
                    { cat: "background", label: "历史背景", text: "清华计算机系毕业，15 年互联网行业经验" },
                    { cat: "offer", label: "能提供的", text: "AI 产品设计咨询，创业经验分享" },
                  ].map((b) => (
                    <div key={b.cat} className={`preview-block preview-block--${b.cat}`}>
                      <div className="preview-block__label">{b.label}</div>
                      <div>{b.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Intro */}
              {showParsingSkeleton ? (
                <div className="bg-surface border border-border rounded-md p-4 min-h-[40px]">
                  <div className="skeleton skeleton--text" style={{ width: "90%" }} />
                  <div className="skeleton skeleton--text" style={{ width: "80%" }} />
                  <div className="skeleton skeleton--text skeleton--text-medium" />
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-md p-4 text-body-lg leading-relaxed">
                  前大厂产品负责人，现 AI 创业者。2006 年从实验中学毕业后，进入清华计算机系，之后在互联网行业深耕 15 年。2024 年创立 AI 初创公司，专注于企业知识管理领域。
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== REVIEW STEP ===== */}
        {step === "review" && (
          <div className="animate-review-fade-in">
            {/* Tags */}
            <div className="border border-border rounded-md p-4 mb-3 bg-surface shadow-sm">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-[0.04em] mb-2.5">标签 — 点击确认或移除 AI 新增标签</div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t, i) => {
                  const rejected = rejectedTags.has(t.name);
                  let cls = "review-tag-item";
                  if (rejected) cls += " opacity-35 line-through border-transparent bg-border-light";
                  else if (t.delta) cls += " border-2 border-dashed border-accent bg-accent-surface text-[#6B5234] animate-delta-pulse";
                  else cls += " opacity-100";
                  return (
                    <span
                      key={t.name + i}
                      className={`inline-flex items-center gap-1 rounded-[3px] px-2.5 py-1 text-xs font-semibold font-sans tracking-[0.01em] cursor-pointer select-none transition-all hover:scale-[1.04] ${cls}`}
                      onClick={() => toggleTag(t.name, t.delta)}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      {t.name}
                      {t.delta && !rejected && (
                        <span className="text-[8px] font-bold bg-accent text-[#FFFAF5] rounded-[2px] px-[3px] ml-0.5">AI</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Intro */}
            <div className="border border-border rounded-md p-4 mb-3 bg-surface shadow-sm">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-[0.04em] mb-2.5">简介 — 确认主体文字，接受或拒绝 AI 补充</div>
              <div className="text-body-lg leading-relaxed text-text-primary mb-6">{baseIntro}</div>
              {deltaIntro && (
                <div className="bg-accent-bg border border-dashed border-accent rounded-md p-3.5 mt-2 text-sm leading-relaxed relative">
                  <div className="text-[10px] font-bold text-accent uppercase tracking-[0.05em] mb-1.5 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/>
                      <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
                    </svg>
                    AI 增量补充
                  </div>
                  <div className="mb-3">{deltaIntro}</div>
                  <div className="flex gap-2 justify-end">
                    <button className="btn-delta--keep" onClick={acceptDeltaIntro}>保留</button>
                    <button className="btn-delta--reject" onClick={rejectDeltaIntro}>抹除</button>
                  </div>
                </div>
              )}
            </div>

            {/* Blocks */}
            <div className="border border-border rounded-md p-4 mb-3 bg-surface shadow-sm">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-[0.04em] mb-2.5">内容块 — AI 整理的结构化信息</div>
              {blocks.map((b) => (
                <div
                  key={b.label + b.text.slice(0, 20)}
                  className={`bg-surface border border-border rounded-md px-4 py-2.5 mb-2 shadow-sm relative ${b.delta ? "border-l-[3px] border-l-accent" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-text-placeholder uppercase tracking-[0.05em]">{b.label}</span>
                    <span className="text-[9px] font-semibold px-[5px] py-px rounded-[2px] bg-accent-bg text-accent">
                      {b.delta ? "AI 新增" : "用户提供"}
                    </span>
                  </div>
                  <div className="text-[13px] leading-relaxed text-text-primary">{b.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PUBLISHED STEP ===== */}
        {step === "published" && (
          <div className="text-center py-[60px] animate-review-fade-in">
            <div className="mb-8">
              <div className="w-14 h-14 rounded-full bg-accent text-[#FFFAF5] inline-flex items-center justify-center text-[28px] mb-4">✓</div>
              <h2 className="font-serif text-[22px] font-semibold text-brand-dark mb-2 tracking-[0.01em]">你的主页已上线</h2>
              <p className="text-[15px] text-text-secondary mb-8">2006 届的同学们现在可以看到你了</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Link href={`/profile/${USER_ID}`} className="btn-primary w-[220px]">查看我的主页</Link>
              <Link href={`/profile/${USER_ID}`} className="btn-secondary w-[220px]">继续完善</Link>
              <Link href="/" className="btn-ghost w-[220px]">返回基地</Link>
            </div>
            <div className="mt-10 px-5 py-3 bg-accent-surface border border-dashed border-accent rounded-md inline-flex items-center gap-2 text-[13px] text-accent">
              <span className="inline-block w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              图片正在生成中，稍后自动更新
            </div>
          </div>
        )}
      </main>

      {/* ===== STICKY SUBMIT BAR ===== */}
      {step === "quick" && (
        <div className="submit-bar max-w-[860px] mx-auto px-8">
          <button className="btn-secondary" onClick={handleReset}>清空重来</button>
          <button className="btn-primary" onClick={handleGenerate} disabled={isGenerating || inputText.length > 2000}>
            {isGenerating ? "AI 正在分析..." : inputText.length > 2000 ? "内容过长" : "生成我的主页"}
          </button>
        </div>
      )}

      {step === "review" && (
        <div className="submit-bar max-w-[860px] mx-auto px-8" style={{ justifyContent: "space-between" }}>
          <div className="flex items-center gap-1 text-[13px] text-text-secondary">
            <span className="bg-accent text-[#FFFAF5] rounded-[10px] px-1.5 py-px text-[11px] font-bold min-w-[18px] text-center">{totalDeltas}</span>
            条 AI 增量待确认
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={handleReset}>清空重来</button>
            <button className="btn-primary" onClick={handlePublish}>确认并发布</button>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className="toast"></div>

      {/* Inline styles for preview blocks */}
      <style jsx>{`
        .preview-block {
          position: relative;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px 16px 12px 20px;
          font-size: 14px;
          line-height: 1.55;
          box-shadow: var(--shadow-sm);
        }
        .preview-block::before {
          content: '';
          position: absolute;
          left: 4px; top: 12px; bottom: 12px;
          width: 3px; border-radius: 1.5px;
        }
        .preview-block--self_intro::before { background: #9B4D4D; }
        .preview-block--background::before { background: #B8A9C9; }
        .preview-block--offer::before { background: #A8BF9A; }
        .preview-block--need::before { background: #C9A882; }
        .preview-block__label {
          font-size: 11px; font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 4px; letter-spacing: 0.05em;
        }
      `}</style>
    </>
  );
}
