"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

interface Message {
  id: string;
  type: "ai" | "user";
  category?: "self_intro" | "background" | "offer" | "need";
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    type: "ai",
    category: "self_intro",
    content: "你好！我是你的 AI 采访助手。让我们先从最简单的开始——请简单介绍一下你自己，比如你的姓名、毕业班级，以及现在在做什么？",
  },
  {
    id: "2",
    type: "user",
    content: "我叫张明远，2006 年从实验中学高三 3 班毕业。现在是个 AI 创业者，之前在互联网大厂做产品。",
  },
  {
    id: "3",
    type: "ai",
    category: "background",
    content: "很棒！从实验中学到 AI 创业者，这条路肯定很有意思。能聊聊你的教育背景和职业经历吗？",
  },
  {
    id: "4",
    type: "user",
    content: "我后来去了清华计算机系，毕业后在互联网行业待了 15 年，字节和美团都待过，一直做产品方向。",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  self_intro: "自我介绍",
  background: "历史背景",
  offer: "能提供的",
  need: "具体需求",
};

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [dimensionsCovered, setDimensionsCovered] = useState(2);
  const [showSummary, setShowSummary] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now().toString(), type: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response after delay
    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        category: "need",
        content: "了解！最后一个维度——你目前在寻找什么？无论是工作机会、合作伙伴，还是其他校友能帮上忙的事情，都可以说说。",
      };
      setMessages((prev) => [...prev, aiMsg]);
      setDimensionsCovered(3);
    }, 2000);
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndInterview = () => setShowSummary(true);
  const goToReview = () => {
    window.location.href = "/create/quick";
  };

  return (
    <main className="overflow-hidden h-[calc(100vh-56px)]">
      <div className="layout-split">
        {/* Left: Chat Panel */}
        <div className="split-left">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-surface sticky top-0 z-sticky">
            <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
              <span>已覆盖</span>
              <span className="text-primary font-semibold">{dimensionsCovered}</span>
              <span>/</span>
              <span className="font-semibold">4</span>
              <span>维度</span>
              <div className="flex gap-1 ml-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-[3px] rounded-[1.5px] transition-all ${
                      i < dimensionsCovered
                        ? "bg-brand-dark w-5"
                        : i === dimensionsCovered
                        ? "bg-accent w-7"
                        : "bg-border-light w-5"
                    }`}
                  />
                ))}
              </div>
            </div>
            <button className="btn-secondary text-[13px] py-1.5 px-3.5" onClick={handleEndInterview}>
              结束采访，生成我的主页
            </button>
          </div>

          {/* Switch to Quick Create */}
          <div className="px-5 mb-2">
            <button
              onClick={() => setShowSwitchModal(true)}
              className="inline-flex items-center gap-1 bg-transparent border-none text-text-placeholder text-xs cursor-pointer px-2 py-1 rounded-sm transition-colors hover:bg-elevated"
            >
              <span className="text-sm">←</span> 切换到快速创建
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`msg-bubble ${msg.type === "ai" ? "msg-bubble--ai" : "msg-bubble--user"}`}>
                {msg.type === "ai" && msg.category && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                        msg.category === "self_intro" ? "bg-[#9B4D4D]" :
                        msg.category === "background" ? "bg-[#B8A9C9]" :
                        msg.category === "offer" ? "bg-[#A8BF9A]" : "bg-[#C9A882]"
                      }`}
                    />
                    <span className="text-[11px] font-medium text-text-secondary tracking-[0.03em]">
                      {CATEGORY_LABELS[msg.category]}
                    </span>
                  </div>
                )}
                <div>{msg.content}</div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-1 px-4 py-3 mb-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-accent animate-dot-jump"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex gap-2 px-4 py-3 border-t border-border-light bg-surface">
            <textarea
              ref={inputRef}
              className="flex-1 border border-border rounded-md px-3.5 py-2.5 text-sm font-sans bg-bg resize-none focus:outline-none focus:border-brand-dark transition-colors"
              rows={2}
              placeholder="输入你的回答..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn-primary py-2 px-4" onClick={handleSend}>
              发送
            </button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="split-right">
          {/* Tags */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-text-secondary mb-3">标签云</div>
            <div className="flex flex-wrap gap-1.5">
              <span className="tag tag--belong animate-tag-pop-in">实验中学 2006</span>
              <span className="tag tag--belong animate-tag-pop-in" style={{ animationDelay: "0.05s" }}>清华计算机系</span>
              <span className="tag tag--offer animate-tag-pop-in" style={{ animationDelay: "0.1s" }}>AI 创业</span>
              <span className="tag tag--offer animate-tag-pop-in" style={{ animationDelay: "0.15s" }}>产品设计</span>
              <span className="tag tag--follow animate-tag-pop-in" style={{ animationDelay: "0.2s" }}>互联网</span>
            </div>
          </div>

          {/* Content Blocks */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-text-secondary mb-3">内容块</div>
            <div className="flex flex-col gap-2">
              {[
                { cat: "self_intro", label: "自我介绍", text: "张明远，AI 创业者，前大厂产品负责人，2006 年实验中学毕业。" },
                { cat: "background", label: "历史背景", text: "清华计算机系毕业，15 年互联网行业经验，曾在字节跳动、美团担任产品负责人。" },
              ].map((b) => (
                <div
                  key={b.cat}
                  className="relative bg-surface border border-border rounded-md py-2.5 px-3.5 pl-[18px] text-[13px] leading-relaxed shadow-sm"
                >
                  <div className="absolute left-1 top-2.5 bottom-2.5 w-[3px] rounded-[1.5px]"
                    style={{
                      background:
                        b.cat === "self_intro" ? "#9B4D4D" :
                        b.cat === "background" ? "#B8A9C9" :
                        b.cat === "offer" ? "#A8BF9A" : "#C9A882"
                    }}
                  />
                  <div className="text-[10px] font-medium text-text-secondary mb-[3px] tracking-[0.05em]">{b.label}</div>
                  <div>{b.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Intro */}
          <div>
            <div className="text-sm font-semibold text-text-secondary mb-3">简介</div>
            <div className="bg-surface border border-border rounded-md p-3 text-sm leading-relaxed">
              张明远，2006 年从实验中学高三 3 班毕业，后进入清华大学计算机系。拥有 15 年互联网行业经验，曾在字节跳动和美团担任产品方向的核心职位。目前是一名 AI 创业者，专注于企业知识管理领域。
            </div>
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <>
          <div className="modal-overlay" onClick={() => setShowSummary(false)} />
          <div className="modal-content" style={{ maxWidth: "520px", maxHeight: "80vh", overflowY: "auto", display: "block" }}>
            <h3 className="font-serif text-h1 text-brand-dark mb-1">✓ 采访完成</h3>
            <p className="text-sm text-text-placeholder mb-6">AI 已根据对话生成了你的主页预览，请确认以下内容</p>

            <div className="border border-border rounded-md p-3.5 mb-3 text-sm leading-relaxed">
              <div className="text-[11px] font-semibold text-text-secondary mb-1.5 tracking-[0.03em]">标签云</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="tag tag--belong text-[11px]">实验中学 2006</span>
                <span className="tag tag--belong text-[11px]">清华计算机系</span>
                <span className="tag tag--offer text-[11px]">AI 创业</span>
                <span className="tag tag--offer text-[11px]">产品设计</span>
                <span className="tag tag--follow text-[11px]">独立音乐</span>
                <span className="tag tag--delta text-[11px]">寻找技术合伙人</span>
              </div>
              <div className="text-[11px] text-text-placeholder">琥珀金标签是 AI 新增的，可在下一步中确认或移除</div>
            </div>

            <div className="border border-border rounded-md p-3.5 mb-3">
              <div className="text-[11px] font-semibold text-text-secondary mb-1.5 tracking-[0.03em]">简介</div>
              <div className="text-[15px] leading-relaxed">
                张明远，2006 年从实验中学高三 3 班毕业，后进入清华大学计算机系。拥有 15 年互联网行业经验，曾在字节跳动和美团担任产品方向的核心职位。目前是一名 AI 创业者，专注于企业知识管理领域。正在寻找志同道合的技术合伙人。
              </div>
            </div>

            <div className="border border-border rounded-md p-3.5 mb-6">
              <div className="text-[11px] font-semibold text-text-secondary mb-1.5 tracking-[0.03em]">内容块（3 个已确认）</div>
              <div className="text-[13px] text-text-secondary">自我介绍 · 历史背景 · 能提供的 · 具体需求</div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border-light">
              <button className="btn-delta--reject text-sm py-2 px-5" onClick={() => setShowSummary(false)}>继续修改</button>
              <button className="btn-primary text-sm" onClick={goToReview}>确认并继续</button>
            </div>
          </div>
        </>
      )}

      {/* Switch Modal */}
      {showSwitchModal && (
        <>
          <div className="modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowSwitchModal(false)} />
          <div className="modal-content" style={{ maxWidth: "360px", textAlign: "center", display: "block" }}>
            <p className="text-body-lg font-semibold text-text-primary mb-2">切换到快速创建？</p>
            <p className="text-sm text-text-secondary mb-5 leading-relaxed">
              当前采访进度将被保留为草稿，你可以随时回来继续。
            </p>
            <div className="flex gap-3 justify-center">
              <button className="btn-delta--reject text-sm py-2 px-5" onClick={() => setShowSwitchModal(false)}>继续采访</button>
              <Link href="/create/quick" className="btn-primary text-sm">切换到快速创建</Link>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
