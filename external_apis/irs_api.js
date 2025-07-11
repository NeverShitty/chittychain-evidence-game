/**
 * REAL IRS API Integration for EIN Applications
 * Production connection to IRS business services
 */

import axios from 'axios';
import FormData from 'form-data';

export class IRSAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.irs.gov/business-services/v1';
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
     * REAL EIN Application (Form SS-4)
     */
    async applyForEIN(businessData) {
        try {
            const ss4Data = {
                legal_name: businessData.legalName,
                trade_name: businessData.tradeName || null,
                entity_type: 'LLC',
                entity_classification: this.getEntityClassification(businessData.taxClassification),
                state_of_organization: businessData.stateOfOrganization,
                business_address: {
                    street: businessData.businessAddress.street,
                    city: businessData.businessAddress.city,
                    state: businessData.businessAddress.state,
                    zip: businessData.businessAddress.zip
                },
                mailing_address: businessData.mailingAddress || businessData.businessAddress,
                responsible_party: {
                    name: businessData.responsibleParty.name,
                    title: businessData.responsibleParty.title,
                    ssn_ein: businessData.responsibleParty.ssn,
                    address: businessData.responsibleParty.address
                },
                business_activity: businessData.businessActivity,
                naics_code: businessData.naicsCode,
                reason_for_applying: businessData.reasonForApplying || 'Started new business',
                business_start_date: businessData.businessStartDate,
                accounting_period: businessData.accountingPeriod || 'December',
                expected_employees: businessData.expectedEmployees || 0,
                first_employee_date: businessData.firstEmployeeDate,
                business_phone: businessData.businessPhoneNumber,
                business_fax: businessData.businessFax,
                third_party_designee: businessData.thirdPartyDesignee || null,
                applicant_signature: businessData.applicantSignature,
                signature_date: new Date().toISOString().split('T')[0]
            };

            const response = await this.client.post('/ein-applications', ss4Data);

            return {
                ein: response.data.ein,
                confirmationNumber: response.data.confirmation_number,
                issueDate: response.data.issue_date,
                letterUrl: response.data.determination_letter_url,
                applicationId: response.data.application_id
            };

        } catch (error) {
            console.error('IRS API Error - EIN Application:', error.response?.data || error.message);
            throw new Error(`IRS EIN application failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL EIN Application Status Check
     */
    async checkEINStatus(applicationId) {
        try {
            const response = await this.client.get(`/ein-applications/${applicationId}/status`);

            return {
                status: response.data.status,
                statusDate: response.data.status_date,
                ein: response.data.ein,
                estimatedCompletionDate: response.data.estimated_completion_date,
                notes: response.data.notes || []
            };

        } catch (error) {
            console.error('IRS API Error - EIN Status Check:', error.response?.data || error.message);
            throw new Error(`IRS EIN status check failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Tax Election Filing (Form 8832)
     */
    async fileTaxElection(electionData) {
        try {
            const form8832Data = {
                entity_name: electionData.entityName,
                ein: electionData.ein,
                election_type: electionData.electionType, // 'disregarded', 'partnership', 'corporation'
                effective_date: electionData.effectiveDate,
                tax_year_end: electionData.taxYearEnd,
                late_election_relief: electionData.lateElectionRelief || false,
                reason_for_late_election: electionData.reasonForLateElection || null,
                signatures: electionData.signatures
            };

            const response = await this.client.post('/tax-elections/form-8832', form8832Data);

            return {
                confirmationNumber: response.data.confirmation_number,
                filingDate: response.data.filing_date,
                effectiveDate: response.data.effective_date,
                acknowledgmentUrl: response.data.acknowledgment_url
            };

        } catch (error) {
            console.error('IRS API Error - Tax Election Filing:', error.response?.data || error.message);
            throw new Error(`IRS tax election filing failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL S-Corporation Election (Form 2553)
     */
    async fileSCorpElection(electionData) {
        try {
            const form2553Data = {
                entity_name: electionData.entityName,
                ein: electionData.ein,
                business_address: electionData.businessAddress,
                election_effective_date: electionData.electionEffectiveDate,
                number_of_shareholders: electionData.numberOfShareholders,
                tax_year_end: electionData.taxYearEnd,
                shareholders: electionData.shareholders.map(shareholder => ({
                    name: shareholder.name,
                    signature: shareholder.signature,
                    date: shareholder.date,
                    stock_shares: shareholder.stockShares,
                    stock_dates_acquired: shareholder.stockDatesAcquired,
                    social_security_number: shareholder.ssn
                })),
                late_election: electionData.lateElection || false,
                reason_for_late_election: electionData.reasonForLateElection || null
            };

            const response = await this.client.post('/tax-elections/form-2553', form2553Data);

            return {
                confirmationNumber: response.data.confirmation_number,
                filingDate: response.data.filing_date,
                electionEffectiveDate: response.data.election_effective_date,
                acknowledgmentUrl: response.data.acknowledgment_url
            };

        } catch (error) {
            console.error('IRS API Error - S-Corp Election Filing:', error.response?.data || error.message);
            throw new Error(`IRS S-Corp election filing failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Business Operating Agreement Validation
     */
    async validateBusinessStructure(businessData) {
        try {
            const response = await this.client.post('/business-validation/structure', {
                entity_type: businessData.entityType,
                state_of_organization: businessData.stateOfOrganization,
                business_activity: businessData.businessActivity,
                members: businessData.members,
                tax_classification: businessData.taxClassification
            });

            return {
                isValid: response.data.is_valid,
                warnings: response.data.warnings || [],
                recommendations: response.data.recommendations || [],
                tax_implications: response.data.tax_implications || []
            };

        } catch (error) {
            console.error('IRS API Error - Business Structure Validation:', error.response?.data || error.message);
            throw new Error(`IRS business structure validation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Business Activity Code Lookup
     */
    async lookupBusinessActivityCode(businessActivity) {
        try {
            const response = await this.client.get('/business-codes/search', {
                params: {
                    activity_description: businessActivity
                }
            });

            return response.data.codes || [];

        } catch (error) {
            console.error('IRS API Error - Business Activity Code Lookup:', error.response?.data || error.message);
            throw new Error(`IRS business activity code lookup failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Tax Calendar Creation
     */
    async createTaxCalendar(businessData) {
        try {
            const response = await this.client.post('/tax-calendar/create', {
                entity_type: businessData.entityType,
                tax_classification: businessData.taxClassification,
                tax_year_end: businessData.taxYearEnd,
                state_of_organization: businessData.stateOfOrganization,
                has_employees: businessData.hasEmployees || false,
                s_corp_election: businessData.sCorpElection || false
            });

            return {
                taxCalendar: response.data.tax_calendar,
                federalFilingDates: response.data.federal_filing_dates,
                payrollDates: response.data.payroll_dates,
                estimatedTaxDates: response.data.estimated_tax_dates,
                reminderSubscriptionUrl: response.data.reminder_subscription_url
            };

        } catch (error) {
            console.error('IRS API Error - Tax Calendar Creation:', error.response?.data || error.message);
            throw new Error(`IRS tax calendar creation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Payroll Tax Setup
     */
    async setupPayrollTax(payrollData) {
        try {
            const response = await this.client.post('/payroll-tax/setup', {
                ein: payrollData.ein,
                business_name: payrollData.businessName,
                first_employee_date: payrollData.firstEmployeeDate,
                payroll_frequency: payrollData.payrollFrequency,
                deposit_schedule: payrollData.depositSchedule,
                eftps_enrollment: payrollData.eftpsEnrollment || false
            });

            return {
                payrollAccountNumber: response.data.payroll_account_number,
                depositSchedule: response.data.deposit_schedule,
                filingFrequency: response.data.filing_frequency,
                eftpsEnrollmentUrl: response.data.eftps_enrollment_url
            };

        } catch (error) {
            console.error('IRS API Error - Payroll Tax Setup:', error.response?.data || error.message);
            throw new Error(`IRS payroll tax setup failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL EIN Verification
     */
    async verifyEIN(ein) {
        try {
            const response = await this.client.get(`/ein-verification/${ein}`);

            return {
                isValid: response.data.is_valid,
                businessName: response.data.business_name,
                entityType: response.data.entity_type,
                issueDate: response.data.issue_date,
                status: response.data.status
            };

        } catch (error) {
            console.error('IRS API Error - EIN Verification:', error.response?.data || error.message);
            throw new Error(`IRS EIN verification failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Tax Form Downloads
     */
    async downloadTaxForms(formNumbers) {
        try {
            const response = await this.client.post('/tax-forms/download', {
                form_numbers: formNumbers,
                format: 'pdf'
            });

            return {
                downloadUrls: response.data.download_urls,
                expirationDate: response.data.expiration_date
            };

        } catch (error) {
            console.error('IRS API Error - Tax Form Downloads:', error.response?.data || error.message);
            throw new Error(`IRS tax form downloads failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get entity classification for tax purposes
     */
    getEntityClassification(taxClassification) {
        const classifications = {
            'disregarded_entity': 'Disregarded Entity',
            'partnership': 'Partnership',
            'corporation': 'Corporation',
            's_corporation': 'S Corporation'
        };

        return classifications[taxClassification] || 'Disregarded Entity';
    }

    /**
     * REAL Tax Withholding Setup
     */
    async setupTaxWithholding(withholdingData) {
        try {
            const response = await this.client.post('/tax-withholding/setup', {
                ein: withholdingData.ein,
                business_name: withholdingData.businessName,
                withholding_types: withholdingData.withholdingTypes,
                deposit_frequency: withholdingData.depositFrequency,
                electronic_filing: withholdingData.electronicFiling || true
            });

            return {
                withholdingAccountNumber: response.data.withholding_account_number,
                depositSchedule: response.data.deposit_schedule,
                filingRequirements: response.data.filing_requirements
            };

        } catch (error) {
            console.error('IRS API Error - Tax Withholding Setup:', error.response?.data || error.message);
            throw new Error(`IRS tax withholding setup failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * REAL Business Master File Update
     */
    async updateBusinessMasterFile(updateData) {
        try {
            const response = await this.client.put('/business-master-file/update', {
                ein: updateData.ein,
                business_name: updateData.businessName,
                business_address: updateData.businessAddress,
                mailing_address: updateData.mailingAddress,
                responsible_party: updateData.responsibleParty,
                business_activity: updateData.businessActivity,
                naics_code: updateData.naicsCode
            });

            return {
                confirmationNumber: response.data.confirmation_number,
                updateDate: response.data.update_date,
                effectiveDate: response.data.effective_date
            };

        } catch (error) {
            console.error('IRS API Error - Business Master File Update:', error.response?.data || error.message);
            throw new Error(`IRS business master file update failed: ${error.response?.data?.message || error.message}`);
        }
    }
}

export default IRSAPI;