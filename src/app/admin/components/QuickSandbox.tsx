"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ResultRenderer, { SandboxResult } from "./ResultRenderer";

const TEST_TEXT = `我叫张明远，2006年从实验中学高三3班毕业。后来上了清华计算机系，一直在互联网行业，做过产品、带过团队。去年开始自己创业，做企业AI知识管理。平时喜欢独立音乐，周末经常回海淀喝咖啡。`;

const USER_ID = "test-user-001";

interface Props {
  showToast: (msg: string) => void;
}

export default function QuickSandbox({ showToast }: Props) {
  const [inputText, setInputText] = useState(TEST_TEXT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
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

  const handleExtract = async () => {
    if (!inputText.trim()) {
      setErrorMsg("请输入自我介绍内容");
      return;
    }
    setErrorMsg("");
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/extract-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText.trim(), userId: USER_ID }),
      });
      if (!res.ok) {
        if (res.status === 413) {
          setErrorMsg("文本过长（最多 3000 字符）");
        } else {
          setErrorMsg("AI 提取失败，请重试");
        }
        setIsGenerating(false);
        return;
      }
      const data = await res.json();
      // Normalize API response to SandboxResult
      const normalized: SandboxResult = {
        intro: data.intro || "",
        delta_intro: data.delta_intro || "",
        tags: (data.tags || []).map((t: any) => ({
          name: t.text || t.name || String(t),
          type: t.type || "belong",
          delta: t.delta || false,
        })),
        content_blocks: (data.content_blocks || []).map((b: any) => ({
          category: b.category || b.cat || "custom",
          label: b.label || b.category || "内容",
          text: b.content || b.text || "",
          delta: b.delta || false,
        })),
      };
      setResult(normalized);
      showToast("AI 提取完成");
    } catch {
      setErrorMsg("网络错误，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = () => {
    showToast("（沙盒模式）已模拟发布，未写入数据库");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input Area */}
      <div className="px-5 py-4 border-b border-border-light">
        <div className="text-[13px] font-medium text-text-primary mb-2">输入自我介绍</div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="w-full border border-border rounded-sm p-3 text-sm leading-relaxed resize-y min-h-[120px] focus:outline-none focus:border-brand-dark"
            placeholder="请输入或粘贴自我介绍..."
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setErrorMsg("");
            }}
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-xs ${inputText.length > 2000 ? "text-accent" : "text-text-placeholder"}`}>
              {inputText.length}/2000 字
            </span>
            {errorMsg && <span className="text-xs text-accent">{errorMsg}</span>}
          </div>
        </div>
        <button
          className="btn-primary w-full mt-3 gap-1.5"
          onClick={handleExtract}
          disabled={isGenerating || inputText.length > 2000}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="20" strokeLinecap="round" />
              </svg>
              AI 提取中...
            </>
          ) : (
            <>🤖 AI 提取标签与内容</>
          )}
        </button>
      </div>

      {/* Result Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {result ? (
          <div className="bg-surface rounded-md shadow-sm border border-border-light p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium text-text-primary">提取结果</span>
              <span className="text-[10px] text-text-placeholder">可编辑、可删除</span>
            </div>
            <ResultRenderer
              data={result}
              onChange={setResult}
              showDeltaActions={true}
              onConfirmDeltaIntro={() => {
                if (result.delta_intro) {
                  setResult({
                    ...result,
                    intro: result.intro + " " + result.delta_intro,
                    delta_intro: undefined,
                  });
                  showToast("增量简介已合并");
                }
              }}
              onRejectDeltaIntro={() => {
                setResult({ ...result, delta_intro: undefined });
                showToast("增量简介已抹除");
              }}
              onConfirmDeltaTag={(tag) => {
                setResult({
                  ...result,
                  tags: result.tags.map((t) =>
                    t.name === tag.name ? { ...t, type: t.type === "delta" ? "belong" : t.type, delta: false } : t
                  ),
                });
                showToast(`标签「${tag.name}」已确认`);
              }}
              onRejectDeltaTag={(tag) => {
                setResult({
                  ...result,
                  tags: result.tags.filter((t) => t.name !== tag.name),
                });
                showToast(`标签「${tag.name}」已拒绝`);
              }}
            />
            <div className="mt-4 pt-3 border-t border-border-light flex justify-end">
              <button className="btn-primary text-xs" onClick={handlePublish}>
                确认发布（沙盒）
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-placeholder">
            <div className="text-4xl mb-3">📝</div>
            <div className="text-sm">输入自我介绍后点击「AI 提取」</div>
            <div className="text-xs mt-1">可自由编辑测试文本，观察 AI 提取效果</div>
          </div>
        )}
      </div>
    </div>
  );
}
