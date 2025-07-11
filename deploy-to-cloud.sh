#!/bin/bash

# Deploy ChittyChain Evidence Game to Cloud Server
# Production deployment with real URLs and SSL

set -e

echo "🌐 Deploying ChittyChain Evidence Game to Cloud Server"
echo "🚀 Production-ready deployment with real blockchain integration"
echo ""

# Configuration
DOMAIN=${DOMAIN:-"evidence.chitty.cc"}
PORT=${PORT:-3101}
ENVIRONMENT=${ENVIRONMENT:-"production"}

echo "📍 Target Domain: https://$DOMAIN"
echo "🔧 Environment: $ENVIRONMENT"
echo ""

# Check deployment target
echo "🎯 Select deployment target:"
echo "1) Railway (recommended - $12/month)"
echo "2) Cloudflare Workers ($5/month)"
echo "3) DigitalOcean App Platform ($12/month)"
echo "4) Vercel + Railway combo ($10/month)"
echo "5) Custom VPS"
echo ""

read -p "Choose deployment (1-5): " DEPLOY_TARGET

case $DEPLOY_TARGET in
    1)
        echo "🚂 Deploying to Railway..."
        ./deploy-railway.sh
        ;;
    2)
        echo "☁️ Deploying to Cloudflare Workers..."
        ./deploy-cloudflare.sh
        ;;
    3)
        echo "🌊 Deploying to DigitalOcean..."
        ./deploy-digitalocean.sh
        ;;
    4)
        echo "▲ Deploying to Vercel + Railway..."
        ./deploy-vercel-railway.sh
        ;;
    5)
        echo "🖥️ Custom VPS deployment..."
        ./deploy-vps.sh
        ;;
    *)
        echo "❌ Invalid selection"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Evidence Game URL: https://$DOMAIN"
echo "📡 WebSocket: wss://$DOMAIN"
echo "🎮 Ready for global evidence gaming!"