# 实验同学录 · AI 自我介绍 POC

> **产品定位**：第二代同学录核心能力验证 —— 用 AI 把「写个人主页」变成「跟 AI 聊天」
> **部署地址**：http://69.5.21.128:8033/
> **技术栈**：Next.js 14 + TypeScript + Tailwind CSS + Prisma + SQLite
> **AI 引擎**：DeepSeek-V4-pro（火山引擎 Ark）+ 火山视觉智能（图片生成）

---

## 功能特性

### 已上线

- [x] **首页 Landing**：品牌展示 + 四态状态机（empty / draft / active / dirty）自动路由
- [x] **快速创建**：口述/键入自我介绍 → AI 提取标签/简介/内容块 → Review 确认 → 发布
- [x] **AI 采访模式**：4 维度逐轮对话 + SSE 流式输出 + 右侧实时预览
- [x] **个人主页**：inline 内容块新增/编辑/删除 + delta 增量确认机制
- [x] **AI Lab 后台**：⚙ 齿轮图标入口 + `/admin` 管理面板
- [x] **图片生成**：基于标签云自动生成 16:9 个人主页头图
- [x] **草稿自动保存**：quick + interview 双 localStorage 草稿，断网不丢进度
- [x] **SSE 断线恢复**：3 次自动重试 + 手动重连 +「保存并稍后继续」
- [x] **路径切换**：interview → quick 降级时 preview 数据自动传递

### 10 个 UX 断点修复状态

| 断点 | 描述 | 状态 |
|------|------|------|
| BP1 | 首页 `/` 未定义 | ✅ 已修复 |
| BP2 | 创建→主页过渡缺失 | ✅ 已修复 |
| BP3 | AI Lab 导航入口缺失 | ✅ 已修复 |
| BP4 | 内容块新增/编辑流程未定义 | ✅ 已修复 |
| BP5 | 快速创建与采访模式无法切换 | ✅ 已修复 |
| BP6 | 无草稿自动保存 | ✅ 已修复 |
| BP7 | SSE 断线恢复后采访上下文不清 | ✅ 已修复 |
| BP8 | 新增内容块触发流程未定义 | ✅ 已修复 |
| BP9 | 个人主页状态机未定义 | ✅ 已修复 |
| BP10 | 创建完成后的 CTA 缺失 | ✅ 已修复 |

---

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制 .env.local 并填入）
cp .env.example .env.local
# 必填：VOLC_API_KEY, VOLC_ENDPOINT_LLM, VOLC_ACCESSKEY, VOLC_SECRETKEY

# 3. 初始化数据库
npx prisma migrate dev
npx prisma db seed

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

---

## 部署

项目通过 GitHub Actions 自动部署到火山引擎 ECS：

1. Push 到 `main` 分支触发工作流（`.github/workflows/deploy.yml`）
2. 服务器端构建 + PM2 进程管理
3. 环境变量通过 GitHub Secrets 注入

---

## 设计文档

| 文档 | 说明 |
|------|------|
| `PRD-AI自我介绍POC-v1.md` | 产品需求规格（PRD v1.4） |
| `DESIGN.md` | 设计系统（v1.2） |
| `UX-ARCHITECTURE.md` | 用户体验架构（v1.1） |
| `UI_DESIGN_SPEC.md` | UI 设计交付规格（v1.1） |

---

> **核心原则**：每个用户操作都必须有明确的起点、过程和终点。不留悬念，不悬空，不让用户问"然后呢"。
>
> **用户是 Boss**：不仅在 AI 增量内容层面，更在整个产品流程层面 —— 用户随时可以保存草稿、切换路径、中断恢复。
