/**
 * PRODUCTION MCP Server for LLC Formation
 * Real automation with external API integrations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { LLCFormationEngine } from './llc_formation_engine.js';
import { StateFilingAPIIntegration } from './state_filing_api_integration.js';
import { MemorySystemV5 } from '../shared/memory/memory_v5_bridge.js';
import { ChittyChainIntegration } from '../courthouse/chittychain/integration.js';

class LLCFormationMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'cloudesq-llc-formation-server',
                version: '1.0.0',
                description: 'Production LLC Formation Server with Real API Integrations'
            },
            {
                capabilities: {
                    tools: {},
                    resources: {}
                }
            }
        );

        this.formationEngine = new LLCFormationEngine();
        this.stateFilingAPI = new StateFilingAPIIntegration();
        this.memory = new MemorySystemV5({
            openai_assistant_id: process.env.OPENAI_ASSISTANT_ID,
            namespace: 'cloudesq_gc_llc_formation'
        });
        this.chittyChain = new ChittyChainIntegration();

        this.setupHandlers();
    }

    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'llc_formation_initialize',
                        description: 'Initialize a new LLC formation project with real state filing APIs',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                businessName: { type: 'string', description: 'The business name for the LLC' },
                                state: { type: 'string', description: 'State of incorporation (2-letter code)' },
                                purpose: { type: 'string', description: 'Business purpose' },
                                members: { 
                                    type: 'array', 
                                    items: { type: 'object' },
                                    description: 'LLC members information'
                                },
                                registeredAgent: { 
                                    type: 'object', 
                                    description: 'Registered agent information' 
                                },
                                organizer: { 
                                    type: 'object', 
                                    description: 'Organizer information' 
                                }
                            },
                            required: ['businessName', 'state', 'purpose']
                        }
                    },
                    {
                        name: 'llc_check_name_availability',
                        description: 'Check business name availability using real state APIs',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                businessName: { type: 'string', description: 'Business name to check' },
                                state: { type: 'string', description: 'State to check in (2-letter code)' }
                            },
                            required: ['businessName', 'state']
                        }
                    },
                    {
                        name: 'llc_reserve_name',
                        description: 'Reserve business name using real state filing APIs',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                businessName: { type: 'string', description: 'Business name to reserve' },
                                state: { type: 'string', description: 'State to reserve in (2-letter code)' },
                                duration: { type: 'number', description: 'Reservation duration in days (default: 120)' }
                            },
                            required: ['businessName', 'state']
                        }
                    },
                    {
                        name: 'llc_file_articles',
                        description: 'File Articles of Organization using real state APIs',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                formationId: { type: 'string', description: 'Formation project ID' },
                                expedited: { type: 'boolean', description: 'Expedited filing (additional fee)' },
                                certifiedCopies: { type: 'number', description: 'Number of certified copies' }
                            },
                            required: ['formationId']
                        }
                    },
                    {
                        name: 'llc_apply_for_ein',
                        description: 'Apply for EIN using real IRS APIs',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                formationId: { type: 'string', description: 'Formation project ID' },
                                taxClassification: { 
                                    type: 'string', 
                                    enum: ['disregarded_entity', 'partnership', 'corporation', 's_corporation'],
                                    description: 'Tax classification election'
                                },
                                businessActivity: { type: 'string', description: 'Primary business activity' },
                                responsibleParty: { 
                                    type: 'object', 
                                    description: 'Responsible party information' 
                                }
                            },
                            required: ['formationId', 'businessActivity', 'responsibleParty']
                        }
                    },
                    {
                        name: 'llc_get_formation_status',
                        description: 'Get comprehensive formation status and tracking',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                formationId: { type: 'string', description: 'Formation project ID' }
                            },
                            required: ['formationId']
                        }
                    },
                    {
                        name: 'llc_calculate_state_fees',
                        description: 'Calculate real state filing fees using APIs',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                state: { type: 'string', description: 'State (2-letter code)' },
                                services: { 
                                    type: 'array', 
                                    items: { type: 'string' },
                                    description: 'Additional services (expedited, certified_copies, etc.)'
                                }
                            },
                            required: ['state']
                        }
                    },
                    {
                        name: 'llc_track_filing_status',
                        description: 'Track filing status using real state APIs',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                filingId: { type: 'string', description: 'State filing ID' },
                                state: { type: 'string', description: 'State (2-letter code)' }
                            },
                            required: ['filingId', 'state']
                        }
                    },
                    {
                        name: 'llc_get_registered_agent_services',
                        description: 'Get available registered agent services for state',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                state: { type: 'string', description: 'State (2-letter code)' }
                            },
                            required: ['state']
                        }
                    },
                    {
                        name: 'llc_identify_business_licenses',
                        description: 'Identify required business licenses using real databases',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                businessType: { type: 'string', description: 'Type of business' },
                                state: { type: 'string', description: 'State (2-letter code)' },
                                city: { type: 'string', description: 'City' },
                                county: { type: 'string', description: 'County' }
                            },
                            required: ['businessType', 'state']
                        }
                    },
                    {
                        name: 'llc_generate_operating_agreement',
                        description: 'Generate operating agreement using contract system',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                formationId: { type: 'string', description: 'Formation project ID' },
                                managementStructure: { 
                                    type: 'string', 
                                    enum: ['member_managed', 'manager_managed'],
                                    description: 'Management structure'
                                },
                                distributionTerms: { type: 'string', description: 'Distribution terms' },
                                votingRights: { type: 'string', description: 'Voting rights structure' }
                            },
                            required: ['formationId']
                        }
                    },
                    {
                        name: 'llc_file_annual_report',
                        description: 'File annual report using real state APIs',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                companyId: { type: 'string', description: 'Company ID' },
                                state: { type: 'string', description: 'State (2-letter code)' },
                                businessName: { type: 'string', description: 'Business name' },
                                registeredAgent: { type: 'object', description: 'Registered agent info' }
                            },
                            required: ['companyId', 'state', 'businessName']
                        }
                    },
                    {
                        name: 'llc_setup_compliance_calendar',
                        description: 'Set up automated compliance calendar',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                formationId: { type: 'string', description: 'Formation project ID' },
                                formationDate: { type: 'string', description: 'Formation date' }
                            },
                            required: ['formationId', 'formationDate']
                        }
                    },
                    {
                        name: 'llc_process_state_filing_payment',
                        description: 'Process payment for state filing fees',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                state: { type: 'string', description: 'State (2-letter code)' },
                                amount: { type: 'number', description: 'Payment amount' },
                                paymentMethod: { type: 'string', description: 'Payment method' },
                                filingId: { type: 'string', description: 'Filing ID' },
                                paymentData: { type: 'object', description: 'Payment details' }
                            },
                            required: ['state', 'amount', 'paymentMethod', 'filingId']
                        }
                    },
                    {
                        name: 'llc_verify_ein',
                        description: 'Verify EIN using real IRS APIs',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                ein: { type: 'string', description: 'EIN to verify' }
                            },
                            required: ['ein']
                        }
                    },
                    {
                        name: 'llc_create_tax_calendar',
                        description: 'Create tax calendar using real IRS APIs',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                formationId: { type: 'string', description: 'Formation project ID' },
                                taxClassification: { type: 'string', description: 'Tax classification' },
                                hasEmployees: { type: 'boolean', description: 'Has employees' },
                                sCorpElection: { type: 'boolean', description: 'S-Corp election made' }
                            },
                            required: ['formationId', 'taxClassification']
                        }
                    }
                ]
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'llc_formation_initialize':
                        return await this.handleFormationInitialize(args);
                    
                    case 'llc_check_name_availability':
                        return await this.handleCheckNameAvailability(args);
                    
                    case 'llc_reserve_name':
                        return await this.handleReserveName(args);
                    
                    case 'llc_file_articles':
                        return await this.handleFileArticles(args);
                    
                    case 'llc_apply_for_ein':
                        return await this.handleApplyForEIN(args);
                    
                    case 'llc_get_formation_status':
                        return await this.handleGetFormationStatus(args);
                    
                    case 'llc_calculate_state_fees':
                        return await this.handleCalculateStateFees(args);
                    
                    case 'llc_track_filing_status':
                        return await this.handleTrackFilingStatus(args);
                    
                    case 'llc_get_registered_agent_services':
                        return await this.handleGetRegisteredAgentServices(args);
                    
                    case 'llc_identify_business_licenses':
                        return await this.handleIdentifyBusinessLicenses(args);
                    
                    case 'llc_generate_operating_agreement':
                        return await this.handleGenerateOperatingAgreement(args);
                    
                    case 'llc_file_annual_report':
                        return await this.handleFileAnnualReport(args);
                    
                    case 'llc_setup_compliance_calendar':
                        return await this.handleSetupComplianceCalendar(args);
                    
                    case 'llc_process_state_filing_payment':
                        return await this.handleProcessStateFilingPayment(args);
                    
                    case 'llc_verify_ein':
                        return await this.handleVerifyEIN(args);
                    
                    case 'llc_create_tax_calendar':
                        return await this.handleCreateTaxCalendar(args);
                    
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Error executing ${name}: ${error.message}`
                    }],
                    isError: true
                };
            }
        });
    }

    async handleFormationInitialize(args) {
        const result = await this.formationEngine.initializeLLCFormation(args);
        
        if (result.success) {
            // Store in memory for tracking
            await this.memory.storeMemory({
                content: `LLC formation initialized for ${args.businessName}`,
                context: 'LLC Formation',
                metadata: {
                    formation_id: result.formationId,
                    business_name: args.businessName,
                    state: args.state,
                    status: 'initialized'
                },
                tags: ['llc_formation', 'initialized', args.state.toLowerCase()]
            });

            // Store on ChittyChain for immutable record
            await this.chittyChain.mintEvidence({
                evidenceType: 'llc_formation_initialization',
                caseId: result.formationId,
                data: {
                    businessName: args.businessName,
                    state: args.state,
                    initializationDate: new Date().toISOString()
                },
                level: 'business'
            });
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleCheckNameAvailability(args) {
        const result = await this.stateFilingAPI.checkBusinessNameAvailability(args.businessName, args.state);
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleReserveName(args) {
        const result = await this.stateFilingAPI.reserveBusinessName(
            args.businessName, 
            args.state, 
            args.duration || 120
        );
        
        if (result.success) {
            await this.memory.storeMemory({
                content: `Business name ${args.businessName} reserved in ${args.state}`,
                context: 'Name Reservation',
                metadata: {
                    business_name: args.businessName,
                    state: args.state,
                    reservation_id: result.reservationId,
                    expiration_date: result.expirationDate
                },
                tags: ['name_reservation', args.state.toLowerCase()]
            });
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleFileArticles(args) {
        // Get formation data from memory
        const formationMemory = await this.memory.searchMemories(`formation_id:${args.formationId}`, {
            tags: ['llc_formation'],
            limit: 1
        });

        if (!formationMemory.length) {
            throw new Error('Formation project not found');
        }

        const formationData = formationMemory[0].metadata;
        
        // Add filing options
        formationData.expedited = args.expedited || false;
        formationData.certifiedCopies = args.certifiedCopies || 1;

        const result = await this.stateFilingAPI.fileArticlesOfOrganization(formationData);
        
        if (result.success) {
            await this.memory.storeMemory({
                content: `Articles of Organization filed for ${formationData.business_name}`,
                context: 'Articles Filing',
                metadata: {
                    formation_id: args.formationId,
                    filing_id: result.filingId,
                    filing_number: result.filingNumber,
                    status: result.status
                },
                tags: ['articles_filing', formationData.state.toLowerCase()]
            });

            // Store on ChittyChain
            await this.chittyChain.mintEvidence({
                evidenceType: 'articles_of_organization_filing',
                caseId: args.formationId,
                data: {
                    filingId: result.filingId,
                    filingNumber: result.filingNumber,
                    filingDate: result.filingDate
                },
                level: 'legal'
            });
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleApplyForEIN(args) {
        // Get formation data from memory
        const formationMemory = await this.memory.searchMemories(`formation_id:${args.formationId}`, {
            tags: ['llc_formation'],
            limit: 1
        });

        if (!formationMemory.length) {
            throw new Error('Formation project not found');
        }

        const formationData = formationMemory[0].metadata;
        
        const einData = {
            legalName: formationData.business_name,
            entityType: 'LLC',
            stateOfOrganization: formationData.state,
            businessActivity: args.businessActivity,
            responsibleParty: args.responsibleParty,
            taxClassification: args.taxClassification || 'disregarded_entity',
            businessAddress: formationData.business_address,
            reasonForApplying: 'Started new business'
        };

        const result = await this.stateFilingAPI.irsAPI.applyForEIN(einData);
        
        if (result.success) {
            await this.memory.storeMemory({
                content: `EIN ${result.ein} obtained for ${formationData.business_name}`,
                context: 'EIN Application',
                metadata: {
                    formation_id: args.formationId,
                    ein: result.ein,
                    confirmation_number: result.confirmationNumber,
                    issue_date: result.issueDate
                },
                tags: ['ein_application', 'federal_tax']
            });

            // Store on ChittyChain
            await this.chittyChain.mintEvidence({
                evidenceType: 'ein_application',
                caseId: args.formationId,
                data: {
                    ein: result.ein,
                    confirmationNumber: result.confirmationNumber,
                    issueDate: result.issueDate
                },
                level: 'legal'
            });
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleGetFormationStatus(args) {
        const result = await this.formationEngine.getFormationStatus(args.formationId);
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleCalculateStateFees(args) {
        const result = await this.stateFilingAPI.calculateStateFees(args.state, args.services || []);
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleTrackFilingStatus(args) {
        const result = await this.stateFilingAPI.trackFilingStatus(args.filingId, args.state);
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleGetRegisteredAgentServices(args) {
        const result = await this.stateFilingAPI.getRegisteredAgentServices(args.state);
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleIdentifyBusinessLicenses(args) {
        const result = await this.stateFilingAPI.identifyBusinessLicenses(
            args.businessType,
            args.state,
            args.city,
            args.county
        );
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleGenerateOperatingAgreement(args) {
        const result = await this.formationEngine.executeWorkflowStep(
            args.formationId,
            'operating_agreement',
            {
                managementStructure: args.managementStructure || 'member_managed',
                distributionTerms: args.distributionTerms,
                votingRights: args.votingRights
            }
        );
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleFileAnnualReport(args) {
        const result = await this.stateFilingAPI.stateAPIs[args.state]?.fileAnnualReport(args) ||
                       await this.stateFilingAPI.filingServices.websiteCorp.fileAnnualReport(args);
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleSetupComplianceCalendar(args) {
        const result = await this.formationEngine.executeWorkflowStep(
            args.formationId,
            'compliance_setup',
            {
                formationDate: args.formationDate
            }
        );
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleProcessStateFilingPayment(args) {
        const result = await this.stateFilingAPI.processStateFilingPayment(args);
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleVerifyEIN(args) {
        const result = await this.stateFilingAPI.irsAPI.verifyEIN(args.ein);
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async handleCreateTaxCalendar(args) {
        // Get formation data from memory
        const formationMemory = await this.memory.searchMemories(`formation_id:${args.formationId}`, {
            tags: ['llc_formation'],
            limit: 1
        });

        if (!formationMemory.length) {
            throw new Error('Formation project not found');
        }

        const formationData = formationMemory[0].metadata;
        
        const taxCalendarData = {
            entityType: 'LLC',
            taxClassification: args.taxClassification,
            stateOfOrganization: formationData.state,
            hasEmployees: args.hasEmployees || false,
            sCorpElection: args.sCorpElection || false
        };

        const result = await this.stateFilingAPI.irsAPI.createTaxCalendar(taxCalendarData);
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('CloudEsq LLC Formation MCP Server running on stdio');
    }
}

// Start the server
const server = new LLCFormationMCPServer();
server.run().catch(console.error);

export default LLCFormationMCPServer;