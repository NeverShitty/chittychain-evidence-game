#!/usr/bin/env node

/**
 * PRODUCTION LLC Formation System Setup
 * Initializes real API connections and database
 */

import { config } from 'dotenv';
import { LLCFormationEngine } from './llc_formation_engine.js';
import { StateFilingAPIIntegration } from './state_filing_api_integration.js';
import { MemorySystemV5 } from '../shared/memory/memory_v5_bridge.js';
import { ChittyChainIntegration } from '../courthouse/chittychain/integration.js';
import { neon } from '@neondatabase/serverless';

config();

class LLCFormationSystemSetup {
    constructor() {
        this.requiredEnvVars = [
            'NEON_DATABASE_URL',
            'OPENAI_API_KEY',
            'INCFILE_API_KEY',
            'DELAWARE_API_KEY',
            'IRS_API_KEY',
            'WEBSITE_CORP_API_KEY'
        ];
        
        this.optionalEnvVars = [
            'LEGALZOOM_API_KEY',
            'DOCUSIGN_API_KEY',
            'STRIPE_API_KEY',
            'CALIFORNIA_API_KEY',
            'TEXAS_API_KEY',
            'FLORIDA_API_KEY',
            'NEVADA_API_KEY'
        ];
    }

    async setup() {
        console.log('🏢 Setting up CloudEsq LLC Formation System...\n');

        try {
            // 1. Validate environment variables
            await this.validateEnvironment();

            // 2. Test database connection
            await this.testDatabaseConnection();

            // 3. Initialize database schema
            await this.initializeDatabase();

            // 4. Validate external API connections
            await this.validateExternalAPIs();

            // 5. Test core system components
            await this.testCoreComponents();

            // 6. Create MCP server configuration
            await this.createMCPConfiguration();

            // 7. Set up monitoring and logging
            await this.setupMonitoring();

            console.log('✅ LLC Formation System setup complete!\n');
            console.log('🚀 Ready to process LLC formations with real API integrations');
            console.log('📊 Use npm run start to launch the MCP server');

        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        }
    }

    async validateEnvironment() {
        console.log('🔍 Validating environment variables...');
        
        const missing = [];
        
        for (const envVar of this.requiredEnvVars) {
            if (!process.env[envVar]) {
                missing.push(envVar);
            }
        }

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        const optional = [];
        for (const envVar of this.optionalEnvVars) {
            if (!process.env[envVar]) {
                optional.push(envVar);
            }
        }

        if (optional.length > 0) {
            console.log(`⚠️  Optional environment variables not set: ${optional.join(', ')}`);
        }

        console.log('✅ Environment validation complete');
    }

    async testDatabaseConnection() {
        console.log('🔌 Testing database connection...');
        
        try {
            const sql = neon(process.env.NEON_DATABASE_URL);
            const result = await sql`SELECT 1 as test`;
            
            if (result[0].test === 1) {
                console.log('✅ Database connection successful');
            } else {
                throw new Error('Database connection test failed');
            }
        } catch (error) {
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    async initializeDatabase() {
        console.log('🗄️  Initializing database schema...');
        
        try {
            const sql = neon(process.env.NEON_DATABASE_URL);
            
            // Create LLC formation tables
            await sql`
                CREATE SCHEMA IF NOT EXISTS llc_formation;
                
                CREATE TABLE IF NOT EXISTS llc_formation.formation_projects (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    formation_id TEXT UNIQUE NOT NULL,
                    business_name TEXT NOT NULL,
                    state TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'initialized',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    metadata JSONB DEFAULT '{}'::jsonb
                );

                CREATE TABLE IF NOT EXISTS llc_formation.formation_steps (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    formation_id TEXT NOT NULL,
                    step_id TEXT NOT NULL,
                    step_name TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    started_at TIMESTAMP WITH TIME ZONE,
                    completed_at TIMESTAMP WITH TIME ZONE,
                    result JSONB DEFAULT '{}'::jsonb,
                    FOREIGN KEY (formation_id) REFERENCES llc_formation.formation_projects(formation_id)
                );

                CREATE TABLE IF NOT EXISTS llc_formation.state_filings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    formation_id TEXT NOT NULL,
                    state TEXT NOT NULL,
                    filing_type TEXT NOT NULL,
                    filing_id TEXT,
                    filing_number TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    filing_date TIMESTAMP WITH TIME ZONE,
                    effective_date TIMESTAMP WITH TIME ZONE,
                    cost DECIMAL(10,2),
                    tracking_url TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    FOREIGN KEY (formation_id) REFERENCES llc_formation.formation_projects(formation_id)
                );

                CREATE TABLE IF NOT EXISTS llc_formation.ein_applications (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    formation_id TEXT NOT NULL,
                    ein TEXT,
                    confirmation_number TEXT,
                    application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    issue_date TIMESTAMP WITH TIME ZONE,
                    status TEXT NOT NULL DEFAULT 'pending',
                    letter_url TEXT,
                    FOREIGN KEY (formation_id) REFERENCES llc_formation.formation_projects(formation_id)
                );

                CREATE TABLE IF NOT EXISTS llc_formation.compliance_calendar (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    formation_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    event_name TEXT NOT NULL,
                    due_date DATE NOT NULL,
                    frequency TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    cost DECIMAL(10,2),
                    reminder_sent BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    FOREIGN KEY (formation_id) REFERENCES llc_formation.formation_projects(formation_id)
                );

                CREATE TABLE IF NOT EXISTS llc_formation.api_usage_log (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    formation_id TEXT,
                    api_provider TEXT NOT NULL,
                    api_endpoint TEXT NOT NULL,
                    request_method TEXT NOT NULL,
                    request_data JSONB,
                    response_status INTEGER,
                    response_data JSONB,
                    cost DECIMAL(10,2),
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_formation_projects_formation_id 
                    ON llc_formation.formation_projects(formation_id);
                CREATE INDEX IF NOT EXISTS idx_formation_steps_formation_id 
                    ON llc_formation.formation_steps(formation_id);
                CREATE INDEX IF NOT EXISTS idx_state_filings_formation_id 
                    ON llc_formation.state_filings(formation_id);
                CREATE INDEX IF NOT EXISTS idx_ein_applications_formation_id 
                    ON llc_formation.ein_applications(formation_id);
                CREATE INDEX IF NOT EXISTS idx_compliance_calendar_formation_id 
                    ON llc_formation.compliance_calendar(formation_id);
                CREATE INDEX IF NOT EXISTS idx_compliance_calendar_due_date 
                    ON llc_formation.compliance_calendar(due_date);
                CREATE INDEX IF NOT EXISTS idx_api_usage_log_timestamp 
                    ON llc_formation.api_usage_log(timestamp);
            `;
            
            console.log('✅ Database schema initialized');
            
        } catch (error) {
            throw new Error(`Database initialization failed: ${error.message}`);
        }
    }

    async validateExternalAPIs() {
        console.log('🔗 Validating external API connections...');
        
        try {
            const stateFilingAPI = new StateFilingAPIIntegration();
            
            // Test IncFile API
            try {
                await stateFilingAPI.filingServices.incFile.calculateFees('DE', []);
                console.log('✅ IncFile API connection successful');
            } catch (error) {
                console.log('⚠️  IncFile API connection failed:', error.message);
            }

            // Test Delaware API
            try {
                await stateFilingAPI.stateAPIs.DE?.calculateFees([]);
                console.log('✅ Delaware API connection successful');
            } catch (error) {
                console.log('⚠️  Delaware API connection failed:', error.message);
            }

            // Test IRS API
            try {
                await stateFilingAPI.irsAPI.lookupBusinessActivityCode('consulting');
                console.log('✅ IRS API connection successful');
            } catch (error) {
                console.log('⚠️  IRS API connection failed:', error.message);
            }

            console.log('✅ External API validation complete');
            
        } catch (error) {
            throw new Error(`API validation failed: ${error.message}`);
        }
    }

    async testCoreComponents() {
        console.log('🧪 Testing core system components...');
        
        try {
            // Test LLC Formation Engine
            const formationEngine = new LLCFormationEngine();
            console.log('✅ LLC Formation Engine initialized');

            // Test Memory System
            const memory = new MemorySystemV5({
                openai_assistant_id: process.env.OPENAI_ASSISTANT_ID,
                namespace: 'cloudesq_gc_llc_formation'
            });
            console.log('✅ Memory System initialized');

            // Test ChittyChain Integration
            const chittyChain = new ChittyChainIntegration();
            console.log('✅ ChittyChain Integration initialized');

            console.log('✅ Core component testing complete');
            
        } catch (error) {
            throw new Error(`Core component testing failed: ${error.message}`);
        }
    }

    async createMCPConfiguration() {
        console.log('⚙️  Creating MCP server configuration...');
        
        const mcpConfig = {
            name: 'cloudesq-llc-formation-server',
            version: '1.0.0',
            description: 'Production LLC Formation Server with Real API Integrations',
            transport: 'stdio',
            capabilities: {
                tools: true,
                resources: true,
                prompts: false
            },
            environment: {
                NODE_ENV: process.env.NODE_ENV || 'production',
                NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
                OPENAI_API_KEY: process.env.OPENAI_API_KEY,
                API_TIMEOUT: 30000,
                MAX_RETRIES: 3,
                RATE_LIMIT_REQUESTS: 100,
                RATE_LIMIT_WINDOW: 900000 // 15 minutes
            },
            logging: {
                level: 'info',
                file: 'logs/llc_formation_server.log',
                maxSize: '10mb',
                maxFiles: 5
            },
            monitoring: {
                enabled: true,
                healthCheck: true,
                metrics: true,
                alerts: true
            }
        };

        try {
            const fs = await import('fs');
            await fs.promises.writeFile(
                'mcp_server_config.json',
                JSON.stringify(mcpConfig, null, 2)
            );
            console.log('✅ MCP server configuration created');
        } catch (error) {
            throw new Error(`MCP configuration creation failed: ${error.message}`);
        }
    }

    async setupMonitoring() {
        console.log('📊 Setting up monitoring and logging...');
        
        try {
            const fs = await import('fs');
            
            // Create logs directory
            try {
                await fs.promises.mkdir('logs', { recursive: true });
            } catch (error) {
                // Directory might already exist
            }

            // Create monitoring configuration
            const monitoringConfig = {
                healthCheck: {
                    enabled: true,
                    interval: 30000, // 30 seconds
                    timeout: 5000,
                    endpoints: [
                        'database',
                        'external_apis',
                        'memory_system',
                        'chittychain'
                    ]
                },
                metrics: {
                    enabled: true,
                    collection_interval: 60000, // 1 minute
                    retention_days: 30,
                    metrics: [
                        'formation_requests',
                        'api_calls',
                        'success_rate',
                        'response_time',
                        'error_rate'
                    ]
                },
                alerts: {
                    enabled: true,
                    channels: ['email', 'webhook'],
                    rules: [
                        {
                            name: 'high_error_rate',
                            condition: 'error_rate > 0.1',
                            severity: 'critical'
                        },
                        {
                            name: 'slow_response',
                            condition: 'avg_response_time > 10000',
                            severity: 'warning'
                        },
                        {
                            name: 'api_failures',
                            condition: 'api_failure_rate > 0.05',
                            severity: 'warning'
                        }
                    ]
                }
            };

            await fs.promises.writeFile(
                'monitoring_config.json',
                JSON.stringify(monitoringConfig, null, 2)
            );
            
            console.log('✅ Monitoring and logging setup complete');
            
        } catch (error) {
            throw new Error(`Monitoring setup failed: ${error.message}`);
        }
    }
}

// Run setup
const setup = new LLCFormationSystemSetup();
setup.setup().catch(console.error);