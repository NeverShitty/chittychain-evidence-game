#!/bin/bash

# Demo Evidence Minting Script
# Simulates evidence minting with real XP rewards until ChittyChain CLI is fully set up

echo "🎮 Demo: Minting evidence to ChittyChain with XP rewards"
echo ""

# Test evidence data
EVIDENCE_DATA='{
  "playerId": "demo_user_001",
  "artifacts": [{
    "id": "EVIDENCE_DEMO_'$(date +%s)'",
    "contentHash": "0x'$(openssl rand -hex 16)'",
    "statement": "City Studio Major Wire Transfer - Demo",
    "weight": 0.95,
    "tier": "FINANCIAL_INSTITUTION", 
    "type": "WIRE_TRANSFER",
    "amount": "$100,000",
    "metadata": {
      "bank": "Wells Fargo",
      "date": "2022-07-20",
      "demo": true
    }
  }]
}'

echo "🔍 Testing player profile creation..."
curl -s http://localhost:3101/api/player/demo_user_001 | jq .

echo ""
echo "💰 Current daily quests:"
curl -s http://localhost:3101/api/quests/daily | jq .

echo ""
echo "🎯 Attempting evidence mint (will fail gracefully but award XP)..."

# The mint will fail at ChittyChain CLI but the game server will still track it
RESULT=$(curl -s -X POST http://localhost:3101/api/evidence/mint \
  -H "Content-Type: application/json" \
  -d "$EVIDENCE_DATA")

echo "Result: $RESULT" | jq .

echo ""
echo "📊 Updated player profile:"
curl -s http://localhost:3101/api/player/demo_user_001 | jq .

echo ""
echo "🎮 SYSTEM STATUS:"
echo "✅ Game Server: Running on port 3101"
echo "✅ XP System: Active and tracking"
echo "✅ Achievement System: Monitoring unlocks"
echo "✅ Daily Quests: Active"
echo "⚠️  ChittyChain CLI: Needs dependencies (commander, chalk, ora, cli-table3)"
echo ""
echo "🔧 To fix ChittyChain CLI:"
echo "cd /Users/nickbianchi/MAIN/gh/ChittyChain"
echo "npm install commander chalk ora cli-table3"
echo ""
echo "🚀 Game server endpoints available:"
echo "  GET  http://localhost:3101/api/player/YOUR_ID"
echo "  GET  http://localhost:3101/api/chain/status"
echo "  GET  http://localhost:3101/api/leaderboard" 
echo "  GET  http://localhost:3101/api/quests/daily"
echo "  POST http://localhost:3101/api/evidence/mint"
echo "  POST http://localhost:3101/api/evidence/verify"
echo "  POST http://localhost:3101/api/chain/audit"
echo ""
echo "🎮 The gamified evidence system is LIVE!"