/**
 * Seed script: creates a test user with a full profile for POC testing.
 * Run: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding test data...");

  // Clean existing data
  await prisma.profileTag.deleteMany();
  await prisma.contentBlock.deleteMany();
  await prisma.aILog.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.promptVersion.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  const user = await prisma.user.create({
    data: {
      id: "test-user-001",
      name: "张明远",
      className: "高三（3）班",
      avatar: "",
    },
  });
  console.log(`👤 Created user: ${user.name}`);

  // Create profile
  const profile = await prisma.profile.create({
    data: {
      userId: user.id,
      userConfirmedIntro: "前大厂产品负责人，现 AI 创业者。2006 年从实验中学毕业后，进入清华计算机系，之后在互联网行业深耕 15 年。2024 年创立 AI 初创公司，专注于企业知识管理领域。",
      aiDeltaIntro: "目前在寻找志同道合的技术合伙人，也希望能与校友们交流 AI 创业的心得。周末经常回海淀，偶尔在五道口附近喝咖啡，欢迎约聊。",
      introSource: "user_edited",
      status: "active",
      publishedAt: new Date(),
      hasUnconfirmedDelta: true,
      creationMethod: "quick",
      imageOutdated: true,
    },
  });
  console.log("📋 Created profile");

  // Create tags
  const tags = [
    { tagText: "实验中学 2006", tagType: "belong", source: "user_edited" },
    { tagText: "清华计算机系", tagType: "belong", source: "ai" },
    { tagText: "AI 创业", tagType: "offer", source: "user_edited" },
    { tagText: "企业知识管理", tagType: "offer", source: "ai" },
    { tagText: "产品设计", tagType: "offer", source: "user_edited" },
    { tagText: "科技前沿", tagType: "follow", source: "ai" },
    { tagText: "独立音乐", tagType: "follow", source: "user_edited" },
    { tagText: "寻找技术合伙人", tagType: "need", source: "ai", isDelta: true },
    { tagText: "海淀咖啡", tagType: "follow", source: "ai", isDelta: true },
    { tagText: "天使投资", tagType: "need", source: "ai", visibility: "search_only" },
    { tagText: "北京", tagType: "belong", source: "user_edited" },
  ];

  let order = 0;
  for (const tag of tags) {
    await prisma.profileTag.create({
      data: {
        ...tag,
        profileId: profile.id,
        order: order++,
      } as any,
    });
  }
  console.log(`🏷️  Created ${tags.length} tags`);

  // Create content blocks
  const blocks = [
    {
      category: "self_intro",
      content: "我是一名 AI 创业者，前大厂产品负责人，2006 年从实验中学毕业。",
      source: "ai_extracted",
      visibility: "public",
    },
    {
      category: "background",
      content: "清华计算机系毕业，15 年互联网行业经验，曾在字节跳动、美团担任产品负责人。",
      source: "ai_extracted",
      visibility: "public",
    },
    {
      category: "offer",
      content: "AI 产品设计咨询、创业经验分享、技术团队管理经验。可以帮校友评估 AI 创业方向。",
      source: "ai_extracted",
      visibility: "public",
    },
    {
      category: "need",
      content: "正在寻找技术合伙人（后端/算法方向），以及天使轮融资机会。",
      source: "ai_interview",
      visibility: "search_only",
    },
  ];

  order = 0;
  for (const block of blocks) {
    await prisma.contentBlock.create({
      data: {
        ...block,
        profileId: profile.id,
        title: "",
        order: order++,
      } as any,
    });
  }
  console.log(`📦 Created ${blocks.length} content blocks`);

  // Create default prompts
  const prompts = [
    {
      promptKey: "extract_tags",
      content: `你是一位校友档案整理员。请从以下自我介绍中提取标签，每个标签不超过8个字。
标签分为四类：
- belong（属于/身份归属）：学校、公司、城市、专业等
- offer（能提供的）：技能、资源、经验
- need（需要的）：正在寻找的、需求的
- follow（关注的）：兴趣爱好、关注领域

请以 JSON 格式输出，包含 tags 数组，每个 tag 有 text 和 type 字段。
同时输出 content_blocks 数组，每个 block 有 category（self_intro/background/offer/need/custom）和 content 字段。
以及一个 intro 字段，为一段流畅的第三人称简介。`,
      version: 1,
      isActive: true,
    },
    {
      promptKey: "generate_intro",
      content: `你是一位克制得体的档案撰写人，为2006届实验中学毕业的同学撰写个人简介。
请使用第三人称，语气温和体面，不超过200字。
避免空洞的形容词，注重具体的事实和经历。
保持「数字纪念册」的克制怀旧文风。`,
      version: 1,
      isActive: true,
    },
    {
      promptKey: "generate_image",
      content: `Generate an abstract cover image for this alumni profile.
[SYSTEM LOCKED PREFIX] abstract composition, muted morandi palette, no human face, no text, digital yearbook aesthetic, subtle geometric forms, warm nostalgic atmosphere, 16:9 aspect ratio

Use elements that reflect the person's identity, profession and background. Soft lighting, editorial quality.`,
      version: 1,
      isActive: true,
    },
    {
      promptKey: "interview_guide",
      content: `你是实验中学2006届校友的AI采访助手。你的采访风格温暖而专业，像老朋友在咖啡馆聊天。
你需要逐步覆盖四个维度：自我介绍 → 历史背景 → 能提供的 → 具体需求。
每个问题不超过30字，保持克制得体。`,
      version: 1,
      isActive: true,
    },
  ];

  for (const p of prompts) {
    await prisma.promptVersion.create({ data: p as any });
  }
  console.log(`📝 Created ${prompts.length} default prompts`);

  // Create sample AI logs
  const logs = [
    { action: "extract_tags", model: "doubao-pro-32k", duration: 1200, userModified: true, modificationType: "substantive", modification: "「资深产品经理」→用户改为「产品设计」" },
    { action: "extract_tags", model: "doubao-pro-32k", duration: 800, userModified: true, modificationType: "delta_rejected", modification: "用户抹除「户外运动达人」" },
    { action: "generate_intro", model: "doubao-pro-32k", duration: 1500, userModified: false, modificationType: null, modification: "" },
    { action: "interview", model: "doubao-pro-32k", duration: 3200, userModified: true, modificationType: "substantive", modification: "「清华经管」→用户更正为「清华计算机系」" },
  ];

  for (const log of logs) {
    await prisma.aILog.create({
      data: {
        ...log,
        userId: user.id,
        input: "",
        output: "",
        promptUsed: "default",
        createdAt: new Date(Date.now() - Math.random() * 86400000),
      } as any,
    });
  }
  console.log(`📊 Created ${logs.length} AI logs`);

  console.log("\n✅ Seed complete! Test user ID: test-user-001");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
