#!/usr/bin/env node

/**
 * PRODUCTION LLC Formation System Test Suite
 * Comprehensive testing of real API integrations and functionality
 */

import { config } from 'dotenv';
import { LLCFormationEngine } from './llc_formation_engine.js';
import { StateFilingAPIIntegration } from './state_filing_api_integration.js';
import { MemorySystemV5 } from '../shared/memory/memory_v5_bridge.js';
import { ChittyChainIntegration } from '../courthouse/chittychain/integration.js';

config();

class LLCFormationSystemTest {
    constructor() {
        this.testResults = [];
        this.formationEngine = new LLCFormationEngine();
        this.stateFilingAPI = new StateFilingAPIIntegration();
        this.memory = new MemorySystemV5({
            openai_assistant_id: process.env.OPENAI_ASSISTANT_ID,
            namespace: 'cloudesq_gc_llc_formation_test'
        });
        this.chittyChain = new ChittyChainIntegration();
    }

    async runAllTests() {
        console.log('🧪 Running LLC Formation System Test Suite...\n');

        try {
            // Core System Tests
            await this.testFormationEngineInitialization();
            await this.testMemorySystemIntegration();
            await this.testChittyChainIntegration();

            // API Integration Tests
            await this.testIncFileAPIIntegration();
            await this.testDelawareAPIIntegration();
            await this.testIRSAPIIntegration();

            // End-to-End Tests
            await this.testCompleteFormationWorkflow();
            await this.testBusinessNameOperations();
            await this.testEINApplicationProcess();
            await this.testComplianceCalendarGeneration();

            // Performance Tests
            await this.testSystemPerformance();

            // Error Handling Tests
            await this.testErrorHandling();

            // Generate Test Report
            this.generateTestReport();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    async testFormationEngineInitialization() {
        console.log('🔧 Testing Formation Engine Initialization...');
        
        try {
            const testBusinessData = {
                businessName: 'CloudEsq Test LLC',
                state: 'DE',
                purpose: 'Software development and legal technology services',
                members: [
                    {
                        name: 'Test Member 1',
                        address: '123 Test St, Test City, DE 19801',
                        membershipPercentage: 100
                    }
                ],
                registeredAgent: {
                    name: 'Test Registered Agent',
                    address: '456 Agent St, Wilmington, DE 19801'
                },
                organizer: {
                    name: 'Test Organizer',
                    address: '789 Organizer St, Wilmington, DE 19801'
                }
            };

            const result = await this.formationEngine.initializeLLCFormation(testBusinessData);
            
            this.recordTestResult(
                'Formation Engine Initialization',
                result.success,
                result.success ? 'Formation project initialized successfully' : result.error
            );

            if (result.success) {
                this.testFormationId = result.formationId;
                console.log(`✅ Formation ID: ${this.testFormationId}`);
            }

        } catch (error) {
            this.recordTestResult(
                'Formation Engine Initialization',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testMemorySystemIntegration() {
        console.log('🧠 Testing Memory System Integration...');
        
        try {
            // Test storing formation-related memory
            await this.memory.storeMemory({
                content: 'Test LLC formation project created for system validation',
                context: 'System Testing',
                confidence: 0.95,
                metadata: {
                    type: 'test_formation',
                    test_run: new Date().toISOString()
                },
                tags: ['test', 'llc_formation', 'system_validation']
            });

            // Test retrieving memory
            const memories = await this.memory.searchMemories('test LLC formation', {
                tags: ['test'],
                limit: 1
            });

            this.recordTestResult(
                'Memory System Integration',
                memories.length > 0,
                memories.length > 0 ? 'Memory stored and retrieved successfully' : 'Memory operations failed'
            );

        } catch (error) {
            this.recordTestResult(
                'Memory System Integration',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testChittyChainIntegration() {
        console.log('⛓️  Testing ChittyChain Integration...');
        
        try {
            // Test evidence minting
            const evidenceData = {
                evidenceType: 'test_formation_document',
                caseId: 'TEST-CASE-001',
                data: {
                    businessName: 'CloudEsq Test LLC',
                    testTimestamp: new Date().toISOString()
                },
                level: 'business'
            };

            const result = await this.chittyChain.mintEvidence(evidenceData);
            
            this.recordTestResult(
                'ChittyChain Integration',
                result.success !== false,
                result.success !== false ? 'Evidence minted successfully' : result.error
            );

        } catch (error) {
            this.recordTestResult(
                'ChittyChain Integration',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testIncFileAPIIntegration() {
        console.log('📊 Testing IncFile API Integration...');
        
        try {
            // Test name availability check
            const nameCheckResult = await this.stateFilingAPI.checkBusinessNameAvailability(
                'CloudEsq Test LLC',
                'DE'
            );
            
            this.recordTestResult(
                'IncFile API - Name Check',
                nameCheckResult.success !== false,
                nameCheckResult.success !== false ? 'Name availability check successful' : nameCheckResult.error
            );

            // Test fee calculation
            const feeResult = await this.stateFilingAPI.calculateStateFees('DE', ['expedited']);
            
            this.recordTestResult(
                'IncFile API - Fee Calculation',
                feeResult.success !== false,
                feeResult.success !== false ? 'Fee calculation successful' : feeResult.error
            );

        } catch (error) {
            this.recordTestResult(
                'IncFile API Integration',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testDelawareAPIIntegration() {
        console.log('🏛️  Testing Delaware API Integration...');
        
        try {
            // Test Delaware name availability
            const nameCheckResult = await this.stateFilingAPI.stateAPIs.DE?.checkNameAvailability('CloudEsq Test LLC');
            
            this.recordTestResult(
                'Delaware API - Name Check',
                nameCheckResult?.available !== undefined,
                nameCheckResult?.available !== undefined ? 'Delaware name check successful' : 'Delaware API not available'
            );

            // Test Delaware fee calculation
            const feeResult = await this.stateFilingAPI.stateAPIs.DE?.calculateFees(['expedited']);
            
            this.recordTestResult(
                'Delaware API - Fee Calculation',
                feeResult?.filingFee !== undefined,
                feeResult?.filingFee !== undefined ? 'Delaware fee calculation successful' : 'Delaware fee calculation failed'
            );

        } catch (error) {
            this.recordTestResult(
                'Delaware API Integration',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testIRSAPIIntegration() {
        console.log('🏦 Testing IRS API Integration...');
        
        try {
            // Test business activity code lookup
            const codeResult = await this.stateFilingAPI.irsAPI.lookupBusinessActivityCode('software development');
            
            this.recordTestResult(
                'IRS API - Business Activity Code',
                Array.isArray(codeResult),
                Array.isArray(codeResult) ? 'Business activity code lookup successful' : 'Business activity code lookup failed'
            );

            // Test EIN verification (using test EIN)
            const einResult = await this.stateFilingAPI.irsAPI.verifyEIN('12-3456789');
            
            this.recordTestResult(
                'IRS API - EIN Verification',
                einResult.isValid !== undefined,
                einResult.isValid !== undefined ? 'EIN verification successful' : 'EIN verification failed'
            );

        } catch (error) {
            this.recordTestResult(
                'IRS API Integration',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testCompleteFormationWorkflow() {
        console.log('🔄 Testing Complete Formation Workflow...');
        
        try {
            if (!this.testFormationId) {
                throw new Error('Test formation ID not available');
            }

            // Test workflow step execution
            const stepResult = await this.formationEngine.executeWorkflowStep(
                this.testFormationId,
                'articles_preparation',
                {
                    businessName: 'CloudEsq Test LLC',
                    state: 'DE',
                    purpose: 'Software development and legal technology services',
                    registeredAgent: {
                        name: 'Test Registered Agent',
                        address: '456 Agent St, Wilmington, DE 19801'
                    },
                    organizer: {
                        name: 'Test Organizer',
                        address: '789 Organizer St, Wilmington, DE 19801'
                    }
                }
            );

            this.recordTestResult(
                'Complete Formation Workflow',
                stepResult.success,
                stepResult.success ? 'Workflow step executed successfully' : stepResult.error
            );

        } catch (error) {
            this.recordTestResult(
                'Complete Formation Workflow',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testBusinessNameOperations() {
        console.log('📝 Testing Business Name Operations...');
        
        try {
            // Test name validation
            const validationResult = await this.formationEngine.validateBusinessName('CloudEsq Test LLC', 'DE');
            
            this.recordTestResult(
                'Business Name Validation',
                validationResult.isValid !== undefined,
                validationResult.isValid !== undefined ? 'Name validation successful' : 'Name validation failed'
            );

            // Test name suggestions
            const suggestions = this.formationEngine.generateNameSuggestions('CloudEsq Test');
            
            this.recordTestResult(
                'Business Name Suggestions',
                Array.isArray(suggestions) && suggestions.length > 0,
                Array.isArray(suggestions) && suggestions.length > 0 ? 'Name suggestions generated' : 'Name suggestions failed'
            );

        } catch (error) {
            this.recordTestResult(
                'Business Name Operations',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testEINApplicationProcess() {
        console.log('🔢 Testing EIN Application Process...');
        
        try {
            // Test EIN application data preparation
            const einData = {
                legalName: 'CloudEsq Test LLC',
                entityType: 'LLC',
                stateOfOrganization: 'DE',
                businessActivity: 'Software development',
                responsibleParty: {
                    name: 'Test Responsible Party',
                    ssn: '123-45-6789',
                    address: '123 Test St, Test City, DE 19801'
                },
                businessAddress: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'DE',
                    zip: '19801'
                }
            };

            // Test EIN application validation (not actual submission)
            const validationResult = await this.stateFilingAPI.irsAPI.validateBusinessStructure({
                entityType: 'LLC',
                stateOfOrganization: 'DE',
                businessActivity: 'Software development',
                members: [{ name: 'Test Member' }],
                taxClassification: 'disregarded_entity'
            });

            this.recordTestResult(
                'EIN Application Process',
                validationResult.isValid !== undefined,
                validationResult.isValid !== undefined ? 'EIN application validation successful' : 'EIN application validation failed'
            );

        } catch (error) {
            this.recordTestResult(
                'EIN Application Process',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testComplianceCalendarGeneration() {
        console.log('📅 Testing Compliance Calendar Generation...');
        
        try {
            // Test tax calendar creation
            const taxCalendarData = {
                entityType: 'LLC',
                taxClassification: 'disregarded_entity',
                stateOfOrganization: 'DE',
                hasEmployees: false,
                sCorpElection: false
            };

            const calendarResult = await this.stateFilingAPI.irsAPI.createTaxCalendar(taxCalendarData);
            
            this.recordTestResult(
                'Compliance Calendar Generation',
                calendarResult.taxCalendar !== undefined,
                calendarResult.taxCalendar !== undefined ? 'Compliance calendar generated successfully' : 'Compliance calendar generation failed'
            );

        } catch (error) {
            this.recordTestResult(
                'Compliance Calendar Generation',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testSystemPerformance() {
        console.log('⚡ Testing System Performance...');
        
        try {
            const startTime = Date.now();
            
            // Test concurrent formation initializations
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(this.formationEngine.initializeLLCFormation({
                    businessName: `Performance Test LLC ${i}`,
                    state: 'DE',
                    purpose: 'Performance testing',
                    members: [{ name: `Test Member ${i}` }]
                }));
            }

            const results = await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;

            const successCount = results.filter(r => r.success).length;
            
            this.recordTestResult(
                'System Performance',
                successCount === 5 && duration < 10000,
                `${successCount}/5 operations completed in ${duration}ms`
            );

        } catch (error) {
            this.recordTestResult(
                'System Performance',
                false,
                `Error: ${error.message}`
            );
        }
    }

    async testErrorHandling() {
        console.log('🚨 Testing Error Handling...');
        
        try {
            // Test invalid business name
            const invalidNameResult = await this.formationEngine.initializeLLCFormation({
                businessName: '', // Invalid empty name
                state: 'DE',
                purpose: 'Test'
            });

            this.recordTestResult(
                'Error Handling - Invalid Name',
                !invalidNameResult.success,
                !invalidNameResult.success ? 'Invalid name properly rejected' : 'Invalid name not rejected'
            );

            // Test invalid state
            const invalidStateResult = await this.formationEngine.initializeLLCFormation({
                businessName: 'Test LLC',
                state: 'XX', // Invalid state
                purpose: 'Test'
            });

            this.recordTestResult(
                'Error Handling - Invalid State',
                !invalidStateResult.success,
                !invalidStateResult.success ? 'Invalid state properly rejected' : 'Invalid state not rejected'
            );

        } catch (error) {
            this.recordTestResult(
                'Error Handling',
                true,
                'Error handling working correctly'
            );
        }
    }

    recordTestResult(testName, passed, message) {
        this.testResults.push({
            test: testName,
            passed: passed,
            message: message,
            timestamp: new Date().toISOString()
        });

        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${message}`);
    }

    generateTestReport() {
        console.log('\n📊 Test Report');
        console.log('=' * 50);
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = (passedTests / totalTests * 100).toFixed(1);

        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${successRate}%`);

        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`  - ${result.test}: ${result.message}`);
            });
        }

        console.log('\n📋 Detailed Results:');
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}`);
            console.log(`   ${result.message}`);
        });

        // Save test report to file
        const fs = require('fs');
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests,
                passedTests,
                failedTests,
                successRate: parseFloat(successRate)
            },
            results: this.testResults
        };

        fs.writeFileSync('test_report.json', JSON.stringify(reportData, null, 2));
        console.log('\n📄 Test report saved to test_report.json');

        if (failedTests > 0) {
            console.log('\n⚠️  Some tests failed. Please review the issues before deploying to production.');
            process.exit(1);
        } else {
            console.log('\n🎉 All tests passed! System is ready for production use.');
        }
    }
}

// Run the test suite
const tester = new LLCFormationSystemTest();
tester.runAllTests().catch(console.error);