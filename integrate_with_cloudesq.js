#!/usr/bin/env node

/**
 * CloudEsq Integration Script
 * Integrates the LLC Formation System with existing CloudEsq infrastructure
 */

import { config } from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

config();

class CloudEsqIntegration {
    constructor() {
        this.gcPath = '/Users/nickbianchi/MAIN/ai/exec/gc';
        this.businessFormationPath = join(this.gcPath, 'sys/business_formation');
        this.mcpConfigPath = join(this.gcPath, 'mcp-config.json');
        this.startupScriptPath = join(this.gcPath, 'launch-gc-mcp.sh');
    }

    async integrate() {
        console.log('🔗 Integrating LLC Formation System with CloudEsq...\n');

        try {
            // 1. Update MCP configuration
            await this.updateMCPConfiguration();

            // 2. Update startup scripts
            await this.updateStartupScripts();

            // 3. Create environment configuration
            await this.createEnvironmentConfig();

            // 4. Update Claude configuration
            await this.updateClaudeConfiguration();

            // 5. Create quick start commands
            await this.createQuickStartCommands();

            console.log('✅ LLC Formation System successfully integrated with CloudEsq!');
            console.log('\n🚀 You can now use the following commands:');
            console.log('   llc_formation_initialize - Start new LLC formation');
            console.log('   llc_check_name_availability - Check business name availability');
            console.log('   llc_file_articles - File Articles of Organization');
            console.log('   llc_apply_for_ein - Apply for EIN');
            console.log('   llc_get_formation_status - Check formation status');
            console.log('\n📖 See the complete list of 16 LLC formation tools in the MCP server.');

        } catch (error) {
            console.error('❌ Integration failed:', error.message);
            process.exit(1);
        }
    }

    async updateMCPConfiguration() {
        console.log('⚙️  Updating MCP configuration...');

        try {
            let mcpConfig = {};
            
            // Load existing MCP configuration
            if (existsSync(this.mcpConfigPath)) {
                mcpConfig = JSON.parse(readFileSync(this.mcpConfigPath, 'utf8'));
            }

            // Add LLC Formation server configuration
            if (!mcpConfig.mcpServers) {
                mcpConfig.mcpServers = {};
            }

            mcpConfig.mcpServers['llc-formation'] = {
                command: 'node',
                args: ['sys/business_formation/mcp_llc_formation_server.js'],
                env: {
                    NODE_ENV: process.env.NODE_ENV || 'production',
                    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
                    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
                    INCFILE_API_KEY: process.env.INCFILE_API_KEY,
                    DELAWARE_API_KEY: process.env.DELAWARE_API_KEY,
                    IRS_API_KEY: process.env.IRS_API_KEY,
                    WEBSITE_CORP_API_KEY: process.env.WEBSITE_CORP_API_KEY
                }
            };

            // Save updated configuration
            writeFileSync(this.mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
            console.log('✅ MCP configuration updated');

        } catch (error) {
            throw new Error(`MCP configuration update failed: ${error.message}`);
        }
    }

    async updateStartupScripts() {
        console.log('🚀 Updating startup scripts...');

        try {
            // Read existing startup script
            let startupScript = '';
            if (existsSync(this.startupScriptPath)) {
                startupScript = readFileSync(this.startupScriptPath, 'utf8');
            }

            // Add LLC Formation system startup
            const llcFormationStartup = `
# Start LLC Formation System
echo "🏢 Starting LLC Formation System..."
cd sys/business_formation
if [ -f start_llc_formation_system.sh ]; then
    ./start_llc_formation_system.sh &
    LLC_FORMATION_PID=$!
    echo "✅ LLC Formation System started (PID: $LLC_FORMATION_PID)"
else
    echo "⚠️  LLC Formation System startup script not found"
fi
cd ../..
`;

            // Add to startup script if not already present
            if (!startupScript.includes('LLC Formation System')) {
                startupScript += llcFormationStartup;
                writeFileSync(this.startupScriptPath, startupScript);
                console.log('✅ Startup script updated');
            } else {
                console.log('✅ Startup script already includes LLC Formation System');
            }

        } catch (error) {
            throw new Error(`Startup script update failed: ${error.message}`);
        }
    }

    async createEnvironmentConfig() {
        console.log('🌍 Creating environment configuration...');

        try {
            const envTemplate = `# LLC Formation System Environment Variables
# Required for production use

# Database
NEON_DATABASE_URL=your_neon_database_url_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=asst_tkBVT2u44lFI2Sx8i4oxDUvk

# External APIs (Required)
INCFILE_API_KEY=your_incfile_api_key_here
DELAWARE_API_KEY=your_delaware_api_key_here
IRS_API_KEY=your_irs_api_key_here
WEBSITE_CORP_API_KEY=your_website_corp_api_key_here

# External APIs (Optional)
LEGALZOOM_API_KEY=your_legalzoom_api_key_here
DOCUSIGN_API_KEY=your_docusign_api_key_here
STRIPE_API_KEY=your_stripe_api_key_here
CALIFORNIA_API_KEY=your_california_api_key_here
TEXAS_API_KEY=your_texas_api_key_here
FLORIDA_API_KEY=your_florida_api_key_here
NEVADA_API_KEY=your_nevada_api_key_here

# System Configuration
NODE_ENV=production
API_TIMEOUT=30000
MAX_RETRIES=3
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000
`;

            const envPath = join(this.businessFormationPath, '.env.template');
            writeFileSync(envPath, envTemplate);
            console.log('✅ Environment configuration template created');

        } catch (error) {
            throw new Error(`Environment configuration creation failed: ${error.message}`);
        }
    }

    async updateClaudeConfiguration() {
        console.log('🤖 Updating Claude configuration...');

        try {
            const claudeConfigPath = join(this.gcPath, 'claude-config.json');
            let claudeConfig = {};

            // Load existing Claude configuration
            if (existsSync(claudeConfigPath)) {
                claudeConfig = JSON.parse(readFileSync(claudeConfigPath, 'utf8'));
            }

            // Add LLC Formation MCP server
            if (!claudeConfig.mcpServers) {
                claudeConfig.mcpServers = {};
            }

            claudeConfig.mcpServers['llc-formation'] = {
                command: 'node',
                args: ['sys/business_formation/mcp_llc_formation_server.js'],
                env: {
                    NODE_ENV: 'production'
                }
            };

            // Save updated configuration
            writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2));
            console.log('✅ Claude configuration updated');

        } catch (error) {
            throw new Error(`Claude configuration update failed: ${error.message}`);
        }
    }

    async createQuickStartCommands() {
        console.log('⚡ Creating quick start commands...');

        try {
            const quickStartScript = `#!/bin/bash

# CloudEsq LLC Formation Quick Start Commands
# Usage: ./llc_quick_start.sh [command] [options]

case "$1" in
    "start")
        echo "🚀 Starting LLC Formation System..."
        cd sys/business_formation
        ./start_llc_formation_system.sh
        ;;
    "test")
        echo "🧪 Running LLC Formation System tests..."
        cd sys/business_formation
        node test_llc_formation_system.js
        ;;
    "setup")
        echo "🔧 Setting up LLC Formation System..."
        cd sys/business_formation
        node setup_llc_formation_system.js
        ;;
    "status")
        echo "📊 Checking LLC Formation System status..."
        ps aux | grep -E "(mcp_llc_formation|llc_formation)" | grep -v grep
        ;;
    "stop")
        echo "🛑 Stopping LLC Formation System..."
        pkill -f "mcp_llc_formation_server.js"
        ;;
    "help")
        echo "Available commands:"
        echo "  start  - Start the LLC Formation System"
        echo "  test   - Run system tests"
        echo "  setup  - Run initial setup"
        echo "  status - Check system status"
        echo "  stop   - Stop the system"
        echo "  help   - Show this help message"
        ;;
    *)
        echo "Usage: $0 {start|test|setup|status|stop|help}"
        exit 1
        ;;
esac
`;

            const quickStartPath = join(this.gcPath, 'llc_quick_start.sh');
            writeFileSync(quickStartPath, quickStartScript);
            
            // Make executable
            const { exec } = await import('child_process');
            exec(`chmod +x ${quickStartPath}`);
            
            console.log('✅ Quick start commands created');

        } catch (error) {
            throw new Error(`Quick start commands creation failed: ${error.message}`);
        }
    }
}

// Run integration
const integration = new CloudEsqIntegration();
integration.integrate().catch(console.error);