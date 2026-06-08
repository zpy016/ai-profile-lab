"use client";

import { useState, useCallback, useRef } from "react";

export default function AdminPage() {
  const [model, setModel] = useState("deepseek-v4-pro");
  const [temperature, setTemperature] = useState(0.7);
  const [tagPrompt, setTagPrompt] = useState(
    `你是一位校友档案整理员。请从以下自我介绍中提取标签，每个标签不超过8个字。标签分为四类：属于（身份归属）、提供（能给予的）、需要（需要的）、关注（兴趣爱好）。输出JSON格式。`
  );
  const [introPrompt, setIntroPrompt] = useState(
    `你是一位克制得体的档案撰写人，为2006届实验中学毕业的同学撰写个人简介。请使用第三人称，语气温和体面，不超过200字。避免空洞的形容词，注重具体的事实和经历。`
  );
  const [imagePrompt, setImagePrompt] = useState(
    `Generate an abstract cover image for this alumni profile. Use elements that reflect: {user_tags}, {profession}, {hometown}. Soft lighting, editorial quality.`
  );
  const [interviewPrompt, setInterviewPrompt] = useState(
    `你是实验中学2006届校友的AI采访助手。你的采访风格温暖而专业，像老朋友在咖啡馆聊天。你需要逐步覆盖四个维度：自我介绍 → 历史背景 → 能提供的 → 具体需求。每个问题不超过30字，保持克制得体。`
  );
  const [targetDimensions, setTargetDimensions] = useState(4);
  const [maxRounds, setMaxRounds] = useState(8);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
  }, []);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
      showToast("预览已更新");
    }, 1800);
  };

  return (
    <main className="overflow-hidden h-[calc(100vh-56px)]">
      <div className="flex h-full">
        {/* LEFT: Preview Panel (55%) */}
        <div className="w-[55%] min-w-[480px] border-r border-border-light overflow-y-auto bg-bg flex flex-col">
          <div className="flex items-center justify-between px-5 py-2.5 bg-surface border-b border-border-light sticky top-0 z-sticky flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              用户视角预览（只读）
            </div>
            <div className="text-xs font-medium text-text-placeholder">
              当前用户：<strong className="text-text-primary font-semibold">张明远</strong>（测试账号）
            </div>
          </div>

          <div className="flex items-start justify-center p-8 pb-16 flex-1">
            <div className="w-full max-w-[480px] bg-surface rounded-md shadow-lg overflow-hidden origin-top scale-[0.92]">
              {/* Preview Card Image */}
              <div className="w-full aspect-[16/9] relative" style={{
                background: "linear-gradient(135deg, #E8D5C4 0%, #C49A6C 25%, #9B4D4D 50%, #4A6670 75%, #2C3E50 100%)"
              }}>
                <div className="absolute bottom-0 left-0 right-0 bg-white/85 backdrop-blur-[4px] px-3 py-1.5 flex items-center justify-between text-[10px] text-text-secondary z-[1]">
                  <span>内容已更新，图片可能需要刷新</span>
                  <span className="text-[10px] font-medium text-accent border border-accent rounded-sm px-2 py-0.5 bg-transparent cursor-pointer">更新图片</span>
                </div>
              </div>
              {/* Preview Card Body */}
              <div className="p-5">
                <div className="font-serif text-[20px] font-semibold text-text-heading tracking-[0.01em] text-center mb-0.5">张明远</div>
                <div className="text-[13px] text-text-secondary text-center mb-5">2006 届 · 高三（3）班</div>

                <p className="text-sm leading-[1.65] text-text-primary mb-3.5">
                  前大厂产品负责人，现 AI 创业者。2006 年从实验中学毕业后，进入清华计算机系，之后在互联网行业深耕 15 年。
                </p>

                <div className="bg-accent-bg border border-dashed border-accent rounded-md p-2.5 text-sm leading-[1.65] text-text-primary mb-3.5">
                  目前正在寻找技术合伙人，也希望能与校友们交流 AI 创业心得。
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="tag text-[11px] tag--belong py-0.5 px-2">实验中学 2006</span>
                  <span className="tag text-[11px] tag--belong py-0.5 px-2">清华计算机系</span>
                  <span className="tag text-[11px] tag--offer py-0.5 px-2">AI 创业</span>
                  <span className="tag text-[11px] tag--offer py-0.5 px-2">产品设计</span>
                  <span className="tag text-[11px] tag--follow py-0.5 px-2">独立音乐</span>
                  <span className="tag text-[11px] tag--delta py-0.5 px-2">寻找技术合伙人</span>
                  <span className="tag text-[11px] tag--need py-0.5 px-2">天使投资</span>
                </div>

                <div className="flex flex-col gap-2">
                  {[
                    { cat: "self_intro", label: "自我介绍", text: "AI 创业者，前大厂产品负责人，2006 年从实验中学毕业。" },
                    { cat: "background", label: "历史背景", text: "清华计算机系毕业，15 年互联网行业经验，字节跳动、美团。" },
                    { cat: "offer", label: "能提供的", text: "AI 产品设计咨询、创业经验分享、技术团队管理经验。" },
                    { cat: "need", label: "具体需求", text: "寻找技术合伙人（后端/算法），天使轮融资机会。" },
                  ].map((b) => (
                    <div key={b.cat} className="relative bg-surface border border-border rounded-md py-2.5 px-3 pl-4 shadow-sm">
                      <div className="absolute left-1 top-2.5 bottom-2.5 w-0.5 rounded-[1px]"
                        style={{
                          background:
                            b.cat === "self_intro" ? "#9B4D4D" : b.cat === "background" ? "#B8A9C9" :
                            b.cat === "offer" ? "#A8BF9A" : "#C9A882"
                        }}
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-text-primary">{b.label}</span>
                        <span className="text-[9px] font-medium text-accent rounded-[2px] px-1 py-px" style={{ background: "rgba(196,154,108,0.12)" }}>AI</span>
                      </div>
                      <p className="text-xs leading-relaxed text-text-primary">{b.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Parameter Panel (45%) */}
        <div className="flex-1 min-w-[360px] overflow-y-auto bg-surface">
          <div className="sticky top-0 z-sticky bg-surface border-b border-border-light px-5 py-4 flex items-center justify-between">
            <span className="font-serif text-h2 text-brand-dark tracking-[0.02em]">AI Lab / 效果调优</span>
            <button className="btn-primary gap-1.5" onClick={handleRegenerate} disabled={isRegenerating}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 8a6 6 0 0 1 10.472-4M14 8a6 6 0 0 1-10.472 4"/><polyline points="14 2 14 8 8 8"/>
              </svg>
              {isRegenerating ? "正在生成..." : "重新生成预览"}
            </button>
          </div>

          <div className="px-5 pb-10 pt-0">
            {/* Model & Config */}
            <section className="mb-8 mt-6">
              <div className="text-h2 text-text-primary mb-0.5">模型与配置</div>
              <div className="text-[13px] text-text-secondary mb-4">控制 AI 生成使用的底层模型和全局策略</div>

              <div className="mb-4">
                <label className="flex items-center justify-between text-[13px] font-medium text-text-primary mb-1.5">
                  AI 模型
                </label>
                <select
                  className="w-full border border-border rounded-sm px-3.5 py-2.5 text-sm font-sans text-text-primary bg-surface cursor-pointer appearance-none transition-colors focus:outline-none focus:border-brand-dark focus:shadow-[0_0_0_2px_rgba(74,102,112,0.12)]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%23546E7A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    paddingRight: "36px",
                  }}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="deepseek-v4-pro">DeepSeek-V4-pro（当前使用）</option>
                  <option value="deepseek-v4-lite">DeepSeek-V4-lite（快速）</option>
                  <option value="doubao-pro-32k">Doubao Pro 32K</option>
                  <option value="doubao-lite">Doubao Lite</option>
                </select>
              </div>

              <div>
                <label className="flex items-center justify-between text-[13px] font-medium text-text-primary mb-1.5">
                  Temperature
                  <span className="text-xs text-text-placeholder font-normal">{temperature}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                  style={{ accentColor: "var(--color-primary)" }}
                />
              </div>
            </section>

            {/* Prompt Editors */}
            <section className="mb-8">
              <div className="text-h2 text-text-primary mb-0.5">Prompt 编辑器</div>
              <div className="text-[13px] text-text-secondary mb-4">调整 AI 行为，修改后点击「重新生成预览」生效</div>

              {[
                { label: "标签提取", value: tagPrompt, setter: setTagPrompt, rows: 3 },
                { label: "简介生成", value: introPrompt, setter: setIntroPrompt, rows: 3 },
              ].map((item) => (
                <div key={item.label} className="mb-4">
                  <label className="text-[13px] font-medium text-text-primary mb-1.5 block">{item.label}</label>
                  <textarea
                    className="w-full border border-border rounded-sm p-3.5 text-[13px] font-mono leading-relaxed resize-y min-h-[80px] focus:outline-none focus:border-brand-dark"
                    rows={item.rows}
                    value={item.value}
                    onChange={(e) => item.setter(e.target.value)}
                  />
                </div>
              ))}

              {/* Image Prompt with locked prefix */}
              <div className="mb-4">
                <label className="text-[13px] font-medium text-text-primary mb-1.5 block">图片生成</label>
                <div className="bg-elevated border border-border-light rounded-sm p-2.5 mb-2 font-mono text-xs leading-relaxed text-text-placeholder whitespace-pre-wrap break-all flex items-start gap-2">
                  <span className="flex-shrink-0 mt-px text-text-disabled text-[13px]">🔒</span>
                  <span>[系统锁定] abstract composition, muted morandi palette, no human face, no text, digital yearbook aesthetic, subtle geometric forms, warm nostalgic atmosphere, 16:9 aspect ratio</span>
                </div>
                <textarea
                  className="w-full border border-border rounded-sm p-3.5 text-[13px] font-mono leading-relaxed resize-y min-h-[80px] focus:outline-none focus:border-brand-dark"
                  rows={2}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                />
              </div>

              {/* Interview Prompt */}
              <div>
                <label className="text-[13px] font-medium text-text-primary mb-1.5 block">采访引导</label>
                <textarea
                  className="w-full border border-border rounded-sm p-3.5 text-[13px] font-mono leading-relaxed resize-y min-h-[80px] focus:outline-none focus:border-brand-dark"
                  rows={3}
                  value={interviewPrompt}
                  onChange={(e) => setInterviewPrompt(e.target.value)}
                />
              </div>
            </section>

            {/* Interview Convergence */}
            <section className="mb-8">
              <div className="text-h2 text-text-primary mb-0.5">采访收敛条件</div>
              <div className="text-[13px] text-text-secondary mb-4">控制 AI 采访模式的停止策略</div>

              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="flex items-center justify-between text-[13px] font-medium text-text-primary mb-1.5">
                    目标维度数 <span className="text-xs text-text-placeholder font-normal">1–4</span>
                  </label>
                  <select
                    className="w-full border border-border rounded-sm px-3.5 py-2.5 text-sm font-sans text-text-primary bg-surface cursor-pointer appearance-none focus:outline-none focus:border-brand-dark"
                    value={targetDimensions}
                    onChange={(e) => setTargetDimensions(parseInt(e.target.value))}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%23546E7A' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}
                  >
                    <option value={4}>4（全部覆盖）</option>
                    <option value={3}>3</option>
                    <option value={2}>2</option>
                    <option value={1}>1</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="flex items-center justify-between text-[13px] font-medium text-text-primary mb-1.5">
                    最大追问轮数 <span className="text-xs text-text-placeholder font-normal">3–10</span>
                  </label>
                  <select
                    className="w-full border border-border rounded-sm px-3.5 py-2.5 text-sm font-sans text-text-primary bg-surface cursor-pointer appearance-none focus:outline-none focus:border-brand-dark"
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%23546E7A' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px" }}
                  >
                    <option value={8}>8（默认）</option>
                    <option value={3}>3（快速）</option>
                    <option value={5}>5</option>
                    <option value={10}>10（深入）</option>
                  </select>
                </div>
              </div>
            </section>

            {/* AI Logs */}
            <section>
              <div className="text-h2 text-text-primary mb-0.5">最近 AI 处理日志</div>
              <div className="text-[13px] text-text-secondary mb-4">测试账号「张明远」最近的 AI 操作记录</div>

              {/* Stats */}
              <div className="flex gap-4 mb-4 p-3.5 bg-elevated rounded-sm">
                {[
                  { value: "10", label: "总操作数" },
                  { value: "3", label: "增量抹除", warn: true },
                  { value: "6", label: "用户确认" },
                  { value: "1", label: "错误" },
                ].map((s, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className={`text-[20px] font-semibold ${s.warn ? "text-accent" : "text-text-primary"}`}>{s.value}</div>
                    <div className="text-[11px] text-text-placeholder mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Log List */}
              <div className="flex flex-col gap-2">
                {[
                  { time: "2026-06-07 17:32", type: "correction", tag: "实质性纠偏", body: <>输入：<strong>「我搞产品很多年了」</strong> → AI 提取标签「资深产品经理」→ 用户手动改为「产品设计」</> },
                  { time: "2026-06-07 17:30", type: "delta_removed", tag: "增量抹除", body: <>输入：<strong>「周末喜欢爬山、看书」</strong> → AI 生成增量「户外运动达人」→ 用户一键 <span style={{ color: "var(--color-error)" }}>抹除</span> 该标签</> },
                  { time: "2026-06-07 17:28", type: "new_content", tag: "新增内容", body: <>输入：<strong>「我在创业」</strong> → AI 生成内容块「自我介绍」+ 标签「AI 创业」→ 用户全部确认</> },
                  { time: "2026-06-07 17:25", type: "correction", tag: "实质性纠偏", body: <>输入：<strong>「清华毕业」</strong> → AI 推断「清华经管」→ 用户更正为「清华计算机系」</> },
                  { time: "2026-06-07 17:20", type: "delta_removed", tag: "增量抹除", extraTag: "异常", body: <>输入：<strong>「海淀咖啡馆常客」</strong> → AI 生成标签「五道口咖啡师」→ 用户抹除 → <span style={{ color: "var(--color-error)" }}>注意：本轮 AI 误解了用户意图</span></> },
                  { time: "2026-06-07 16:55", type: "new_content", tag: "新增内容", body: <>输入：<strong>「我做过产品，带过团队」</strong> → AI 生成内容块「历史背景」+ 标签「产品设计」→ 用户全部确认</> },
                ].map((log, i) => {
                  const tagColors: Record<string, { bg: string; color: string }> = {
                    correction: { bg: "bg-primary-surface", color: "text-primary" },
                    delta_removed: { bg: "bg-accent-surface", color: "text-accent" },
                    new_content: { bg: "bg-success-surface", color: "text-success" },
                  };
                  const tc = tagColors[log.type] || { bg: "bg-elevated", color: "text-text-placeholder" };
                  return (
                    <div key={i} className="bg-surface border border-border-light rounded-sm p-3 hover:border-border transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-text-placeholder font-normal">{log.time}</span>
                        <div className="flex gap-1 flex-wrap">
                          <span className={`inline-flex items-center rounded-[2px] px-1.5 py-px text-[10px] font-semibold font-sans tracking-[0.02em] ${tc.bg} ${tc.color}`}>
                            {log.tag}
                          </span>
                          {log.extraTag && (
                            <span className="inline-flex items-center rounded-[2px] px-1.5 py-px text-[10px] font-semibold font-sans tracking-[0.02em] bg-error-surface text-error">
                              {log.extraTag}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs leading-relaxed text-text-secondary">
                        {log.body}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast ${toastVisible ? "toast--visible" : ""}`}>{toastMsg}</div>
    </main>
  );
}
