import Link from "next/link";

export default function CreateMethodPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] py-10 px-6">
      <div className="font-serif text-[20px] font-semibold text-brand-dark tracking-[0.02em] mb-2">
        实验同学录
      </div>
      <h1 className="font-serif text-display text-text-heading mb-2 text-center">
        创建你的个人主页
      </h1>
      <p className="text-body-lg text-text-secondary mb-12 text-center max-w-[480px]">
        选择一种你喜欢的方式，AI 会帮你完成剩下的工作
      </p>

      {/* Method Cards */}
      <div className="flex gap-6 max-w-[680px] w-full mb-8">
        <Link
          href="/create/quick"
          className="flex-1 bg-surface border border-border rounded-lg p-10 px-8 cursor-pointer text-center transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-accent no-underline text-inherit"
        >
          <div className="w-14 h-14 mx-auto mb-5 rounded-md flex items-center justify-center text-2xl bg-primary-surface text-primary">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div className="text-[20px] font-semibold text-text-heading mb-2.5">
            快速创建
          </div>
          <div className="text-body text-text-secondary leading-relaxed">
            口述或键入自我介绍<br />AI 一键生成主页
          </div>
        </Link>

        <Link
          href="/create/interview"
          className="flex-1 bg-surface border border-border rounded-lg p-10 px-8 cursor-pointer text-center transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-accent no-underline text-inherit"
        >
          <div className="w-14 h-14 mx-auto mb-5 rounded-md flex items-center justify-center text-2xl text-accent" style={{ background: "rgba(196,154,108,0.12)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="text-[20px] font-semibold text-text-heading mb-2.5">
            AI 采访模式
          </div>
          <div className="text-body text-text-secondary leading-relaxed">
            跟 AI 聊天<br />逐步完善你的主页
          </div>
        </Link>
      </div>

      <p className="text-body text-text-placeholder text-center">
        两种方式都能创建你的个人主页
      </p>
    </main>
  );
}
