/**
 * LLC Formation Engine for CloudEsq
 * Handles complete LLC formation workflow with state filing integration
 */

import { MemorySystemV5 } from '../shared/memory/memory_v5_bridge.js';
import { ContractManager } from '../contracts/contract_manager.js';
import { ComplianceTracker } from '../compliance/compliance_tracker.js';
import { ChittyChainIntegration } from '../courthouse/chittychain/integration.js';

export class LLCFormationEngine {
    constructor() {
        this.memory = new MemorySystemV5({
            openai_assistant_id: process.env.OPENAI_ASSISTANT_ID || 'asst_tkBVT2u44lFI2Sx8i4oxDUvk',
            namespace: 'cloudesq_gc_llc_formation'
        });
        
        this.contractManager = new ContractManager();
        this.complianceTracker = new ComplianceTracker();
        this.chittyChain = new ChittyChainIntegration();
        
        this.supportedStates = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
        ];
    }

    /**
     * Initialize new LLC formation project
     */
    async initializeLLCFormation(businessInfo) {
        try {
            const formationId = `LLC-${Date.now()}`;
            
            // Validate business information
            const validationResult = await this.validateBusinessInfo(businessInfo);
            if (!validationResult.isValid) {
                throw new Error(`Invalid business information: ${validationResult.errors.join(', ')}`);
            }

            // Create formation project in memory
            await this.memory.storeMemory({
                content: `LLC formation project initialized for ${businessInfo.businessName}`,
                context: 'Business Formation',
                confidence: 0.95,
                metadata: {
                    type: 'llc_formation_project',
                    formation_id: formationId,
                    business_name: businessInfo.businessName,
                    state: businessInfo.state,
                    formation_date: new Date().toISOString(),
                    status: 'initialized',
                    members: businessInfo.members || [],
                    registered_agent: businessInfo.registeredAgent || null
                },
                tags: ['llc_formation', 'business_formation', businessInfo.state.toLowerCase(), formationId]
            });

            // Start compliance tracking
            await this.complianceTracker.initializeEntityCompliance(formationId, 'LLC', businessInfo.state);

            // Create formation workflow
            const workflow = await this.createFormationWorkflow(formationId, businessInfo);

            return {
                success: true,
                formationId,
                workflow,
                message: `LLC formation project ${formationId} initialized successfully`
            };

        } catch (error) {
            console.error('Error initializing LLC formation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate business information for LLC formation
     */
    async validateBusinessInfo(businessInfo) {
        const errors = [];

        // Required fields
        if (!businessInfo.businessName) errors.push('Business name is required');
        if (!businessInfo.state) errors.push('State is required');
        if (!businessInfo.purpose) errors.push('Business purpose is required');

        // State validation
        if (businessInfo.state && !this.supportedStates.includes(businessInfo.state.toUpperCase())) {
            errors.push(`State ${businessInfo.state} is not supported`);
        }

        // Business name validation
        if (businessInfo.businessName) {
            const nameValidation = await this.validateBusinessName(businessInfo.businessName, businessInfo.state);
            if (!nameValidation.isValid) {
                errors.push(...nameValidation.errors);
            }
        }

        // Member validation
        if (businessInfo.members && businessInfo.members.length === 0) {
            errors.push('At least one member is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate business name availability and compliance
     */
    async validateBusinessName(businessName, state) {
        const errors = [];

        // Basic name validation
        if (!businessName.toLowerCase().includes('llc') && !businessName.toLowerCase().includes('limited liability company')) {
            errors.push('Business name must include "LLC" or "Limited Liability Company"');
        }

        // Check for prohibited words
        const prohibitedWords = ['bank', 'insurance', 'university', 'college', 'corporation', 'corp', 'incorporated', 'inc'];
        const nameWords = businessName.toLowerCase().split(' ');
        
        for (const word of prohibitedWords) {
            if (nameWords.includes(word)) {
                errors.push(`Business name cannot contain prohibited word: ${word}`);
            }
        }

        // TODO: Add state-specific name availability checking
        // This would require API integration with state databases

        return {
            isValid: errors.length === 0,
            errors,
            suggestions: errors.length > 0 ? this.generateNameSuggestions(businessName) : []
        };
    }

    /**
     * Generate business name suggestions
     */
    generateNameSuggestions(originalName) {
        const baseName = originalName.replace(/\s*(llc|limited liability company)\s*/gi, '').trim();
        return [
            `${baseName} LLC`,
            `${baseName} Limited Liability Company`,
            `${baseName} Services LLC`,
            `${baseName} Holdings LLC`,
            `${baseName} Group LLC`
        ];
    }

    /**
     * Create formation workflow based on state requirements
     */
    async createFormationWorkflow(formationId, businessInfo) {
        const stateRequirements = await this.getStateRequirements(businessInfo.state);
        
        const workflow = {
            formationId,
            state: businessInfo.state,
            steps: [
                {
                    id: 'name_reservation',
                    title: 'Reserve Business Name',
                    description: 'Reserve the business name with the state',
                    required: stateRequirements.nameReservationRequired,
                    status: 'pending',
                    estimatedDays: 1,
                    cost: stateRequirements.nameReservationFee || 0
                },
                {
                    id: 'articles_preparation',
                    title: 'Prepare Articles of Organization',
                    description: 'Create and review Articles of Organization',
                    required: true,
                    status: 'pending',
                    estimatedDays: 2,
                    cost: 0
                },
                {
                    id: 'registered_agent',
                    title: 'Appoint Registered Agent',
                    description: 'Designate registered agent for service of process',
                    required: true,
                    status: 'pending',
                    estimatedDays: 1,
                    cost: stateRequirements.registeredAgentFee || 0
                },
                {
                    id: 'state_filing',
                    title: 'File Articles of Organization',
                    description: 'Submit Articles of Organization to state',
                    required: true,
                    status: 'pending',
                    estimatedDays: stateRequirements.filingProcessingDays || 5,
                    cost: stateRequirements.filingFee || 0
                },
                {
                    id: 'operating_agreement',
                    title: 'Create Operating Agreement',
                    description: 'Draft and execute LLC Operating Agreement',
                    required: stateRequirements.operatingAgreementRequired,
                    status: 'pending',
                    estimatedDays: 3,
                    cost: 0
                },
                {
                    id: 'ein_application',
                    title: 'Apply for EIN',
                    description: 'Apply for Employer Identification Number with IRS',
                    required: true,
                    status: 'pending',
                    estimatedDays: 1,
                    cost: 0
                },
                {
                    id: 'business_licenses',
                    title: 'Obtain Business Licenses',
                    description: 'Apply for required business licenses and permits',
                    required: false,
                    status: 'pending',
                    estimatedDays: 10,
                    cost: 'varies'
                },
                {
                    id: 'tax_elections',
                    title: 'Make Tax Elections',
                    description: 'File tax election forms if applicable',
                    required: false,
                    status: 'pending',
                    estimatedDays: 1,
                    cost: 0
                },
                {
                    id: 'compliance_setup',
                    title: 'Set Up Compliance Calendar',
                    description: 'Create ongoing compliance and filing calendar',
                    required: true,
                    status: 'pending',
                    estimatedDays: 1,
                    cost: 0
                }
            ],
            totalEstimatedDays: 25,
            totalEstimatedCost: this.calculateTotalCost(stateRequirements)
        };

        // Store workflow in memory
        await this.memory.storeMemory({
            content: `LLC formation workflow created for ${businessInfo.businessName}`,
            context: 'Formation Workflow',
            confidence: 0.9,
            metadata: {
                type: 'formation_workflow',
                formation_id: formationId,
                workflow: workflow,
                created_date: new Date().toISOString()
            },
            tags: ['workflow', 'llc_formation', businessInfo.state.toLowerCase(), formationId]
        });

        return workflow;
    }

    /**
     * Get state-specific requirements for LLC formation
     */
    async getStateRequirements(state) {
        // State-specific requirements database
        const stateRequirements = {
            'DE': {
                nameReservationRequired: true,
                nameReservationFee: 75,
                filingFee: 90,
                registeredAgentRequired: true,
                registeredAgentFee: 50,
                operatingAgreementRequired: false,
                filingProcessingDays: 7,
                publicationRequired: false,
                annualReportRequired: true,
                annualReportFee: 300
            },
            'CA': {
                nameReservationRequired: false,
                nameReservationFee: 10,
                filingFee: 70,
                registeredAgentRequired: true,
                registeredAgentFee: 0,
                operatingAgreementRequired: false,
                filingProcessingDays: 5,
                publicationRequired: false,
                annualReportRequired: true,
                annualReportFee: 800
            },
            'NY': {
                nameReservationRequired: false,
                nameReservationFee: 20,
                filingFee: 200,
                registeredAgentRequired: true,
                registeredAgentFee: 0,
                operatingAgreementRequired: false,
                filingProcessingDays: 3,
                publicationRequired: true,
                publicationCost: 1000,
                annualReportRequired: true,
                annualReportFee: 9
            }
            // Add more states as needed
        };

        return stateRequirements[state.toUpperCase()] || {
            nameReservationRequired: false,
            nameReservationFee: 0,
            filingFee: 100,
            registeredAgentRequired: true,
            registeredAgentFee: 0,
            operatingAgreementRequired: false,
            filingProcessingDays: 5,
            publicationRequired: false,
            annualReportRequired: true,
            annualReportFee: 50
        };
    }

    /**
     * Calculate total estimated cost for formation
     */
    calculateTotalCost(stateRequirements) {
        let total = 0;
        
        if (stateRequirements.nameReservationRequired) {
            total += stateRequirements.nameReservationFee || 0;
        }
        
        total += stateRequirements.filingFee || 0;
        total += stateRequirements.registeredAgentFee || 0;
        total += stateRequirements.publicationCost || 0;

        return total;
    }

    /**
     * Execute formation workflow step
     */
    async executeWorkflowStep(formationId, stepId, stepData = {}) {
        try {
            // Retrieve formation project
            const formationProject = await this.memory.searchMemories(`formation_id:${formationId}`, {
                tags: ['llc_formation'],
                limit: 1
            });

            if (!formationProject.length) {
                throw new Error(`Formation project ${formationId} not found`);
            }

            const project = formationProject[0];
            const workflow = project.metadata.workflow;
            const step = workflow.steps.find(s => s.id === stepId);

            if (!step) {
                throw new Error(`Step ${stepId} not found in workflow`);
            }

            // Execute step based on type
            let result;
            switch (stepId) {
                case 'name_reservation':
                    result = await this.executeNameReservation(formationId, stepData);
                    break;
                case 'articles_preparation':
                    result = await this.executeArticlesPreparation(formationId, stepData);
                    break;
                case 'registered_agent':
                    result = await this.executeRegisteredAgent(formationId, stepData);
                    break;
                case 'state_filing':
                    result = await this.executeStateFiling(formationId, stepData);
                    break;
                case 'operating_agreement':
                    result = await this.executeOperatingAgreement(formationId, stepData);
                    break;
                case 'ein_application':
                    result = await this.executeEINApplication(formationId, stepData);
                    break;
                case 'business_licenses':
                    result = await this.executeBusinessLicenses(formationId, stepData);
                    break;
                case 'tax_elections':
                    result = await this.executeTaxElections(formationId, stepData);
                    break;
                case 'compliance_setup':
                    result = await this.executeComplianceSetup(formationId, stepData);
                    break;
                default:
                    throw new Error(`Unknown step type: ${stepId}`);
            }

            // Update step status
            step.status = result.success ? 'completed' : 'failed';
            step.completedDate = new Date().toISOString();
            step.result = result;

            // Update workflow in memory
            await this.memory.updateMemory(project.id, {
                metadata: {
                    ...project.metadata,
                    workflow: workflow,
                    last_updated: new Date().toISOString()
                }
            });

            // Store step completion
            await this.memory.storeMemory({
                content: `Formation step ${stepId} ${result.success ? 'completed' : 'failed'} for ${formationId}`,
                context: 'Formation Step Execution',
                confidence: 0.9,
                metadata: {
                    type: 'formation_step_execution',
                    formation_id: formationId,
                    step_id: stepId,
                    result: result,
                    execution_date: new Date().toISOString()
                },
                tags: ['formation_step', stepId, formationId, result.success ? 'success' : 'failure']
            });

            return result;

        } catch (error) {
            console.error(`Error executing formation step ${stepId}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute name reservation step
     */
    async executeNameReservation(formationId, stepData) {
        try {
            // For now, this is a placeholder - would integrate with state APIs
            const reservationData = {
                businessName: stepData.businessName,
                state: stepData.state,
                reservationDate: new Date().toISOString(),
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                confirmationNumber: `NR-${Date.now()}`,
                status: 'reserved'
            };

            // Store reservation in memory
            await this.memory.storeMemory({
                content: `Business name ${stepData.businessName} reserved in ${stepData.state}`,
                context: 'Name Reservation',
                confidence: 0.95,
                metadata: {
                    type: 'name_reservation',
                    formation_id: formationId,
                    reservation_data: reservationData
                },
                tags: ['name_reservation', formationId, stepData.state.toLowerCase()]
            });

            return {
                success: true,
                data: reservationData,
                message: `Business name reserved successfully - Confirmation: ${reservationData.confirmationNumber}`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute articles preparation step
     */
    async executeArticlesPreparation(formationId, stepData) {
        try {
            // Generate Articles of Organization document
            const articlesData = {
                businessName: stepData.businessName,
                state: stepData.state,
                purpose: stepData.purpose || 'To engage in any lawful business activity',
                duration: stepData.duration || 'Perpetual',
                managementStructure: stepData.managementStructure || 'Member-managed',
                registeredAgent: stepData.registeredAgent,
                organizer: stepData.organizer,
                members: stepData.members || [],
                createdDate: new Date().toISOString()
            };

            // Use contract management system to create document
            const contractResult = await this.contractManager.createContract({
                type: 'articles_of_organization',
                templateId: 'articles_of_organization_template',
                data: articlesData,
                jurisdiction: stepData.state
            });

            // Store articles in memory
            await this.memory.storeMemory({
                content: `Articles of Organization prepared for ${stepData.businessName}`,
                context: 'Articles Preparation',
                confidence: 0.95,
                metadata: {
                    type: 'articles_of_organization',
                    formation_id: formationId,
                    articles_data: articlesData,
                    contract_id: contractResult.contractId
                },
                tags: ['articles_of_organization', formationId, stepData.state.toLowerCase()]
            });

            // Mint to blockchain for immutable record
            const chainResult = await this.chittyChain.mintEvidence({
                evidenceType: 'articles_of_organization',
                caseId: formationId,
                data: articlesData,
                level: 'legal'
            });

            return {
                success: true,
                data: {
                    articlesData,
                    contractId: contractResult.contractId,
                    blockchainId: chainResult.id
                },
                message: 'Articles of Organization prepared successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute registered agent step
     */
    async executeRegisteredAgent(formationId, stepData) {
        try {
            const agentData = {
                name: stepData.agentName,
                address: stepData.agentAddress,
                type: stepData.agentType || 'individual', // individual, company, service
                appointmentDate: new Date().toISOString(),
                state: stepData.state
            };

            // Store agent information
            await this.memory.storeMemory({
                content: `Registered agent ${stepData.agentName} appointed for ${formationId}`,
                context: 'Registered Agent',
                confidence: 0.95,
                metadata: {
                    type: 'registered_agent',
                    formation_id: formationId,
                    agent_data: agentData
                },
                tags: ['registered_agent', formationId, stepData.state.toLowerCase()]
            });

            return {
                success: true,
                data: agentData,
                message: 'Registered agent appointed successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute state filing step
     */
    async executeStateFiling(formationId, stepData) {
        try {
            // For now, this is a placeholder - would integrate with state filing APIs
            const filingData = {
                formationId: formationId,
                state: stepData.state,
                filingDate: new Date().toISOString(),
                filingNumber: `LLC-${stepData.state}-${Date.now()}`,
                status: 'filed',
                effectiveDate: stepData.effectiveDate || new Date().toISOString(),
                fee: stepData.fee || 0
            };

            // Store filing information
            await this.memory.storeMemory({
                content: `Articles of Organization filed with ${stepData.state} - Filing #${filingData.filingNumber}`,
                context: 'State Filing',
                confidence: 0.95,
                metadata: {
                    type: 'state_filing',
                    formation_id: formationId,
                    filing_data: filingData
                },
                tags: ['state_filing', formationId, stepData.state.toLowerCase(), 'filed']
            });

            // Mint filing confirmation to blockchain
            const chainResult = await this.chittyChain.mintEvidence({
                evidenceType: 'state_filing_confirmation',
                caseId: formationId,
                data: filingData,
                level: 'legal'
            });

            return {
                success: true,
                data: {
                    filingData,
                    blockchainId: chainResult.id
                },
                message: `Articles filed successfully - Filing Number: ${filingData.filingNumber}`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute operating agreement step
     */
    async executeOperatingAgreement(formationId, stepData) {
        try {
            // Generate Operating Agreement using contract system
            const agreementData = {
                businessName: stepData.businessName,
                state: stepData.state,
                formationDate: stepData.formationDate,
                members: stepData.members || [],
                managementStructure: stepData.managementStructure || 'Member-managed',
                distributionTerms: stepData.distributionTerms || 'Pro-rata by membership interest',
                votingRights: stepData.votingRights || 'Majority rule',
                transferRestrictions: stepData.transferRestrictions || 'Consent of majority members required',
                dissolutionTerms: stepData.dissolutionTerms || 'Majority vote required',
                createdDate: new Date().toISOString()
            };

            // Create operating agreement contract
            const contractResult = await this.contractManager.createContract({
                type: 'operating_agreement',
                templateId: 'llc_operating_agreement_template',
                data: agreementData,
                jurisdiction: stepData.state
            });

            // Store agreement in memory
            await this.memory.storeMemory({
                content: `Operating Agreement created for ${stepData.businessName}`,
                context: 'Operating Agreement',
                confidence: 0.95,
                metadata: {
                    type: 'operating_agreement',
                    formation_id: formationId,
                    agreement_data: agreementData,
                    contract_id: contractResult.contractId
                },
                tags: ['operating_agreement', formationId, stepData.state.toLowerCase()]
            });

            // Mint to blockchain
            const chainResult = await this.chittyChain.mintEvidence({
                evidenceType: 'operating_agreement',
                caseId: formationId,
                data: agreementData,
                level: 'legal'
            });

            return {
                success: true,
                data: {
                    agreementData,
                    contractId: contractResult.contractId,
                    blockchainId: chainResult.id
                },
                message: 'Operating Agreement created successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute EIN application step
     */
    async executeEINApplication(formationId, stepData) {
        try {
            // For now, this is a placeholder - would integrate with IRS APIs
            const einData = {
                formationId: formationId,
                businessName: stepData.businessName,
                ein: `XX-XXXXXXX`, // Would be actual EIN from IRS
                applicationDate: new Date().toISOString(),
                responsibleParty: stepData.responsibleParty,
                businessType: 'LLC',
                state: stepData.state,
                taxClassification: stepData.taxClassification || 'Disregarded Entity'
            };

            // Store EIN information
            await this.memory.storeMemory({
                content: `EIN ${einData.ein} obtained for ${stepData.businessName}`,
                context: 'EIN Application',
                confidence: 0.95,
                metadata: {
                    type: 'ein_application',
                    formation_id: formationId,
                    ein_data: einData
                },
                tags: ['ein_application', formationId, 'federal_tax']
            });

            return {
                success: true,
                data: einData,
                message: `EIN obtained successfully: ${einData.ein}`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute business licenses step
     */
    async executeBusinessLicenses(formationId, stepData) {
        try {
            // Identify required licenses based on business type and location
            const requiredLicenses = await this.identifyRequiredLicenses(
                stepData.businessType,
                stepData.state,
                stepData.city,
                stepData.county
            );

            // Store license requirements
            await this.memory.storeMemory({
                content: `Business license requirements identified for ${stepData.businessName}`,
                context: 'Business Licenses',
                confidence: 0.9,
                metadata: {
                    type: 'business_licenses',
                    formation_id: formationId,
                    required_licenses: requiredLicenses,
                    business_type: stepData.businessType,
                    location: {
                        state: stepData.state,
                        city: stepData.city,
                        county: stepData.county
                    }
                },
                tags: ['business_licenses', formationId, stepData.state.toLowerCase()]
            });

            return {
                success: true,
                data: { requiredLicenses },
                message: `${requiredLicenses.length} required licenses identified`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute tax elections step
     */
    async executeTaxElections(formationId, stepData) {
        try {
            const electionData = {
                formationId: formationId,
                taxClassification: stepData.taxClassification || 'Disregarded Entity',
                sCorporationElection: stepData.sCorporationElection || false,
                electionDate: new Date().toISOString(),
                effectiveDate: stepData.effectiveDate || new Date().toISOString()
            };

            // Store tax election information
            await this.memory.storeMemory({
                content: `Tax election ${electionData.taxClassification} made for ${formationId}`,
                context: 'Tax Elections',
                confidence: 0.95,
                metadata: {
                    type: 'tax_elections',
                    formation_id: formationId,
                    election_data: electionData
                },
                tags: ['tax_elections', formationId, 'federal_tax']
            });

            return {
                success: true,
                data: electionData,
                message: `Tax election completed: ${electionData.taxClassification}`
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute compliance setup step
     */
    async executeComplianceSetup(formationId, stepData) {
        try {
            // Set up ongoing compliance calendar
            const complianceCalendar = await this.complianceTracker.createComplianceCalendar(
                formationId,
                'LLC',
                stepData.state,
                stepData.formationDate
            );

            // Store compliance setup
            await this.memory.storeMemory({
                content: `Compliance calendar set up for ${formationId}`,
                context: 'Compliance Setup',
                confidence: 0.95,
                metadata: {
                    type: 'compliance_setup',
                    formation_id: formationId,
                    compliance_calendar: complianceCalendar
                },
                tags: ['compliance_setup', formationId, stepData.state.toLowerCase()]
            });

            return {
                success: true,
                data: { complianceCalendar },
                message: 'Compliance calendar set up successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Identify required business licenses
     */
    async identifyRequiredLicenses(businessType, state, city, county) {
        // This would integrate with business license databases
        const commonLicenses = [
            {
                name: 'General Business License',
                level: 'local',
                authority: city || county,
                required: true,
                estimatedCost: 50
            },
            {
                name: 'State Business Registration',
                level: 'state',
                authority: state,
                required: true,
                estimatedCost: 100
            }
        ];

        // Add industry-specific licenses based on business type
        // This would be expanded with a comprehensive license database

        return commonLicenses;
    }

    /**
     * Get formation project status
     */
    async getFormationStatus(formationId) {
        try {
            const formationProject = await this.memory.searchMemories(`formation_id:${formationId}`, {
                tags: ['llc_formation'],
                limit: 1
            });

            if (!formationProject.length) {
                return {
                    success: false,
                    error: 'Formation project not found'
                };
            }

            const project = formationProject[0];
            const workflow = project.metadata.workflow;

            // Calculate completion percentage
            const completedSteps = workflow.steps.filter(step => step.status === 'completed').length;
            const totalSteps = workflow.steps.length;
            const completionPercentage = (completedSteps / totalSteps) * 100;

            return {
                success: true,
                data: {
                    formationId,
                    businessName: project.metadata.business_name,
                    state: project.metadata.state,
                    status: project.metadata.status,
                    completionPercentage,
                    completedSteps,
                    totalSteps,
                    workflow
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default LLCFormationEngine;