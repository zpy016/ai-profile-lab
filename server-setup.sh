#!/bin/bash
# ──────────────────────────────────────────────
# AI Profile LAB — 服务器首次配置脚本
# SSH 到服务器后，运行此脚本完成环境搭建。
#
# 使用方法：
#   scp server-setup.sh root@你的服务器IP:/tmp/
#   ssh root@你的服务器IP "bash /tmp/server-setup.sh"
#
# 或者手动 SSH 进去后粘贴运行。
# ──────────────────────────────────────────────

set -e

echo "🔧 AI Profile LAB — 服务器环境初始化"
echo "========================================"

# ── 1. 安装 Node.js 22 ──
echo ""
echo "📦 1/7 安装 Node.js 22 ..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "   Node.js $(node -v)"
echo "   npm $(npm -v)"

# ── 2. 安装 PM2 ──
echo ""
echo "📦 2/7 安装 PM2 进程管理器 ..."
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "   PM2 $(pm2 -v)"

# ── 3. 安装 Nginx ──
echo ""
echo "📦 3/7 安装 Nginx ..."
if ! command -v nginx &>/dev/null; then
  apt-get update
  apt-get install -y nginx
fi
systemctl enable nginx
echo "   Nginx $(nginx -v 2>&1)"

# ── 4. 创建项目目录 ──
echo ""
echo "📁 4/7 创建项目目录 ..."
mkdir -p /var/www/ai-profile-lab

# ── 5. 配置 Nginx 反向代理（监听 8033 端口） ──
echo ""
echo "🔧 5/7 配置 Nginx (端口 8033) ..."
cat > /etc/nginx/sites-available/ai-profile-lab << 'NGINX_EOF'
# AI Profile LAB — Nginx 反向代理
server {
    listen 8033;
    server_name _;

    # 日志
    access_log /var/log/nginx/ai-profile-lab-access.log;
    error_log  /var/log/nginx/ai-profile-lab-error.log;

    # 静态资源缓存
    location /_next/static {
        alias /var/www/ai-profile-lab/.next/static;
        expires 1M;
        add_header Cache-Control "public, immutable";
    }

    # API 路由转发到 Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/ai-profile-lab /etc/nginx/sites-enabled/ai-profile-lab
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "   Nginx 配置完成 ✓ (端口 8033)"

# ── 6. 防火墙放行 ──
echo ""
echo "🔓 6/7 防火墙放行 ..."
ufw allow 8033/tcp 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
echo "   端口 8033 已放行"

# ── 7. 安全组提示 ──
echo ""
echo "⚠️  7/7 重要：请在火山云控制台配置安全组"
echo ""
echo "   进入路径: 火山云控制台 → 云服务器 → 安全组 → 添加入站规则"
echo "   ┌──────────┬──────┬──────────────┐"
echo "   │ 协议      │ 端口  │ 来源          │"
echo "   ├──────────┼──────┼──────────────┤"
echo "   │ TCP       │ 8033 │ 0.0.0.0/0    │"
echo "   │ TCP       │ 22   │ 你的IP/32     │"
echo "   └──────────┴──────┴──────────────┘"

echo ""
echo "========================================"
echo "✅ 服务器环境初始化完成！"
echo ""
echo "下一步："
echo "  1. 确保 GitHub Secrets 已配置（见下方说明）"
echo "  2. 本地 git push → GitHub Actions 自动部署"
echo "  3. 在服务器上创建 .env.local 文件（火山方舟 API Key）"
echo ""
echo "服务器端 .env.local 创建命令："
echo '  cat > /var/www/ai-profile-lab/.env.local << EOF'
echo '  VOLC_API_KEY=ark-你的API密钥'
echo '  VOLC_ENDPOINT_LLM=ep-2024xxxx...'
echo '  VOLC_ENDPOINT_IMAGE=ep-2024xxxx...'
echo '  VOLC_BASE_URL=https://ark.cn-beijing.volces.com/api/v3'
echo '  DATABASE_URL="file:./dev.db"'
echo '  EOF'
echo '  chmod 600 /var/www/ai-profile-lab/.env.local'
echo ""
echo "GitHub Secrets (在 GitHub 仓库 Settings → Secrets → Actions 中设置)："
echo '  SERVER_IP       服务器公网IP'
echo '  SERVER_USER     root'
echo '  SERVER_PASSWORD 服务器root密码'
echo "========================================"
