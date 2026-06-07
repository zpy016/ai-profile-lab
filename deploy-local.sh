#!/bin/bash
# ──────────────────────────────────────────────
# AI Profile LAB — 本地一键部署脚本
# 使用方法: ./deploy-local.sh "描述本次修改"
# ──────────────────────────────────────────────

set -e

MSG="${1:-更新代码}"

echo "📦 AI Profile LAB — 部署到 GitHub"
echo "   提交信息: $MSG"
echo ""

# 检查是否有修改
if [ -z "$(git status --porcelain)" ]; then
  echo "⚠️  没有检测到代码修改，跳过提交。"
  echo "   如需强制推送，请手动执行: git push origin main"
  exit 0
fi

echo "📝 1/3 git add ..."
git add .

echo "💬 2/3 git commit ..."
git commit -m "$MSG"

echo "🚀 3/3 git push origin main ..."
git push origin main

echo ""
echo "✅ 推送完成！GitHub Actions 将自动构建部署。"
echo "   等待约 2-4 分钟后刷新网站即可。"
echo ""
echo "   👉 查看部署进度: https://github.com/你的用户名/ai-profile-lab/actions"
