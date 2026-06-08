"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ResultRenderer, { SandboxResult, SandboxTag, SandboxBlock } from "./ResultRenderer";

interface Message {
  id: string;
  type: "ai" | "user";
  category?: "self_intro" | "background" | "offer" | "need";
  content: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  self_intro: "自我介绍",
  background: "历史背景",
  offer: "能提供的",
  need: "具体需求",
};

const USER_ID = "test-user-001";

interface Props {
  showToast: (msg: string) => void;
}

export default function InterviewSandbox({ showToast }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      category: "self_intro",
      content: "你好！我是你的 AI 采访助手。让我们先从最简单的开始——请简单介绍一下你自己，比如你的姓名、毕业班级，以及现在在做什么？",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [dimensionsCovered, setDimensionsCovered] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [sseFailed, setSseFailed] = useState(false);

  const [previewTags, setPreviewTags] = useState<SandboxTag[]>([]);
  const [previewBlocks, setPreviewBlocks] = useState<SandboxBlock[]>([]);
  const [previewIntro, setPreviewIntro] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const analyzeConversation = async (allMessages: Message[]) => {
    try {
      const res = await fetch("/api/ai/interview/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, userId: USER_ID }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.tags) {
        setPreviewTags(
          data.tags.map((t: any) => ({
            name: t.text || t.name || String(t),
            type: t.type || "belong",
          }))
        );
      }
      if (data.blocks) {
        setPreviewBlocks(
          data.blocks.map((b: any) => ({
            category: b.cat || b.category || "custom",
            label: b.label || CATEGORY_LABELS[b.cat || b.category] || "内容",
            text: b.text || b.content || "",
          }))
        );
      }
      if (data.intro) setPreviewIntro(data.intro);
      if (data.dimensionsCovered !== undefined) {
        setDimensionsCovered(data.dimensionsCovered);
      }
    } catch {
      // silent fail for preview
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;
    const userMsg: Message = { id: Date.now().toString(), type: "user", content: inputText.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);
    setSseFailed(false);

    try {
      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, userId: USER_ID }),
      });

      if (!res.ok) throw new Error("API error");

      // Handle SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";
      let aiCategory: Message["category"] = undefined;

      if (reader) {
        const aiMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: aiMsgId, type: "ai", content: "", category: aiCategory }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                if (content) {
                  aiContent += content;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === aiMsgId ? { ...m, content: aiContent } : m))
                  );
                }
              } catch {
                // non-JSON data, treat as plain text
                if (data && data !== "[DONE]") {
                  aiContent += data;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === aiMsgId ? { ...m, content: aiContent } : m))
                  );
                }
              }
            }
          }
        }
      }

      // Analyze after AI response
      const finalMessages = [...updatedMessages];
      if (aiContent) {
        finalMessages.push({ id: (Date.now() + 2).toString(), type: "ai", content: aiContent, category: aiCategory });
      }
      await analyzeConversation(finalMessages);
    } catch {
      setSseFailed(true);
      showToast("AI 响应失败，已切换到模拟模式");
      // Mock fallback
      const mockReply = "了解了，谢谢你的分享！能再多聊聊你最近在关注的事情吗？";
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), type: "ai", content: mockReply }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndInterview = () => {
    setShowSummary(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const summaryResult: SandboxResult | null = showSummary
    ? {
        intro: previewIntro || "（暂无简介）",
        tags: previewTags,
        content_blocks: previewBlocks,
      }
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Dimension Progress */}
      <div className="px-5 py-3 border-b border-border-light bg-surface">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-text-primary">采访维度覆盖</span>
          <span className="text-xs text-text-placeholder">{dimensionsCovered}/4</span>
        </div>
        <div className="flex gap-1.5">
          {["self_intro", "background", "offer", "need"].map((cat, i) => (
            <div
              key={cat}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i < dimensionsCovered ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
            <span key={cat} className="text-[9px] text-text-placeholder">{label}</span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-md px-3 py-2 text-sm leading-relaxed ${
                  msg.type === "user"
                    ? "bg-primary text-white"
                    : "bg-elevated border border-border-light text-text-primary"
                }`}
              >
                {msg.content || (msg.type === "ai" ? (
                  <span className="flex items-center gap-1 text-text-placeholder">
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="12" strokeLinecap="round" />
                    </svg>
                    思考中...
                  </span>
                ) : "")}
                {msg.category && msg.type === "ai" && (
                  <div className="text-[9px] mt-1 opacity-60">{CATEGORY_LABELS[msg.category]}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Live Preview */}
      {(previewTags.length > 0 || previewBlocks.length > 0 || previewIntro) && !showSummary && (
        <div className="px-5 py-3 border-t border-border-light bg-surface">
          <div className="text-[11px] font-medium text-text-secondary mb-2">实时提取预览</div>
          <ResultRenderer
            data={{ intro: previewIntro, tags: previewTags, content_blocks: previewBlocks }}
            showDeltaActions={false}
          />
        </div>
      )}

      {/* Summary */}
      {showSummary && summaryResult && (
        <div className="px-5 py-4 border-t border-border-light bg-surface flex-1 overflow-y-auto">
          <div className="text-[13px] font-medium text-text-primary mb-3">采访汇总</div>
          <ResultRenderer data={summaryResult} showDeltaActions={false} />
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-secondary text-xs" onClick={() => setShowSummary(false)}>继续采访</button>
            <button className="btn-primary text-xs" onClick={() => showToast("（沙盒模式）采访汇总完成")}>完成</button>
          </div>
        </div>
      )}

      {/* Input Area */}
      {!showSummary && (
        <div className="px-5 py-3 border-t border-border-light bg-surface">
          {sseFailed && (
            <div className="text-[11px] text-accent mb-1.5">AI 服务异常，已启用模拟回复</div>
          )}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              rows={2}
              className="flex-1 border border-border rounded-sm px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand-dark"
              placeholder="输入回复...（Enter 发送，Shift+Enter 换行）"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />
            <div className="flex flex-col gap-1.5">
              <button
                className="btn-primary text-xs px-3 py-1.5"
                onClick={sendMessage}
                disabled={!inputText.trim() || isTyping}
              >
                发送
              </button>
              <button
                className="btn-secondary text-xs px-3 py-1.5"
                onClick={handleEndInterview}
                disabled={messages.length < 3}
              >
                结束
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
