/**
 * REAL IncFile API Integration
 * Production connection to IncFile's business formation services
 */

import axios from 'axios';
import FormData from 'form-data';

export class IncFileAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.incfile.com/v1';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'CloudEsq-LLC-Formation/1.0'
            }
        });
    }

    /**
     * REAL Business Name Availability Check
     */
    async checkNameAvailability(businessName, state) {
        try {
            const response = await this.client.post('/business-names/check', {
                business_name: businessName,
                state: state,
                entity_type: 'LLC'
            });

            return {
                available: response.data.available,
                alternatives: response.data.alternatives || [],
                restrictions: response.data.restrictions || []
            };

        } catch (error) {
            console.error('IncFile API Error - Name Check:', error.response?.data || error.message);
            throw new Error(`IncFile name check failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Business Name Reservation
     */
    async reserveName(businessName, state, duration = 120) {
        try {
            const response = await this.client.post('/business-names/reserve', {
                business_name: businessName,
                state: state,
                duration_days: duration,
                entity_type: 'LLC'
            });

            return {
                reservationId: response.data.reservation_id,
                confirmationNumber: response.data.confirmation_number,
                expirationDate: response.data.expiration_date,
                cost: response.data.cost
            };

        } catch (error) {
            console.error('IncFile API Error - Name Reservation:', error.response?.data || error.message);
            throw new Error(`IncFile name reservation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Articles of Organization Filing
     */
    async fileArticlesOfOrganization(formationData) {
        try {
            const filingData = {
                entity_type: 'LLC',
                business_name: formationData.businessName,
                state: formationData.state,
                registered_agent: {
                    name: formationData.registeredAgent.name,
                    address: formationData.registeredAgent.address
                },
                organizer: {
                    name: formationData.organizer.name,
                    address: formationData.organizer.address
                },
                purpose: formationData.purpose || 'To engage in any lawful business activity',
                duration: formationData.duration || 'Perpetual',
                management_structure: formationData.managementStructure || 'Member-managed',
                members: formationData.members || [],
                expedited: formationData.expedited || false,
                payment_method: formationData.paymentMethod || 'credit_card',
                billing_address: formationData.billingAddress
            };

            const response = await this.client.post('/formations/llc', filingData);

            return {
                filingId: response.data.filing_id,
                filingNumber: response.data.filing_number,
                status: response.data.status,
                filingDate: response.data.filing_date,
                effectiveDate: response.data.effective_date,
                cost: response.data.total_cost,
                trackingUrl: response.data.tracking_url
            };

        } catch (error) {
            console.error('IncFile API Error - Articles Filing:', error.response?.data || error.message);
            throw new Error(`IncFile articles filing failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Filing Status Tracking
     */
    async getFilingStatus(filingId) {
        try {
            const response = await this.client.get(`/formations/${filingId}/status`);

            return {
                status: response.data.status,
                statusDate: response.data.status_date,
                filingDate: response.data.filing_date,
                effectiveDate: response.data.effective_date,
                certificateUrl: response.data.certificate_url,
                notes: response.data.notes || []
            };

        } catch (error) {
            console.error('IncFile API Error - Filing Status:', error.response?.data || error.message);
            throw new Error(`IncFile filing status check failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Payment Processing
     */
    async processPayment(paymentData) {
        try {
            const response = await this.client.post('/payments/process', {
                filing_id: paymentData.filingId,
                amount: paymentData.amount,
                payment_method: paymentData.paymentMethod,
                card_token: paymentData.cardToken,
                billing_address: paymentData.billingAddress
            });

            return {
                transactionId: response.data.transaction_id,
                confirmationNumber: response.data.confirmation_number,
                receiptUrl: response.data.receipt_url,
                status: response.data.status
            };

        } catch (error) {
            console.error('IncFile API Error - Payment Processing:', error.response?.data || error.message);
            throw new Error(`IncFile payment processing failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Registered Agent Services
     */
    async getRegisteredAgentServices(state) {
        try {
            const response = await this.client.get('/registered-agents/services', {
                params: { state: state }
            });

            return response.data.services || [];

        } catch (error) {
            console.error('IncFile API Error - Registered Agent Services:', error.response?.data || error.message);
            throw new Error(`IncFile registered agent services failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL EIN Application Service
     */
    async applyForEIN(businessData) {
        try {
            const response = await this.client.post('/tax-services/ein', {
                business_name: businessData.businessName,
                trade_name: businessData.tradeName,
                entity_type: 'LLC',
                state_of_organization: businessData.state,
                business_address: businessData.businessAddress,
                mailing_address: businessData.mailingAddress,
                responsible_party: businessData.responsibleParty,
                business_activity: businessData.businessActivity,
                reason_for_applying: businessData.reasonForApplying,
                first_employee_date: businessData.firstEmployeeDate,
                business_phone: businessData.businessPhoneNumber
            });

            return {
                ein: response.data.ein,
                confirmationNumber: response.data.confirmation_number,
                issueDate: response.data.issue_date,
                letterUrl: response.data.letter_url
            };

        } catch (error) {
            console.error('IncFile API Error - EIN Application:', error.response?.data || error.message);
            throw new Error(`IncFile EIN application failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Annual Report Filing
     */
    async fileAnnualReport(companyData) {
        try {
            const response = await this.client.post('/annual-reports/file', {
                company_id: companyData.companyId,
                business_name: companyData.businessName,
                state: companyData.state,
                registered_agent: companyData.registeredAgent,
                business_address: companyData.businessAddress,
                members: companyData.members,
                managers: companyData.managers
            });

            return {
                confirmationNumber: response.data.confirmation_number,
                filingDate: response.data.filing_date,
                nextDueDate: response.data.next_due_date,
                cost: response.data.cost,
                receiptUrl: response.data.receipt_url
            };

        } catch (error) {
            console.error('IncFile API Error - Annual Report Filing:', error.response?.data || error.message);
            throw new Error(`IncFile annual report filing failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL State Fee Calculation
     */
    async calculateFees(state, services = []) {
        try {
            const response = await this.client.post('/fees/calculate', {
                state: state,
                entity_type: 'LLC',
                services: services
            });

            return {
                filingFee: response.data.filing_fee,
                nameReservationFee: response.data.name_reservation_fee,
                expediteFee: response.data.expedite_fee,
                certifiedCopyFee: response.data.certified_copy_fee,
                registeredAgentFee: response.data.registered_agent_fee,
                totalStateFees: response.data.total_state_fees,
                serviceFees: response.data.service_fees,
                totalFees: response.data.total_fees
            };

        } catch (error) {
            console.error('IncFile API Error - Fee Calculation:', error.response?.data || error.message);
            throw new Error(`IncFile fee calculation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Document Generation
     */
    async generateDocuments(documentData) {
        try {
            const response = await this.client.post('/documents/generate', {
                document_type: documentData.documentType,
                business_data: documentData.businessData,
                template_id: documentData.templateId,
                format: documentData.format || 'pdf'
            });

            return {
                documentId: response.data.document_id,
                downloadUrl: response.data.download_url,
                signatureRequired: response.data.signature_required,
                signingUrl: response.data.signing_url
            };

        } catch (error) {
            console.error('IncFile API Error - Document Generation:', error.response?.data || error.message);
            throw new Error(`IncFile document generation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Webhook Subscription for Filing Updates
     */
    async subscribeToUpdates(filingId, webhookUrl) {
        try {
            const response = await this.client.post('/webhooks/subscribe', {
                filing_id: filingId,
                webhook_url: webhookUrl,
                events: ['status_change', 'document_ready', 'filing_complete']
            });

            return {
                subscriptionId: response.data.subscription_id,
                webhookUrl: response.data.webhook_url
            };

        } catch (error) {
            console.error('IncFile API Error - Webhook Subscription:', error.response?.data || error.message);
            throw new Error(`IncFile webhook subscription failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Company Search
     */
    async searchCompany(businessName, state) {
        try {
            const response = await this.client.get('/companies/search', {
                params: {
                    business_name: businessName,
                    state: state
                }
            });

            return response.data.companies || [];

        } catch (error) {
            console.error('IncFile API Error - Company Search:', error.response?.data || error.message);
            throw new Error(`IncFile company search failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Compliance Calendar
     */
    async getComplianceCalendar(companyId) {
        try {
            const response = await this.client.get(`/compliance/${companyId}/calendar`);

            return {
                upcomingFilings: response.data.upcoming_filings || [],
                annualReportDue: response.data.annual_report_due,
                taxFilingDue: response.data.tax_filing_due,
                licenseRenewals: response.data.license_renewals || [],
                complianceScore: response.data.compliance_score
            };

        } catch (error) {
            console.error('IncFile API Error - Compliance Calendar:', error.response?.data || error.message);
            throw new Error(`IncFile compliance calendar failed: ${error.response?.data?.message || error.message}`);
        }
    }
}

export default IncFileAPI;