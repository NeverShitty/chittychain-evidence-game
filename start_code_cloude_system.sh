#!/bin/bash

# Code-CloudE LLC Formation System Startup
# Production-ready system for FL, WY, IL + National
# Revenue-optimized for long-term viability

set -e

echo "🚀 Starting Code-CloudE LLC Formation System..."
echo "📍 States: Florida, Wyoming, Illinois + National"
echo "💰 Revenue-Optimized | Long-term Viability Focus"
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

# Check required environment variables
REQUIRED_VARS=(
    "NEON_DATABASE_URL"
    "OPENAI_API_KEY"
    "OPENAI_ASSISTANT_ID"
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
    echo "Create a .env file with these variables."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create necessary directories
mkdir -p generated_documents
mkdir -p logs
mkdir -p templates

# Initialize database schema if needed
echo "🗄️  Checking database schema..."
node -e "
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.NEON_DATABASE_URL);

(async () => {
    try {
        await sql\`
            CREATE SCHEMA IF NOT EXISTS llc_formation;
            
            CREATE TABLE IF NOT EXISTS llc_formation.workflows (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                workflow_id TEXT UNIQUE NOT NULL,
                business_name TEXT NOT NULL,
                state TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'created',
                workflow_data JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                completed_at TIMESTAMP WITH TIME ZONE
            );

            CREATE TABLE IF NOT EXISTS llc_formation.compliance_calendars (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                calendar_id TEXT UNIQUE NOT NULL,
                business_name TEXT NOT NULL,
                state TEXT NOT NULL,
                ein TEXT,
                calendar_data JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS llc_formation.revenue_tracking (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                business_name TEXT NOT NULL,
                service_type TEXT NOT NULL,
                revenue_amount DECIMAL(10,2) NOT NULL,
                service_date DATE NOT NULL,
                automated BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_workflows_workflow_id ON llc_formation.workflows(workflow_id);
            CREATE INDEX IF NOT EXISTS idx_workflows_status ON llc_formation.workflows(status);
            CREATE INDEX IF NOT EXISTS idx_compliance_calendar_id ON llc_formation.compliance_calendars(calendar_id);
            CREATE INDEX IF NOT EXISTS idx_revenue_tracking_date ON llc_formation.revenue_tracking(service_date);
        \`;
        console.log('✅ Database schema ready');
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    }
})();
"

# Test core systems
echo "🧪 Testing core systems..."

# Test document generation
node -e "
import { CodeCloudEDocumentEngine } from './core/code_cloude_document_engine.js';
(async () => {
    try {
        const engine = new CodeCloudEDocumentEngine();
        console.log('✅ Document engine initialized');
    } catch (error) {
        console.error('❌ Document engine test failed:', error.message);
        process.exit(1);
    }
})();
"

# Test workflow automation
node -e "
import { WorkflowAutomationEngine } from './core/workflow_automation_engine.js';
(async () => {
    try {
        const engine = new WorkflowAutomationEngine();
        console.log('✅ Workflow engine initialized');
    } catch (error) {
        console.error('❌ Workflow engine test failed:', error.message);
        process.exit(1);
    }
})();
"

# Test compliance engine
node -e "
import { ComplianceRevenueEngine } from './core/compliance_revenue_engine.js';
(async () => {
    try {
        const engine = new ComplianceRevenueEngine();
        console.log('✅ Compliance engine initialized');
    } catch (error) {
        console.error('❌ Compliance engine test failed:', error.message);
        process.exit(1);
    }
})();
"

echo ""
echo "🎯 System Status Check Complete"
echo "✅ Document Generation Engine: Ready"
echo "✅ Workflow Automation Engine: Ready"
echo "✅ Compliance Revenue Engine: Ready"
echo "✅ Database Schema: Ready"
echo ""

# Start the MCP server
echo "🚀 Starting Code-CloudE MCP Server..."
echo "📊 Available Tools: 18 production tools"
echo "💰 Revenue Features: Active"
echo "🔄 States Supported: FL, WY, IL + National"
echo ""

if [ "$NODE_ENV" = "production" ]; then
    # Production mode
    node core/code_cloude_mcp_server.js 2>&1 | tee logs/code_cloude_server.log
else
    # Development mode
    if command -v nodemon &> /dev/null; then
        nodemon core/code_cloude_mcp_server.js
    else
        node core/code_cloude_mcp_server.js
    fi
fi