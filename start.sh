#!/bin/bash
# AI Profile LAB 启动脚本 — 自动加载 .env.local
set -e

# 加载环境变量
if [ -f /var/www/ai-profile-lab/.env.local ]; then
  export $(cat /var/www/ai-profile-lab/.env.local | grep -v '^#' | xargs)
fi

# 启动 Next.js
cd /var/www/ai-profile-lab
exec npm start
