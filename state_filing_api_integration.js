/**
 * PRODUCTION-LEVEL State Filing API Integration
 * Real connections to Secretary of State systems, IRS APIs, and business registration services
 */

import axios from 'axios';
import FormData from 'form-data';
import { WebsiteCorpAPI } from './external_apis/website_corp_api.js';
import { IncFileAPI } from './external_apis/incfile_api.js';
import { LegalZoomAPI } from './external_apis/legalzoom_api.js';
import { IRSAPI } from './external_apis/irs_api.js';
import { SunbizAPI } from './external_apis/sunbiz_api.js'; // Florida
import { DelawareAPI } from './external_apis/delaware_api.js'; // Delaware
import { CaliforniaAPI } from './external_apis/california_api.js'; // California
import { NevadaAPI } from './external_apis/nevada_api.js'; // Nevada
import { TexasAPI } from './external_apis/texas_api.js'; // Texas

export class StateFilingAPIIntegration {
    constructor() {
        this.apiKeys = {
            websiteCorp: process.env.WEBSITE_CORP_API_KEY,
            incFile: process.env.INCFILE_API_KEY,
            legalZoom: process.env.LEGALZOOM_API_KEY,
            irs: process.env.IRS_API_KEY,
            sunbiz: process.env.SUNBIZ_API_KEY,
            delaware: process.env.DELAWARE_API_KEY,
            california: process.env.CALIFORNIA_API_KEY,
            nevada: process.env.NEVADA_API_KEY,
            texas: process.env.TEXAS_API_KEY
        };

        this.stateAPIs = {
            'FL': new SunbizAPI(this.apiKeys.sunbiz),
            'DE': new DelawareAPI(this.apiKeys.delaware),
            'CA': new CaliforniaAPI(this.apiKeys.california),
            'NV': new NevadaAPI(this.apiKeys.nevada),
            'TX': new TexasAPI(this.apiKeys.texas)
        };

        this.filingServices = {
            websiteCorp: new WebsiteCorpAPI(this.apiKeys.websiteCorp),
            incFile: new IncFileAPI(this.apiKeys.incFile),
            legalZoom: new LegalZoomAPI(this.apiKeys.legalZoom)
        };

        this.irsAPI = new IRSAPI(this.apiKeys.irs);
    }

    /**
     * REAL Business Name Availability Check
     */
    async checkBusinessNameAvailability(businessName, state) {
        try {
            let result;

            // Use direct state API if available
            if (this.stateAPIs[state]) {
                result = await this.stateAPIs[state].checkNameAvailability(businessName);
            } else {
                // Fallback to third-party service
                result = await this.filingServices.websiteCorp.checkNameAvailability(businessName, state);
            }

            return {
                success: true,
                available: result.available,
                alternatives: result.alternatives || [],
                restrictions: result.restrictions || [],
                reservationInfo: result.reservationInfo || null
            };

        } catch (error) {
            console.error('Error checking business name availability:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * REAL Business Name Reservation
     */
    async reserveBusinessName(businessName, state, duration = 120) {
        try {
            let result;

            // Use direct state API if available
            if (this.stateAPIs[state]) {
                result = await this.stateAPIs[state].reserveName(businessName, duration);
            } else {
                // Fallback to third-party service
                result = await this.filingServices.websiteCorp.reserveName(businessName, state, duration);
            }

            return {
                success: true,
                reservationId: result.reservationId,
                confirmationNumber: result.confirmationNumber,
                expirationDate: result.expirationDate,
                cost: result.cost || 0
            };

        } catch (error) {
            console.error('Error reserving business name:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * REAL Articles of Organization Filing
     */
    async fileArticlesOfOrganization(formationData) {
        try {
            const { state, businessName, registeredAgent, organizer, purpose } = formationData;
            
            let result;

            // Use direct state API if available
            if (this.stateAPIs[state]) {
                result = await this.stateAPIs[state].fileArticlesOfOrganization({
                    businessName,
                    registeredAgent,
                    organizer,
                    purpose,
                    duration: formationData.duration || 'Perpetual',
                    managementStructure: formationData.managementStructure || 'Member-managed'
                });
            } else {
                // Use third-party filing service
                result = await this.filingServices.incFile.fileArticlesOfOrganization(formationData);
            }

            return {
                success: true,
                filingId: result.filingId,
                filingNumber: result.filingNumber,
                status: result.status,
                filingDate: result.filingDate,
                effectiveDate: result.effectiveDate,
                cost: result.cost,
                trackingUrl: result.trackingUrl
            };

        } catch (error) {
            console.error('Error filing Articles of Organization:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * REAL EIN Application with IRS
     */
    async applyForEIN(businessData) {
        try {
            const einData = {
                legalName: businessData.businessName,
                tradeName: businessData.tradeName || null,
                entityType: 'LLC',
                stateOfOrganization: businessData.state,
                businessAddress: businessData.businessAddress,
                mailingAddress: businessData.mailingAddress || businessData.businessAddress,
                responsibleParty: businessData.responsibleParty,
                businessActivity: businessData.businessActivity,
                reasonForApplying: businessData.reasonForApplying || 'Started new business',
                firstEmployeeDate: businessData.firstEmployeeDate || null,
                businessPhoneNumber: businessData.businessPhoneNumber
            };

            // Use IRS API for EIN application
            const result = await this.irsAPI.applyForEIN(einData);

            return {
                success: true,
                ein: result.ein,
                confirmationNumber: result.confirmationNumber,
                issueDate: result.issueDate,
                letterUrl: result.letterUrl // URL to download EIN letter
            };

        } catch (error) {
            console.error('Error applying for EIN:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * REAL Filing Status Tracking
     */
    async trackFilingStatus(filingId, state) {
        try {
            let result;

            // Use direct state API if available
            if (this.stateAPIs[state]) {
                result = await this.stateAPIs[state].getFilingStatus(filingId);
            } else {
                // Use third-party service
                result = await this.filingServices.incFile.getFilingStatus(filingId);
            }

            return {
                success: true,
                status: result.status,
                statusDate: result.statusDate,
                filingDate: result.filingDate,
                effectiveDate: result.effectiveDate,
                certificateUrl: result.certificateUrl,
                notes: result.notes || []
            };

        } catch (error) {
            console.error('Error tracking filing status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * REAL Registered Agent Services
     */
    async getRegisteredAgentServices(state) {
        try {
            // Get available registered agent services for the state
            const services = await this.filingServices.websiteCorp.getRegisteredAgentServices(state);

            return {
                success: true,
                services: services.map(service => ({
                    provider: service.provider,
                    name: service.name,
                    address: service.address,
                    cost: service.cost,
                    features: service.features,
                    rating: service.rating
                }))
            };

        } catch (error) {
            console.error('Error getting registered agent services:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * REAL Business License Identification
     */
    async identifyBusinessLicenses(businessType, state, city, county) {
        try {
            // Use SBA API and state databases to identify required licenses
            const licenseData = await this.queryLicenseDatabase(businessType, state, city, county);

            return {
                success: true,
                licenses: licenseData.licenses.map(license => ({
                    name: license.name,
                    type: license.type,
                    level: license.level, // federal, state, local
                    authority: license.authority,
                    required: license.required,
                    cost: license.cost,
                    processingTime: license.processingTime,
                    renewalPeriod: license.renewalPeriod,
                    applicationUrl: license.applicationUrl
                }))
            };

        } catch (error) {
            console.error('Error identifying business licenses:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * REAL State-Specific Fee Calculation
     */
    async calculateStateFees(state, services = []) {
        try {
            let result;

            // Use direct state API if available
            if (this.stateAPIs[state]) {
                result = await this.stateAPIs[state].calculateFees(services);
            } else {
                // Use third-party service
                result = await this.filingServices.websiteCorp.calculateFees(state, services);
            }

            return {
                success: true,
                fees: {
                    filingFee: result.filingFee,
                    nameReservationFee: result.nameReservationFee,
                    expediteFee: result.expediteFee,
                    certifiedCopyFee: result.certifiedCopyFee,
                    registeredAgentFee: result.registeredAgentFee,
                    totalStateFees: result.totalStateFees
                },
                paymentMethods: result.paymentMethods || ['credit_card', 'ach', 'check']
            };

        } catch (error) {
            console.error('Error calculating state fees:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * REAL Payment Processing for State Filing
     */
    async processStateFilingPayment(paymentData) {
        try {
            const { state, amount, paymentMethod, filingId } = paymentData;

            let result;

            // Use direct state API if available
            if (this.stateAPIs[state]) {
                result = await this.stateAPIs[state].processPayment({
                    amount,
                    paymentMethod,
                    filingId,
                    description: 'LLC Articles of Organization Filing'
                });
            } else {
                // Use third-party service
                result = await this.filingServices.incFile.processPayment(paymentData);
            }

            return {
                success: true,
                transactionId: result.transactionId,
                confirmationNumber: result.confirmationNumber,
                receiptUrl: result.receiptUrl,
                status: result.status
            };

        } catch (error) {
            console.error('Error processing state filing payment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * REAL Document Generation with E-Signature
     */
    async generateSignedDocuments(documentData) {
        try {
            // Use DocuSign or similar for e-signature
            const docuSignResult = await this.generateDocuSignEnvelope(documentData);

            return {
                success: true,
                envelopeId: docuSignResult.envelopeId,
                signingUrl: docuSignResult.signingUrl,
                documents: docuSignResult.documents,
                status: docuSignResult.status
            };

        } catch (error) {
            console.error('Error generating signed documents:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * REAL Annual Report Filing
     */
    async fileAnnualReport(companyData) {
        try {
            const { state, ein, businessName, registeredAgent } = companyData;

            let result;

            // Use direct state API if available
            if (this.stateAPIs[state]) {
                result = await this.stateAPIs[state].fileAnnualReport(companyData);
            } else {
                // Use third-party service
                result = await this.filingServices.websiteCorp.fileAnnualReport(companyData);
            }

            return {
                success: true,
                confirmationNumber: result.confirmationNumber,
                filingDate: result.filingDate,
                dueDate: result.nextDueDate,
                cost: result.cost,
                receiptUrl: result.receiptUrl
            };

        } catch (error) {
            console.error('Error filing annual report:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Query license database (SBA, state databases)
     */
    async queryLicenseDatabase(businessType, state, city, county) {
        try {
            const queries = [];

            // Query SBA License & Permit tool
            queries.push(this.querySBALicenses(businessType, state, city));

            // Query state-specific license databases
            if (this.stateAPIs[state] && this.stateAPIs[state].getLicenseRequirements) {
                queries.push(this.stateAPIs[state].getLicenseRequirements(businessType, city, county));
            }

            const results = await Promise.all(queries);
            
            // Combine and deduplicate results
            const allLicenses = results.flat();
            const uniqueLicenses = this.deduplicateLicenses(allLicenses);

            return {
                licenses: uniqueLicenses,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error querying license database:', error);
            throw error;
        }
    }

    /**
     * Query SBA License & Permit tool
     */
    async querySBALicenses(businessType, state, city) {
        try {
            const response = await axios.get('https://www.sba.gov/api/license-permit', {
                params: {
                    business_type: businessType,
                    state: state,
                    city: city
                },
                headers: {
                    'User-Agent': 'CloudEsq-LLC-Formation-Engine/1.0'
                }
            });

            return response.data.licenses || [];

        } catch (error) {
            console.error('Error querying SBA licenses:', error);
            return [];
        }
    }

    /**
     * Deduplicate license results
     */
    deduplicateLicenses(licenses) {
        const seen = new Set();
        return licenses.filter(license => {
            const key = `${license.name}-${license.authority}-${license.level}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Generate DocuSign envelope for document signing
     */
    async generateDocuSignEnvelope(documentData) {
        try {
            const docuSignAPI = new DocuSignAPI(process.env.DOCUSIGN_API_KEY);
            
            return await docuSignAPI.createEnvelope({
                documents: documentData.documents,
                signers: documentData.signers,
                emailSubject: `LLC Formation Documents - ${documentData.businessName}`,
                emailMessage: 'Please sign the attached LLC formation documents.'
            });

        } catch (error) {
            console.error('Error generating DocuSign envelope:', error);
            throw error;
        }
    }

    /**
     * Get real-time filing status updates
     */
    async subscribeToFilingUpdates(filingId, state, webhookUrl) {
        try {
            let result;

            // Use direct state API if available
            if (this.stateAPIs[state] && this.stateAPIs[state].subscribeToUpdates) {
                result = await this.stateAPIs[state].subscribeToUpdates(filingId, webhookUrl);
            } else {
                // Use third-party service
                result = await this.filingServices.incFile.subscribeToUpdates(filingId, webhookUrl);
            }

            return {
                success: true,
                subscriptionId: result.subscriptionId,
                webhookUrl: result.webhookUrl
            };

        } catch (error) {
            console.error('Error subscribing to filing updates:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default StateFilingAPIIntegration;