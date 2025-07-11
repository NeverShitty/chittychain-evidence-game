#!/bin/bash

# Deploy ChittyChain Evidence Game via GitHub + Railway
# Fastest deployment method - just push to GitHub and Railway auto-deploys

set -e

echo "🚂 Deploying ChittyChain Evidence Game via GitHub + Railway"
echo "🎯 This is the fastest and most reliable deployment method"
echo ""

# Check if we're in a git repo
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git branch -M main
fi

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
logs/
temp/
backups/
*.log
.env.local
.DS_Store
*.tmp
generated_documents/
EOF

# Add all files
echo "📦 Adding deployment files to Git..."
git add .
git commit -m "🎮 ChittyChain Evidence Game - Production deployment

Features:
- Real blockchain evidence minting with XP rewards
- Achievement system with 7+ achievements  
- Daily quests and leaderboards
- WebSocket real-time updates
- ChittyChain MCP integration
- Global API endpoints

🚀 Ready for Railway deployment" || echo "Already committed"

echo ""
echo "🎯 DEPLOYMENT OPTIONS:"
echo ""
echo "Option 1: AUTOMATIC GITHUB DEPLOY (Recommended)"
echo "=============================================="
echo "1. Create new GitHub repo: https://github.com/new"
echo "2. Name it: chittychain-evidence-game"
echo "3. Run these commands:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/chittychain-evidence-game.git"
echo "   git push -u origin main"
echo ""
echo "4. Go to Railway: https://railway.app"
echo "5. Click 'Deploy from GitHub'"
echo "6. Select your repo"
echo "7. LIVE IN 2 MINUTES! 🚀"
echo ""
echo "Option 2: RAILWAY CLI DEPLOY"
echo "============================"
echo "1. Install Railway CLI:"
echo "   curl -fsSL https://railway.app/install.sh | sh"
echo "2. Login: railway login"
echo "3. Deploy: railway up"
echo ""
echo "Option 3: ONE-CLICK DEPLOY BUTTON"
echo "================================="
echo "Add this to your GitHub README:"
echo ""
echo "[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/chittychain-evidence-game)"
echo ""

# Show current files
echo "📋 DEPLOYMENT FILES READY:"
echo "=========================="
ls -la | grep -E '\.(js|json|md|sh|env|Dockerfile)$' | while read line; do
    echo "✅ $line"
done

echo ""
echo "🎮 GAME SERVER FEATURES:"
echo "======================="
echo "✅ Express.js API server"
echo "✅ Socket.io WebSocket support"  
echo "✅ XP system (25 XP per mint, 100 XP per audit)"
echo "✅ Achievement system (7 achievements)"
echo "✅ Daily quests (reset at midnight)"
echo "✅ Leaderboards (top 10 players)"
echo "✅ ChittyChain CLI integration"
echo "✅ Production logging"
echo "✅ Health checks"
echo "✅ Auto-scaling ready"

echo ""
echo "🔗 API ENDPOINTS (Once deployed):"
echo "================================"
echo "GET  /api/player/:id       - Player profile"
echo "GET  /api/chain/status     - Blockchain status"
echo "GET  /api/leaderboard      - Top players"
echo "GET  /api/quests/daily     - Daily quests"
echo "POST /api/evidence/mint    - Mint evidence (+XP)"
echo "POST /api/evidence/verify  - Verify evidence (+XP)"
echo "POST /api/chain/audit      - Audit chain (+XP)"

echo ""
echo "💡 RECOMMENDED NEXT STEPS:"
echo "========================="
echo "1. 🌐 Push to GitHub (see commands above)"
echo "2. 🚂 Deploy on Railway (automatic)"
echo "3. 🎮 Update your React app with live URL"
echo "4. 🎯 Start minting real evidence with XP!"

echo ""
echo "🎉 YOUR EVIDENCE GAME IS READY FOR GLOBAL DEPLOYMENT!"
echo ""
echo "Repository ready for: https://github.com/YOUR_USERNAME/chittychain-evidence-game"
echo "Railway deploy: https://railway.app"
echo ""
echo "Questions? Run: cat DEPLOY-INSTRUCTIONS.md"