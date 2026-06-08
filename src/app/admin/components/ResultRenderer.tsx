"use client";

import { useState } from "react";

export interface SandboxTag {
  name: string;
  type: string;
  delta?: boolean;
  id?: string;
}

export interface SandboxBlock {
  category: string;
  label: string;
  text: string;
  delta?: boolean;
}

export interface SandboxResult {
  intro: string;
  delta_intro?: string;
  tags: SandboxTag[];
  content_blocks: SandboxBlock[];
}

interface Props {
  data: SandboxResult | null;
  onChange?: (data: SandboxResult) => void;
  showDeltaActions?: boolean;
  onConfirmDeltaIntro?: () => void;
  onRejectDeltaIntro?: () => void;
  onConfirmDeltaTag?: (tag: SandboxTag) => void;
  onRejectDeltaTag?: (tag: SandboxTag) => void;
  onConfirmDeltaBlock?: (block: SandboxBlock) => void;
  onRejectDeltaBlock?: (block: SandboxBlock) => void;
}

const CAT_LABELS: Record<string, string> = {
  self_intro: "自我介绍",
  background: "历史背景",
  offer: "能提供的",
  need: "具体需求",
  custom: "自定义",
};

const CAT_COLORS: Record<string, string> = {
  self_intro: "#9B4D4D",
  background: "#B8A9C9",
  offer: "#A8BF9A",
  need: "#C9A882",
  custom: "#7A8B99",
};

const TAG_CLASS_MAP: Record<string, string> = {
  belong: "tag--belong",
  offer: "tag--offer",
  need: "tag--need",
  follow: "tag--follow",
  delta: "tag--delta",
};

export default function ResultRenderer({
  data,
  onChange,
  showDeltaActions = true,
  onConfirmDeltaIntro,
  onRejectDeltaIntro,
  onConfirmDeltaTag,
  onRejectDeltaTag,
  onConfirmDeltaBlock,
  onRejectDeltaBlock,
}: Props) {
  const [editingIntro, setEditingIntro] = useState(false);
  const [introDraft, setIntroDraft] = useState("");

  if (!data) return null;

  const handleIntroEditStart = () => {
    setIntroDraft(data.intro);
    setEditingIntro(true);
  };

  const handleIntroSave = () => {
    if (onChange) {
      onChange({ ...data, intro: introDraft });
    }
    setEditingIntro(false);
  };

  const handleRemoveTag = (idx: number) => {
    if (!onChange) return;
    const newTags = [...data.tags];
    newTags.splice(idx, 1);
    onChange({ ...data, tags: newTags });
  };

  const handleRemoveBlock = (idx: number) => {
    if (!onChange) return;
    const newBlocks = [...data.content_blocks];
    newBlocks.splice(idx, 1);
    onChange({ ...data, content_blocks: newBlocks });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Intro */}
      <div>
        {editingIntro ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full border border-border rounded-sm p-2.5 text-sm leading-[1.65] focus:outline-none focus:border-brand-dark"
              rows={3}
              value={introDraft}
              onChange={(e) => setIntroDraft(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button className="text-xs text-text-secondary hover:text-text-primary" onClick={() => setEditingIntro(false)}>取消</button>
              <button className="text-xs text-accent font-medium" onClick={handleIntroSave}>保存</button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <p className="text-sm leading-[1.65] text-text-primary">{data.intro}</p>
            {onChange && (
              <button
                className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 text-[10px] text-text-placeholder hover:text-accent transition-opacity"
                onClick={handleIntroEditStart}
              >
                编辑
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delta Intro */}
      {data.delta_intro && showDeltaActions && (
        <div className="bg-accent-bg border border-dashed border-accent rounded-md p-2.5">
          <p className="text-sm leading-[1.65] text-text-primary mb-2">{data.delta_intro}</p>
          <div className="flex gap-2">
            {onConfirmDeltaIntro && (
              <button className="text-xs text-accent font-medium" onClick={onConfirmDeltaIntro}>保留增量</button>
            )}
            {onRejectDeltaIntro && (
              <button className="text-xs text-text-placeholder hover:text-accent" onClick={onRejectDeltaIntro}>抹除</button>
            )}
          </div>
        </div>
      )}
      {data.delta_intro && !showDeltaActions && (
        <div className="bg-accent-bg border border-dashed border-accent rounded-md p-2.5 text-sm leading-[1.65] text-text-primary">
          {data.delta_intro}
        </div>
      )}

      {/* Tags */}
      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.tags.map((tag, i) => {
            const isDelta = tag.delta || tag.type === "delta";
            return (
              <span
                key={tag.id || `${tag.name}-${i}`}
                className={`inline-flex items-center gap-1 tag text-[11px] ${TAG_CLASS_MAP[tag.type] || "tag--belong"} py-0.5 px-2 ${isDelta ? "border-dashed" : ""}`}
              >
                {tag.name}
                {isDelta && showDeltaActions && (
                  <>
                    {onConfirmDeltaTag && (
                      <button className="text-[9px] text-accent hover:text-brand-dark ml-0.5" onClick={() => onConfirmDeltaTag(tag)}>✓</button>
                    )}
                    {onRejectDeltaTag && (
                      <button className="text-[9px] text-text-placeholder hover:text-accent ml-0.5" onClick={() => onRejectDeltaTag(tag)}>✕</button>
                    )}
                  </>
                )}
                {onChange && (
                  <button
                    className="text-[9px] text-text-placeholder hover:text-accent ml-0.5"
                    onClick={() => handleRemoveTag(i)}
                  >
                    ✕
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Content Blocks */}
      {data.content_blocks.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.content_blocks.map((block, i) => {
            const isDelta = block.delta;
            return (
              <div key={`${block.category}-${i}`} className={`relative bg-surface border rounded-md py-2.5 px-3 pl-4 shadow-sm group ${isDelta ? "border-accent border-dashed" : "border-border"}`}>
                <div
                  className="absolute left-1 top-2.5 bottom-2.5 w-0.5 rounded-[1px]"
                  style={{ background: CAT_COLORS[block.category] || "#7A8B99" }}
                />
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-text-primary">{CAT_LABELS[block.category] || block.label || block.category}</span>
                  <div className="flex items-center gap-1.5">
                    {isDelta && showDeltaActions && (
                      <>
                        {onConfirmDeltaBlock && (
                          <button className="text-[9px] text-accent hover:text-brand-dark font-medium" onClick={() => onConfirmDeltaBlock(block)}>✓ 保留</button>
                        )}
                        {onRejectDeltaBlock && (
                          <button className="text-[9px] text-text-placeholder hover:text-accent" onClick={() => onRejectDeltaBlock(block)}>✕ 拒绝</button>
                        )}
                      </>
                    )}
                    <span className="text-[9px] font-medium text-accent rounded-[2px] px-1 py-px" style={{ background: "rgba(196,154,108,0.12)" }}>AI</span>
                    {onChange && (
                      <button
                        className="text-[9px] text-text-placeholder hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveBlock(i)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-text-primary">{block.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
