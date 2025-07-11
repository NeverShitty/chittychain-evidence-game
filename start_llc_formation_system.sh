#!/bin/bash

# PRODUCTION LLC Formation System Startup Script
# Launches the complete LLC formation system with real API integrations

set -e

echo "🏢 Starting CloudEsq LLC Formation System..."

# Set working directory
cd "$(dirname "$0")"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Check required environment variables
REQUIRED_VARS=(
    "NEON_DATABASE_URL"
    "OPENAI_API_KEY"
    "INCFILE_API_KEY"
    "DELAWARE_API_KEY"
    "IRS_API_KEY"
    "WEBSITE_CORP_API_KEY"
)

missing_vars=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo ""
    echo "Please set these environment variables in your .env file or export them."
    exit 1
fi

# Run system setup if not already done
if [ ! -f "setup_complete.flag" ]; then
    echo "🔧 Running first-time setup..."
    node setup_llc_formation_system.js
    if [ $? -eq 0 ]; then
        touch setup_complete.flag
        echo "✅ Setup complete"
    else
        echo "❌ Setup failed"
        exit 1
    fi
fi

# Validate external APIs
echo "🔗 Validating external API connections..."
node validate_external_apis.js
if [ $? -ne 0 ]; then
    echo "⚠️  Some external APIs are not available. System will continue with reduced functionality."
fi

# Start the MCP server
echo "🚀 Starting LLC Formation MCP Server..."
echo "📊 Server will be available on stdio transport"
echo "🔄 Use Ctrl+C to stop the server"
echo ""

# Start with monitoring
if [ "$NODE_ENV" = "production" ]; then
    # Production mode with process monitoring
    node mcp_llc_formation_server.js 2>&1 | tee logs/llc_formation_server.log
else
    # Development mode with auto-reload
    if command -v nodemon &> /dev/null; then
        nodemon mcp_llc_formation_server.js
    else
        node mcp_llc_formation_server.js
    fi
fi