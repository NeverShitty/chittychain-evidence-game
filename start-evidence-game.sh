#!/bin/bash

# Start Evidence Game System
# Complete gamified evidence minting system with ChittyChain integration
# Real blockchain operations with XP rewards and achievements

set -e

echo "🎮 Starting ChittyChain Evidence Game System..."
echo "🔗 Real blockchain integration with gamified UI"
echo ""

# Set working directory
cd "$(dirname "$0")"

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18 or higher."
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for ChittyChain CLI
CHITTYCHAIN_CLI="/Users/nickbianchi/MAIN/gh/ChittyChain/chittychain-cli.js"
if [ ! -f "$CHITTYCHAIN_CLI" ]; then
    echo "❌ ChittyChain CLI not found at $CHITTYCHAIN_CLI"
    echo "Please ensure ChittyChain is properly installed."
    exit 1
fi

# Test ChittyChain CLI
echo "🧪 Testing ChittyChain CLI connection..."
if node "$CHITTYCHAIN_CLI" status &> /dev/null; then
    echo "✅ ChittyChain CLI is working"
else
    echo "⚠️  ChittyChain CLI test failed - system will use fallback mode"
fi

# Install dependencies if needed
if [ ! -f "chittychain-package.json" ]; then
    echo "❌ Package configuration not found"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing game server dependencies..."
    npm install --package-lock-only --package=chittychain-package.json
    npm install express cors socket.io uuid dotenv helmet express-rate-limit compression winston
fi

# Create necessary directories
mkdir -p logs
mkdir -p temp
mkdir -p backups

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration..."
    cat > .env << EOF
# ChittyChain Evidence Game Configuration
NODE_ENV=production
PORT=3101
GAME_SERVER_PORT=3101
FRONTEND_PORT=3000

# ChittyChain Configuration
CHITTYCHAIN_CLI_PATH=/Users/nickbianchi/MAIN/gh/ChittyChain/chittychain-cli.js
CHITTYCHAIN_MCP_SERVER=localhost:3100

# Game Configuration
XP_MULTIPLIER=1.0
ENABLE_ACHIEVEMENTS=true
ENABLE_DAILY_QUESTS=true
LEADERBOARD_SIZE=10

# Logging
LOG_LEVEL=info
LOG_FILE=logs/evidence-game.log

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo "✅ Environment configuration created"
fi

# Test game server startup
echo "🚀 Starting ChittyChain Evidence Game Server..."

# Kill any existing servers on the ports
if lsof -Pi :3101 -sTCP:LISTEN -t >/dev/null ; then
    echo "🔄 Killing existing server on port 3101..."
    kill -9 $(lsof -ti:3101) 2>/dev/null || true
    sleep 2
fi

# Start the game server
echo "🎮 Launching game server on port 3101..."
echo "📊 Real-time blockchain integration active"
echo "🏆 XP system and achievements enabled"
echo ""

if [ "$1" = "--background" ]; then
    # Start in background
    nohup node chittychain-game-server.js > logs/game-server.log 2>&1 &
    GAME_PID=$!
    echo "🎮 Game server started in background (PID: $GAME_PID)"
    echo "📄 Logs: logs/game-server.log"
    echo "🌐 Server: http://localhost:3101"
    
    # Wait a moment to check if server started successfully
    sleep 3
    if kill -0 $GAME_PID 2>/dev/null; then
        echo "✅ Game server is running successfully"
    else
        echo "❌ Game server failed to start - check logs/game-server.log"
        exit 1
    fi
else
    # Start in foreground
    echo "🎮 Starting game server (press Ctrl+C to stop)..."
    echo "🌐 Server will be available at: http://localhost:3101"
    echo "📡 WebSocket for real-time updates: ws://localhost:3101"
    echo ""
    echo "📋 API Endpoints:"
    echo "  GET  /api/player/:id - Get player profile"
    echo "  GET  /api/chain/status - Get blockchain status" 
    echo "  GET  /api/leaderboard - Get top players"
    echo "  GET  /api/quests/daily - Get daily quests"
    echo "  POST /api/evidence/mint - Mint evidence to blockchain"
    echo "  POST /api/evidence/verify - Verify evidence"
    echo "  POST /api/chain/audit - Audit blockchain"
    echo ""
    echo "🎯 Game Features:"
    echo "  🔗 Real ChittyChain blockchain integration"
    echo "  ⭐ XP rewards for all actions"
    echo "  🏆 Achievement system"
    echo "  📈 Daily quests"
    echo "  👑 Leaderboards"
    echo "  📊 Real-time updates"
    echo ""
    
    node chittychain-game-server.js
fi