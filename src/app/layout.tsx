import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/layout/TopNav";
import MobileRedirect from "@/components/layout/MobileRedirect";

export const metadata: Metadata = {
  title: "实验同学录 — 2006 届校友的数字纪念册",
  description: "用 AI 重新认识彼此。告诉 AI 你是谁，它帮你写出你的数字档案。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <MobileRedirect />
        <TopNav />
        {children}
      </body>
    </html>
  );
}
