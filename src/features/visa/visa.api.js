import { apiClient, withMock } from '../../services/apiClient'

/**
 * Visa module data layer.
 *
 * Everything the spec calls "configuration-driven" lives here as plain demo
 * data: countries, visa types + pricing, checklists, status configs, SMS
 * templates. Admin edits mutate these stores for the session (demo stores
 * reset on reload); when a real backend exists the second argument of each
 * withMock call takes over.
 */

const clone = (value) => JSON.parse(JSON.stringify(value))
const nextId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`

/* ── Countries (spec #1) ─────────────────────────────────── */

const DEMO_COUNTRIES = [
  { id: 'vcn', name: 'China', code: 'CN', flag: '🇨🇳', description: 'Tourist, business and student visa processing with embassy appointment support.', status: 'active', displayOrder: 1 },
  { id: 'vae', name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', description: 'Dubai and Abu Dhabi tourist visas, express processing available.', status: 'active', displayOrder: 2 },
  { id: 'vmy', name: 'Malaysia', code: 'MY', flag: '🇲🇾', description: 'eVisa and embassy visa processing for Malaysian destinations.', status: 'active', displayOrder: 3 },
  { id: 'vfr', name: 'Schengen (France)', code: 'FR', flag: '🇫🇷', description: 'Schengen short-stay visas via VFS France with appointment scheduling.', status: 'active', displayOrder: 4 },
  { id: 'vgb', name: 'United Kingdom', code: 'GB', flag: '🇬🇧', description: 'UK standard visitor visas. Service temporarily paused.', status: 'paused', displayOrder: 5 },
  { id: 'vau', name: 'Australia', code: 'AU', flag: '🇦🇺', description: 'Visitor visa (subclass 600) processing.', status: 'paused', displayOrder: 6 },
  { id: 'vsg', name: 'Singapore', code: 'SG', flag: '🇸🇬', description: 'Singapore visa processing — physical passport submission required.', status: 'active', displayOrder: 7 },
  { id: 'vth', name: 'Thailand', code: 'TH', flag: '🇹🇭', description: 'Thailand eVisa — fully online processing, no physical passport needed.', status: 'active', displayOrder: 8 },
]

/* ── Visa types + pricing (spec #2, #3, #4) ──────────────── */

const DEMO_VISA_TYPES = [
  {
    id: 'vt_cn_tourist', countryId: 'vcn', name: 'Tourist Visa',
    description: 'Single-entry tourist visa for sightseeing and family visits.',
    processingTime: '5–7 working days', entries: 'single', currency: 'BDT',
    b2cPrice: 12000, b2bNetPrice: 10000, fees: { embassy: 8500, service: 3000, vat: 500 },
    terms: 'Non-refundable once submitted to the embassy. Passport must be valid for at least 6 months.',
    status: 'active', validFrom: '2026-10-01',
  },
  {
    id: 'vt_cn_business', countryId: 'vcn', name: 'Business Visa',
    description: 'Business meetings, trade fairs and corporate visits.',
    processingTime: '7–10 working days', entries: 'single', currency: 'BDT',
    b2cPrice: 18000, b2bNetPrice: 15000, fees: { embassy: 12000, service: 5000, vat: 1000 },
    terms: 'Invitation letter from a Chinese company is mandatory.',
    status: 'active', validFrom: '2026-10-01',
  },
  {
    id: 'vt_ae_tourist', countryId: 'vae', name: 'Tourist Visa',
    description: '30-day Dubai tourist visa, express option available.',
    processingTime: '3–4 working days', entries: 'single', currency: 'BDT',
    b2cPrice: 6500, b2bNetPrice: 5200, fees: { embassy: 4200, service: 2000, vat: 300 },
    terms: 'Overstay fines are payable by the applicant.',
    status: 'paused', validFrom: '2026-09-15',
  },
  {
    id: 'vt_ae_business', countryId: 'vae', name: 'Business Visa',
    description: '14-day business visa for trade visitors.',
    processingTime: '3–5 working days', entries: 'single', currency: 'BDT',
    b2cPrice: 7800, b2bNetPrice: 6400, fees: { embassy: 5000, service: 2400, vat: 400 },
    terms: 'Company trade license copy of the inviting party required.',
    status: 'active', validFrom: '2026-09-15',
  },
  {
    id: 'vt_my_tourist', countryId: 'vmy', name: 'Tourist Visa',
    description: 'Malaysia eVisa, fully online processing.',
    processingTime: '2–3 working days', entries: 'single', currency: 'BDT',
    b2cPrice: 4500, b2bNetPrice: 3600, fees: { embassy: 2800, service: 1500, vat: 200 },
    terms: 'Digital copy of passport is sufficient; no embassy visit.',
    status: 'active', validFrom: '2026-10-01',
  },
  {
    id: 'vt_fr_tourist', countryId: 'vfr', name: 'Tourist Visa',
    description: 'France short-stay Schengen visa with VFS appointment.',
    processingTime: '10–15 working days', entries: 'multiple', currency: 'BDT',
    b2cPrice: 14500, b2bNetPrice: 12500, fees: { embassy: 9500, service: 4200, vat: 800 },
    terms: 'Travel insurance with €30,000 medical cover is mandatory.',
    status: 'active', validFrom: '2026-10-01',
  },
  {
    id: 'vt_fr_business', countryId: 'vfr', name: 'Business Visa',
    description: 'France business Schengen visa with invitation support.',
    processingTime: '10–15 working days', entries: 'multiple', currency: 'BDT',
    b2cPrice: 16000, b2bNetPrice: 14000, fees: { embassy: 10500, service: 4500, vat: 1000 },
    terms: 'Invitation letter and company bank statement required.',
    status: 'active', validFrom: '2026-10-01',
  },
  {
    id: 'vt_gb_tourist', countryId: 'vgb', name: 'Tourist Visa',
    description: 'Six-month standard visitor visa.',
    processingTime: '15–20 working days', entries: 'multiple', currency: 'BDT',
    b2cPrice: 18500, b2bNetPrice: 16000, fees: { embassy: 13000, service: 4500, vat: 1000 },
    terms: 'Biometrics appointment at the UK visa centre is required.',
    status: 'paused', validFrom: '2026-08-01',
  },
  {
    id: 'vt_sg_tourist', countryId: 'vsg', name: 'Tourist Visa',
    description: 'Singapore tourist visa with embassy submission of the original passport.',
    processingTime: '3–5 working days', entries: 'single', currency: 'BDT',
    b2cPrice: 8500, b2bNetPrice: 7000, fees: { embassy: 5500, service: 2600, vat: 400 },
    terms: 'Original passport must be submitted to the visa centre.',
    status: 'active', validFrom: '2026-10-01',
  },
  {
    id: 'vt_th_tourist', countryId: 'vth', name: 'Tourist Visa',
    description: 'Thailand eVisa — documents are processed fully online.',
    processingTime: '3–7 working days', entries: 'single', currency: 'BDT',
    b2cPrice: 5500, b2bNetPrice: 4500, fees: { embassy: 3500, service: 1700, vat: 300 },
    terms: 'No physical passport submission; visa is issued electronically.',
    status: 'active', validFrom: '2026-10-01',
  },
]

/* ── Passport handling configuration (country/visa-type-wise, spec #2/#7) ── */
// Seeds declare their own values; anything missing falls back to online processing.
const PASSPORT_CONFIG_SEED = {
  vt_cn_tourist: { passportRequirement: 'physical_required', pickupAvailable: true, officeSubmissionAvailable: true },
  vt_cn_business: { passportRequirement: 'physical_required', pickupAvailable: true, officeSubmissionAvailable: true },
  vt_ae_tourist: { passportRequirement: 'physical_required', pickupAvailable: true, officeSubmissionAvailable: true },
  vt_ae_business: { passportRequirement: 'physical_required', pickupAvailable: true, officeSubmissionAvailable: true },
  vt_my_tourist: { passportRequirement: 'online_processing', pickupAvailable: false, officeSubmissionAvailable: false },
  vt_fr_tourist: { passportRequirement: 'physical_required', pickupAvailable: false, officeSubmissionAvailable: true },
  vt_fr_business: { passportRequirement: 'physical_required', pickupAvailable: false, officeSubmissionAvailable: true },
  vt_gb_tourist: { passportRequirement: 'physical_required', pickupAvailable: false, officeSubmissionAvailable: true },
  vt_sg_tourist: { passportRequirement: 'physical_required', pickupAvailable: true, officeSubmissionAvailable: true },
  vt_th_tourist: { passportRequirement: 'online_processing', pickupAvailable: false, officeSubmissionAvailable: false },
}

/* ── Country-wise dynamic checklists (spec #5) ───────────── */

const DEFAULT_CHECKLIST_ITEMS = [
  { label: 'Passport (valid at least 6 months)', requirement: 'required' },
  { label: 'Recent Passport-size Photograph', requirement: 'required' },
  { label: 'Bank Statement (last 6 months)', requirement: 'required' },
]

const DEMO_CHECKLISTS = [
  {
    id: 'vcl_1', countryId: 'vcn', visaTypeId: 'vt_cn_tourist', applicantType: 'individual',
    items: [
      { id: 'vci_1', label: 'Passport (valid at least 6 months)', requirement: 'required', active: true },
      { id: 'vci_2', label: 'Recent Passport-size Photograph', requirement: 'required', active: true },
      { id: 'vci_3', label: 'Bank Statement (last 6 months)', requirement: 'required', active: true },
      { id: 'vci_4', label: 'Bank Solvency Certificate', requirement: 'required', active: true },
      { id: 'vci_5', label: 'Hotel Booking', requirement: 'required', active: true },
      { id: 'vci_6', label: 'Flight Ticket (reservation)', requirement: 'required', active: true },
      { id: 'vci_7', label: 'Sponsor Letter', requirement: 'optional', active: true },
    ],
  },
  {
    id: 'vcl_2', countryId: 'vcn', visaTypeId: 'vt_cn_tourist', applicantType: 'business',
    items: [
      { id: 'vci_8', label: 'Passport (valid at least 6 months)', requirement: 'required', active: true },
      { id: 'vci_9', label: 'Recent Passport-size Photograph', requirement: 'required', active: true },
      { id: 'vci_10', label: 'Visiting Card', requirement: 'required', active: true },
      { id: 'vci_11', label: 'Trade License', requirement: 'required', active: true },
      { id: 'vci_12', label: 'Bank Statement (company, last 6 months)', requirement: 'required', active: true },
      { id: 'vci_13', label: 'Invitation Letter (Chinese company)', requirement: 'required', active: true },
    ],
  },
  {
    id: 'vcl_3', countryId: 'vcn', visaTypeId: 'vt_cn_tourist', applicantType: 'employee',
    items: [
      { id: 'vci_14', label: 'Passport (valid at least 6 months)', requirement: 'required', active: true },
      { id: 'vci_15', label: 'Recent Passport-size Photograph', requirement: 'required', active: true },
      { id: 'vci_16', label: 'NOC (No Objection Certificate)', requirement: 'required', active: true },
      { id: 'vci_17', label: 'Office ID Card', requirement: 'required', active: true },
      { id: 'vci_18', label: 'Salary Certificate / Pay Slip', requirement: 'required', active: true },
      { id: 'vci_19', label: 'Bank Statement (personal, last 6 months)', requirement: 'required', active: true },
    ],
  },
  {
    id: 'vcl_4', countryId: 'vfr', visaTypeId: 'vt_fr_tourist', applicantType: 'individual',
    items: [
      { id: 'vci_20', label: 'Passport (valid at least 3 months after return)', requirement: 'required', active: true },
      { id: 'vci_21', label: 'Recent Passport-size Photograph (white background)', requirement: 'required', active: true },
      { id: 'vci_22', label: 'Travel Insurance (€30,000 cover)', requirement: 'required', active: true },
      { id: 'vci_23', label: 'Flight Reservation', requirement: 'required', active: true },
      { id: 'vci_24', label: 'Hotel Booking', requirement: 'required', active: true },
      { id: 'vci_25', label: 'Bank Statement (last 6 months)', requirement: 'required', active: true },
      { id: 'vci_26', label: 'Cover Letter', requirement: 'required', active: true },
      { id: 'vci_27', label: 'NOC (if employed)', requirement: 'conditional', active: true },
    ],
  },
  {
    id: 'vcl_5', countryId: 'vae', visaTypeId: 'vt_ae_tourist', applicantType: 'individual',
    items: [
      { id: 'vci_28', label: 'Passport (valid at least 6 months)', requirement: 'required', active: true },
      { id: 'vci_29', label: 'Recent Passport-size Photograph (white background)', requirement: 'required', active: true },
      { id: 'vci_30', label: 'Bank Statement (last 3 months)', requirement: 'required', active: true },
      { id: 'vci_31', label: 'Confirmed Flight Ticket', requirement: 'required', active: true },
      { id: 'vci_32', label: 'Hotel Booking', requirement: 'optional', active: true },
    ],
  },
  {
    id: 'vcl_6', countryId: 'vsg', visaTypeId: 'vt_sg_tourist', applicantType: 'individual',
    items: [
      { id: 'vci_33', label: 'Passport (valid at least 6 months)', requirement: 'required', active: true, submissionMode: 'both' },
      { id: 'vci_34', label: 'Passport Copy', requirement: 'required', active: true },
      { id: 'vci_35', label: 'Recent Passport-size Photograph', requirement: 'required', active: true },
      { id: 'vci_36', label: 'Bank Statement (last 3 months)', requirement: 'required', active: true },
      { id: 'vci_37', label: 'Hotel Booking', requirement: 'required', active: true },
      { id: 'vci_38', label: 'Flight Information', requirement: 'required', active: true },
      { id: 'vci_39', label: 'Additional Supporting Documents', requirement: 'optional', active: true },
    ],
  },
  {
    id: 'vcl_7', countryId: 'vth', visaTypeId: 'vt_th_tourist', applicantType: 'individual',
    items: [
      { id: 'vci_40', label: 'Passport Copy (valid at least 6 months)', requirement: 'required', active: true },
      { id: 'vci_41', label: 'Recent Passport-size Photograph', requirement: 'required', active: true },
      { id: 'vci_42', label: 'Bank Statement (last 3 months)', requirement: 'required', active: true },
      { id: 'vci_43', label: 'Hotel Booking', requirement: 'required', active: true },
      { id: 'vci_44', label: 'Flight Information', requirement: 'required', active: true },
    ],
  },
]

/* ── Status configuration (spec #14) ─────────────────────── */

const DEMO_STATUS_CONFIGS = [
  { id: 'vsc_1', key: 'submitted', displayName: 'Submitted', customerMessage: 'We have received your visa application.', internalDescription: 'Application created, awaiting document check.', category: 'in_progress', active: true, displayOrder: 10, isSystem: true },
  { id: 'vsc_2', key: 'under_review', displayName: 'Under Review', customerMessage: 'Your application is under review by our team.', internalDescription: 'Documents being verified against the checklist.', category: 'in_progress', active: true, displayOrder: 20, isSystem: true },
  { id: 'vsc_3', key: 'action_required', displayName: 'Action Required', customerMessage: 'Additional documents or information are required. Please check the request.', internalDescription: 'Waiting on the applicant to upload missing documents.', category: 'action_required', active: true, displayOrder: 30, isSystem: true },
  { id: 'vsc_4', key: 'documents_completed', displayName: 'Documents Completed', customerMessage: 'All requested documents have been received.', internalDescription: 'Applicant completed the pending request.', category: 'in_progress', active: true, displayOrder: 40, isSystem: true },
  { id: 'vsc_5', key: 'processing', displayName: 'Processing', customerMessage: 'Your visa is being processed.', internalDescription: 'File is being prepared for embassy submission.', category: 'in_progress', active: true, displayOrder: 50, isSystem: true },
  { id: 'vsc_6', key: 'submitted_to_embassy', displayName: 'Submitted to Embassy', customerMessage: 'Your application has been submitted to the embassy.', internalDescription: 'Embassy submission done, awaiting decision.', category: 'in_progress', active: true, displayOrder: 60, isSystem: true },
  { id: 'vsc_7', key: 'approved', displayName: 'Approved', customerMessage: 'Congratulations! Your visa has been approved.', internalDescription: 'Visa granted by the embassy.', category: 'success', active: true, displayOrder: 70, isSystem: true },
  { id: 'vsc_8', key: 'passport_ready', displayName: 'Passport Ready', customerMessage: 'Your passport is ready for collection from our office.', internalDescription: 'Passport returned with visa affixed.', category: 'success', active: true, displayOrder: 80, isSystem: true },
  { id: 'vsc_9', key: 'completed', displayName: 'Completed', customerMessage: 'Your visa application is complete. Thank you for travelling with us.', internalDescription: 'Delivered to the applicant.', category: 'success', active: true, displayOrder: 90, isSystem: true },
  { id: 'vsc_10', key: 'rejected', displayName: 'Rejected', customerMessage: 'Unfortunately your visa application was rejected. Please see the details.', internalDescription: 'Visa refused by the embassy.', category: 'failed', active: true, displayOrder: 100, isSystem: true },
  { id: 'vsc_11', key: 'cancelled', displayName: 'Cancelled', customerMessage: 'Your application has been cancelled.', internalDescription: 'Cancelled by applicant or admin.', category: 'cancelled', active: true, displayOrder: 110, isSystem: true },
  { id: 'vsc_12', key: 'passport_submitted', displayName: 'Passport Submitted', customerMessage: 'Your passport has been submitted to the embassy.', internalDescription: 'Custom status created by admin for China files.', category: 'in_progress', active: true, displayOrder: 65, isSystem: false },
]

/* ── Applications (spec #6–#10, #12, #13) ────────────────── */

const DEMO_APPLICATIONS = [
  {
    id: 'va_101', number: 'VISA-2026-000101', countryId: 'vcn', visaTypeId: 'vt_cn_tourist',
    country: 'China', visaType: 'Tourist Visa', channel: 'b2c', partner: null,
    applicant: { fullName: 'Rahim Ahmed', dob: '1992-04-18', gender: 'male', nationality: 'Bangladeshi', mobile: '+880 1712 556 340', email: 'rahim.ahmed@gmail.com', address: 'House 42, Road 7, Dhanmondi', city: 'Dhaka', applicantType: 'individual' },
    passport: { number: 'BR0912345', expiry: '2030-06-15', issueDate: '2020-06-16', issuingCountry: 'Bangladesh', type: 'ordinary' },
    status: 'under_review', assignedStaff: 'Priya Nair', submittedAt: '2026-09-28', updatedAt: '2026-10-04',
    price: { currency: 'BDT', b2c: 12000, b2b: 10000 },
    actionRequired: null, rejection: null,
    documents: [
      { id: 'vd_1', type: 'Passport Copy', name: 'passport-rahim.pdf', size: '2.1 MB', mime: 'application/pdf', uploadedBy: 'Rahim Ahmed', uploadedAt: '2026-09-28', status: 'verified', reviewNote: '' },
      { id: 'vd_2', type: 'Recent Passport-size Photograph', name: 'photo-rahim.jpg', size: '0.4 MB', mime: 'image/jpeg', uploadedBy: 'Rahim Ahmed', uploadedAt: '2026-09-28', status: 'verified', reviewNote: '' },
      { id: 'vd_3', type: 'Bank Statement (last 6 months)', name: 'bank-statement-sep.pdf', size: '5.8 MB', mime: 'application/pdf', uploadedBy: 'Rahim Ahmed', uploadedAt: '2026-09-28', status: 'pending', reviewNote: '' },
      { id: 'vd_4', type: 'Hotel Booking', name: 'hotel-beijing.pdf', size: '1.2 MB', mime: 'application/pdf', uploadedBy: 'Rahim Ahmed', uploadedAt: '2026-09-29', status: 'rejected', reviewNote: 'Booking dates do not match the travel plan.' },
    ],
    timeline: [
      { id: 'vtl_1', at: '2026-09-28T10:24', event: 'Application Submitted', message: 'Application VISA-2026-000101 submitted.', visibility: 'both', by: 'Rahim Ahmed' },
      { id: 'vtl_2', at: '2026-09-29T09:05', event: 'Assigned to Staff', message: 'Assigned to Priya Nair.', visibility: 'internal', by: 'System' },
      { id: 'vtl_3', at: '2026-10-02T14:40', event: 'Under Review', message: 'Document verification started.', visibility: 'both', by: 'Priya Nair' },
    ],
    internalNotes: [{ id: 'vn_1', at: '2026-10-02T14:42', by: 'Priya Nair', text: 'Bank solvency certificate still missing — call the applicant tomorrow.' }],
    customerNotes: [{ id: 'vn_2', at: '2026-09-28T10:30', by: 'Front desk', text: 'Thank you for applying! Your documents are being checked.' }],
  },
  {
    id: 'va_102', number: 'VISA-2026-000102', countryId: 'vcn', visaTypeId: 'vt_cn_business',
    country: 'China', visaType: 'Business Visa', channel: 'b2b', partner: 'ABC Travels',
    applicant: { fullName: 'Tom Becker', dob: '1985-11-02', gender: 'male', nationality: 'German', mobile: '+49 151 2233 4455', email: 'tom.becker@nimbuslabs.de', address: 'Friedrichstr. 12', city: 'Berlin', applicantType: 'business' },
    passport: { number: 'C0X4K82P1', expiry: '2031-01-20', issueDate: '2021-01-21', issuingCountry: 'Germany', type: 'ordinary' },
    status: 'action_required', assignedStaff: 'Priya Nair', submittedAt: '2026-09-22', updatedAt: '2026-10-03',
    price: { currency: 'BDT', b2c: 18000, b2b: 15000 },
    actionRequired: { message: 'Please upload the invitation letter from the Chinese company and your company trade license.', requestedAt: '2026-10-03', requestedBy: 'Priya Nair' },
    rejection: null,
    documents: [
      { id: 'vd_5', type: 'Passport Copy', name: 'passport-becker.pdf', size: '1.9 MB', mime: 'application/pdf', uploadedBy: 'ABC Travels', uploadedAt: '2026-09-22', status: 'verified', reviewNote: '' },
      { id: 'vd_6', type: 'Visiting Card', name: 'card-becker.jpg', size: '0.3 MB', mime: 'image/jpeg', uploadedBy: 'ABC Travels', uploadedAt: '2026-09-22', status: 'verified', reviewNote: '' },
      { id: 'vd_7', type: 'Bank Statement (company, last 6 months)', name: 'nimbus-bank.pdf', size: '4.4 MB', mime: 'application/pdf', uploadedBy: 'ABC Travels', uploadedAt: '2026-09-22', status: 'verified', reviewNote: '' },
    ],
    timeline: [
      { id: 'vtl_4', at: '2026-09-22T11:00', event: 'Application Submitted', message: 'Submitted by B2B partner ABC Travels.', visibility: 'both', by: 'ABC Travels' },
      { id: 'vtl_5', at: '2026-09-23T09:30', event: 'Assigned to Staff', message: 'Assigned to Priya Nair.', visibility: 'internal', by: 'System' },
      { id: 'vtl_6', at: '2026-10-03T16:15', event: 'Action Required', message: 'Requested invitation letter and trade license.', visibility: 'both', by: 'Priya Nair' },
    ],
    internalNotes: [{ id: 'vn_3', at: '2026-10-03T16:20', by: 'Priya Nair', text: 'Partner informed over WhatsApp as well. Deadline: 10 Oct.' }],
    customerNotes: [],
  },
  {
    id: 'va_103', number: 'VISA-2026-000103', countryId: 'vfr', visaTypeId: 'vt_fr_tourist',
    country: 'Schengen (France)', visaType: 'Schengen Tourist Visa', channel: 'b2c', partner: null,
    applicant: { fullName: 'Sara Ali', dob: '1996-07-09', gender: 'female', nationality: 'Bangladeshi', mobile: '+880 1977 402 118', email: 'sara.ali@outlook.com', address: 'Flat B4, Nikunja 2', city: 'Dhaka', applicantType: 'individual' },
    passport: { number: 'XQ1234567', expiry: '2029-03-10', issueDate: '2019-03-11', issuingCountry: 'Bangladesh', type: 'ordinary' },
    status: 'approved', assignedStaff: 'Daniel Osei', submittedAt: '2026-09-25', updatedAt: '2026-10-02',
    price: { currency: 'BDT', b2c: 14500, b2b: 12500 },
    actionRequired: null, rejection: null,
    documents: [
      { id: 'vd_8', type: 'Passport Copy', name: 'passport-sara.pdf', size: '2.0 MB', mime: 'application/pdf', uploadedBy: 'Sara Ali', uploadedAt: '2026-09-25', status: 'verified', reviewNote: '' },
      { id: 'vd_9', type: 'Travel Insurance (€30,000 cover)', name: 'insurance-sara.pdf', size: '0.8 MB', mime: 'application/pdf', uploadedBy: 'Sara Ali', uploadedAt: '2026-09-25', status: 'verified', reviewNote: '' },
      { id: 'vd_10', type: 'Flight Reservation', name: 'flight-cdg.pdf', size: '1.1 MB', mime: 'application/pdf', uploadedBy: 'Sara Ali', uploadedAt: '2026-09-25', status: 'verified', reviewNote: '' },
      { id: 'vd_11', type: 'Bank Statement (last 6 months)', name: 'bank-sara.pdf', size: '6.2 MB', mime: 'application/pdf', uploadedBy: 'Sara Ali', uploadedAt: '2026-09-25', status: 'verified', reviewNote: '' },
    ],
    timeline: [
      { id: 'vtl_7', at: '2026-09-25T09:12', event: 'Application Submitted', message: 'Application submitted online.', visibility: 'both', by: 'Sara Ali' },
      { id: 'vtl_8', at: '2026-09-26T10:00', event: 'Under Review', message: 'Verification completed, file prepared.', visibility: 'both', by: 'Daniel Osei' },
      { id: 'vtl_9', at: '2026-09-30T09:00', event: 'Submitted to Embassy', message: 'Submitted at VFS France, Dhaka.', visibility: 'both', by: 'Daniel Osei' },
      { id: 'vtl_10', at: '2026-10-02T15:30', event: 'Approved', message: 'Visa approved — 30 days multiple entry.', visibility: 'both', by: 'Daniel Osei' },
    ],
    internalNotes: [{ id: 'vn_4', at: '2026-10-02T15:35', by: 'Daniel Osei', text: 'SMS sent. Passport expected back from VFS on 6 Oct.' }],
    customerNotes: [{ id: 'vn_5', at: '2026-10-02T15:40', by: 'Daniel Osei', text: 'Congratulations! You can collect your passport from our Uttara office after 6 October.' }],
  },
  {
    id: 'va_104', number: 'VISA-2026-000104', countryId: 'vmy', visaTypeId: 'vt_my_tourist',
    country: 'Malaysia', visaType: 'Tourist Visa (eVisa)', channel: 'b2b', partner: 'Sunrise Tours',
    applicant: { fullName: 'Nina Roy', dob: '2000-01-25', gender: 'female', nationality: 'Bangladeshi', mobile: '+880 1811 990 220', email: 'nina.roy@gmail.com', address: 'Agrabad C/A', city: 'Chattogram', applicantType: 'individual' },
    passport: { number: 'EP7788990', expiry: '2028-11-30', issueDate: '2018-12-01', issuingCountry: 'Bangladesh', type: 'ordinary' },
    status: 'submitted', assignedStaff: null, submittedAt: '2026-09-30', updatedAt: '2026-09-30',
    price: { currency: 'BDT', b2c: 4500, b2b: 3600 },
    actionRequired: null, rejection: null,
    documents: [
      { id: 'vd_12', type: 'Passport Copy', name: 'passport-nina.pdf', size: '1.7 MB', mime: 'application/pdf', uploadedBy: 'Sunrise Tours', uploadedAt: '2026-09-30', status: 'pending', reviewNote: '' },
      { id: 'vd_13', type: 'Recent Passport-size Photograph', name: 'photo-nina.jpg', size: '0.5 MB', mime: 'image/jpeg', uploadedBy: 'Sunrise Tours', uploadedAt: '2026-09-30', status: 'pending', reviewNote: '' },
    ],
    timeline: [{ id: 'vtl_11', at: '2026-09-30T12:45', event: 'Application Submitted', message: 'Submitted by B2B partner Sunrise Tours.', visibility: 'both', by: 'Sunrise Tours' }],
    internalNotes: [], customerNotes: [],
  },
  {
    id: 'va_105', number: 'VISA-2026-000105', countryId: 'vae', visaTypeId: 'vt_ae_business',
    country: 'United Arab Emirates', visaType: 'Business Visa', channel: 'b2b', partner: 'Nimbus Travels',
    applicant: { fullName: 'Kamal Hossain', dob: '1988-09-14', gender: 'male', nationality: 'Bangladeshi', mobile: '+880 1715 300 440', email: 'kamal@everestgroup.bd', address: 'Motijheel C/A', city: 'Dhaka', applicantType: 'business' },
    passport: { number: 'AB5566778', expiry: '2027-08-01', issueDate: '2017-08-02', issuingCountry: 'Bangladesh', type: 'ordinary' },
    status: 'processing', assignedStaff: 'Ahmed Karim', submittedAt: '2026-09-26', updatedAt: '2026-10-04',
    price: { currency: 'BDT', b2c: 7800, b2b: 6400 },
    actionRequired: null, rejection: null,
    documents: [
      { id: 'vd_14', type: 'Passport Copy', name: 'passport-kamal.pdf', size: '1.8 MB', mime: 'application/pdf', uploadedBy: 'Nimbus Travels', uploadedAt: '2026-09-26', status: 'verified', reviewNote: '' },
      { id: 'vd_15', type: 'Trade License', name: 'everest-trade-license.pdf', size: '0.9 MB', mime: 'application/pdf', uploadedBy: 'Nimbus Travels', uploadedAt: '2026-09-26', status: 'verified', reviewNote: '' },
    ],
    timeline: [
      { id: 'vtl_12', at: '2026-09-26T08:20', event: 'Application Submitted', message: 'Submitted by B2B partner Nimbus Travels.', visibility: 'both', by: 'Nimbus Travels' },
      { id: 'vtl_13', at: '2026-10-01T11:10', event: 'Processing', message: 'File prepared for submission.', visibility: 'both', by: 'Ahmed Karim' },
    ],
    internalNotes: [], customerNotes: [],
  },
  {
    id: 'va_106', number: 'VISA-2026-000106', countryId: 'vgb', visaTypeId: 'vt_gb_tourist',
    country: 'United Kingdom', visaType: 'UK Standard Visitor Visa', channel: 'b2c', partner: null,
    applicant: { fullName: 'Farhana Islam', dob: '1994-03-03', gender: 'female', nationality: 'Bangladeshi', mobile: '+880 1913 456 780', email: 'farhana.islam@yahoo.com', address: 'Zindabazar', city: 'Sylhet', applicantType: 'individual' },
    passport: { number: 'BX1122334', expiry: '2031-05-20', issueDate: '2021-05-21', issuingCountry: 'Bangladesh', type: 'ordinary' },
    status: 'submitted_to_embassy', assignedStaff: 'Fatema Zahra', submittedAt: '2026-09-18', updatedAt: '2026-10-01',
    price: { currency: 'BDT', b2c: 18500, b2b: 16000 },
    actionRequired: null, rejection: null,
    documents: [
      { id: 'vd_16', type: 'Passport Copy', name: 'passport-farhana.pdf', size: '2.3 MB', mime: 'application/pdf', uploadedBy: 'Farhana Islam', uploadedAt: '2026-09-18', status: 'verified', reviewNote: '' },
      { id: 'vd_17', type: 'Bank Statement (last 6 months)', name: 'bank-farhana.pdf', size: '7.1 MB', mime: 'application/pdf', uploadedBy: 'Farhana Islam', uploadedAt: '2026-09-18', status: 'verified', reviewNote: '' },
    ],
    timeline: [
      { id: 'vtl_14', at: '2026-09-18T10:00', event: 'Application Submitted', message: 'Application submitted online.', visibility: 'both', by: 'Farhana Islam' },
      { id: 'vtl_15', at: '2026-10-01T09:45', event: 'Submitted to Embassy', message: 'Biometrics done, file at UK visa centre.', visibility: 'both', by: 'Fatema Zahra' },
    ],
    internalNotes: [], customerNotes: [],
  },
  {
    id: 'va_107', number: 'VISA-2026-000107', countryId: 'vae', visaTypeId: 'vt_ae_tourist',
    country: 'United Arab Emirates', visaType: 'Tourist Visa', channel: 'b2c', partner: null,
    applicant: { fullName: 'Jahangir Alam', dob: '1990-12-11', gender: 'male', nationality: 'Bangladeshi', mobile: '+880 1711 222 333', email: 'jahangir.alam@gmail.com', address: 'Badda', city: 'Dhaka', applicantType: 'individual' },
    passport: { number: 'CD9988776', expiry: '2029-09-09', issueDate: '2019-09-10', issuingCountry: 'Bangladesh', type: 'ordinary' },
    status: 'completed', assignedStaff: 'Ahmed Karim', submittedAt: '2026-09-10', updatedAt: '2026-09-24',
    price: { currency: 'BDT', b2c: 6500, b2b: 5200 },
    actionRequired: null, rejection: null,
    documents: [
      { id: 'vd_18', type: 'Passport Copy', name: 'passport-jahangir.pdf', size: '1.6 MB', mime: 'application/pdf', uploadedBy: 'Jahangir Alam', uploadedAt: '2026-09-10', status: 'verified', reviewNote: '' },
      { id: 'vd_19', type: 'Recent Passport-size Photograph', name: 'photo-jahangir.jpg', size: '0.4 MB', mime: 'image/jpeg', uploadedBy: 'Jahangir Alam', uploadedAt: '2026-09-10', status: 'verified', reviewNote: '' },
    ],
    timeline: [
      { id: 'vtl_16', at: '2026-09-10T09:00', event: 'Application Submitted', message: 'Application submitted online.', visibility: 'both', by: 'Jahangir Alam' },
      { id: 'vtl_17', at: '2026-09-14T13:00', event: 'Approved', message: '30-day tourist visa granted.', visibility: 'both', by: 'Ahmed Karim' },
      { id: 'vtl_18', at: '2026-09-24T17:20', event: 'Completed', message: 'Passport collected by applicant.', visibility: 'both', by: 'Ahmed Karim' },
    ],
    internalNotes: [], customerNotes: [],
  },
  {
    id: 'va_108', number: 'VISA-2026-000108', countryId: 'vfr', visaTypeId: 'vt_fr_business',
    country: 'Schengen (France)', visaType: 'Schengen Business Visa', channel: 'b2b', partner: 'ABC Travels',
    applicant: { fullName: 'Mahmudul Hasan', dob: '1982-06-30', gender: 'male', nationality: 'Bangladeshi', mobile: '+880 1719 888 999', email: 'mahmud@textilehouse.bd', address: 'Uttara Sector 7', city: 'Dhaka', applicantType: 'business' },
    passport: { number: 'EF4433221', expiry: '2028-02-28', issueDate: '2018-03-01', issuingCountry: 'Bangladesh', type: 'official' },
    status: 'rejected', assignedStaff: 'Daniel Osei', submittedAt: '2026-09-08', updatedAt: '2026-09-27',
    price: { currency: 'BDT', b2c: 16000, b2b: 14000 },
    actionRequired: null,
    rejection: { internalReason: 'Insufficient financial documentation — company statement showed low closing balance.', customerReason: 'The application was rejected due to insufficient financial documentation.', decidedAt: '2026-09-27' },
    documents: [
      { id: 'vd_20', type: 'Passport Copy', name: 'passport-mahmud.pdf', size: '2.2 MB', mime: 'application/pdf', uploadedBy: 'ABC Travels', uploadedAt: '2026-09-08', status: 'verified', reviewNote: '' },
      { id: 'vd_21', type: 'Invitation Letter (French company)', name: 'invitation-paris.pdf', size: '0.7 MB', mime: 'application/pdf', uploadedBy: 'ABC Travels', uploadedAt: '2026-09-08', status: 'verified', reviewNote: '' },
      { id: 'vd_22', type: 'Bank Statement (company, last 6 months)', name: 'textile-bank.pdf', size: '5.0 MB', mime: 'application/pdf', uploadedBy: 'ABC Travels', uploadedAt: '2026-09-08', status: 'verified', reviewNote: '' },
    ],
    timeline: [
      { id: 'vtl_19', at: '2026-09-08T11:30', event: 'Application Submitted', message: 'Submitted by B2B partner ABC Travels.', visibility: 'both', by: 'ABC Travels' },
      { id: 'vtl_20', at: '2026-09-27T10:05', event: 'Rejected', message: 'Visa refused by the embassy.', visibility: 'both', by: 'Daniel Osei' },
    ],
    internalNotes: [{ id: 'vn_6', at: '2026-09-27T10:10', by: 'Daniel Osei', text: 'Refusal letter scanned and shared with partner. Advise re-application with stronger funds.' }],
    customerNotes: [],
  },
  {
    id: 'va_109', number: 'VISA-2026-000109', countryId: 'vcn', visaTypeId: 'vt_cn_student',
    country: 'China', visaType: 'Student Visa', channel: 'b2c', partner: null,
    applicant: { fullName: 'Anika Tabassum', dob: '2003-08-21', gender: 'female', nationality: 'Bangladeshi', mobile: '+880 1611 777 888', email: 'anika.tabassum@gmail.com', address: 'Mirpur DOHS', city: 'Dhaka', applicantType: 'student' },
    passport: { number: 'GH6677889', expiry: '2032-04-10', issueDate: '2022-04-11', issuingCountry: 'Bangladesh', type: 'ordinary' },
    status: 'passport_ready', assignedStaff: 'Priya Nair', submittedAt: '2026-08-28', updatedAt: '2026-10-03',
    price: { currency: 'BDT', b2c: 22000, b2b: 19000 },
    actionRequired: null, rejection: null,
    documents: [
      { id: 'vd_23', type: 'Passport Copy', name: 'passport-anika.pdf', size: '2.4 MB', mime: 'application/pdf', uploadedBy: 'Anika Tabassum', uploadedAt: '2026-08-28', status: 'verified', reviewNote: '' },
      { id: 'vd_24', type: 'Admission Letter', name: 'tsinghua-admission.pdf', size: '1.3 MB', mime: 'application/pdf', uploadedBy: 'Anika Tabassum', uploadedAt: '2026-08-28', status: 'verified', reviewNote: '' },
      { id: 'vd_25', type: 'Medical Certificate', name: 'medical-anika.pdf', size: '0.9 MB', mime: 'application/pdf', uploadedBy: 'Anika Tabassum', uploadedAt: '2026-08-28', status: 'verified', reviewNote: '' },
    ],
    timeline: [
      { id: 'vtl_21', at: '2026-08-28T10:10', event: 'Application Submitted', message: 'Application submitted online.', visibility: 'both', by: 'Anika Tabassum' },
      { id: 'vtl_22', at: '2026-09-20T14:00', event: 'Approved', message: 'X1 study visa granted.', visibility: 'both', by: 'Priya Nair' },
      { id: 'vtl_23', at: '2026-10-03T11:25', event: 'Passport Ready', message: 'Passport received from embassy, ready for collection.', visibility: 'both', by: 'Priya Nair' },
    ],
    internalNotes: [], customerNotes: [{ id: 'vn_7', at: '2026-10-03T11:30', by: 'Priya Nair', text: 'Your passport is ready! Please visit our Dhanmondi office with your collection slip.' }],
  },
  {
    id: 'va_110', number: 'VISA-2026-000110', countryId: 'vmy', visaTypeId: 'vt_my_tourist',
    country: 'Malaysia', visaType: 'Tourist Visa (eVisa)', channel: 'b2c', partner: null,
    applicant: { fullName: 'Shahidul Islam', dob: '1979-02-02', gender: 'male', nationality: 'Bangladeshi', mobile: '+880 1555 123 456', email: 'shahidul.islam@gmail.com', address: 'Khulna Sadar', city: 'Khulna', applicantType: 'individual' },
    passport: { number: 'IJ2233445', expiry: '2027-01-15', issueDate: '2017-01-16', issuingCountry: 'Bangladesh', type: 'ordinary' },
    status: 'action_required', assignedStaff: 'Fatema Zahra', submittedAt: '2026-10-01', updatedAt: '2026-10-04',
    price: { currency: 'BDT', b2c: 4500, b2b: 3600 },
    actionRequired: { message: 'Your passport bio page scan is not readable. Please re-upload a clear colour scan.', requestedAt: '2026-10-04', requestedBy: 'Fatema Zahra' },
    rejection: null,
    documents: [
      { id: 'vd_26', type: 'Passport Copy', name: 'scan001.pdf', size: '0.3 MB', mime: 'application/pdf', uploadedBy: 'Shahidul Islam', uploadedAt: '2026-10-01', status: 'rejected', reviewNote: 'Blurry scan — bio page unreadable.' },
    ],
    timeline: [
      { id: 'vtl_24', at: '2026-10-01T15:40', event: 'Application Submitted', message: 'Application submitted online.', visibility: 'both', by: 'Shahidul Islam' },
      { id: 'vtl_25', at: '2026-10-04T09:50', event: 'Action Required', message: 'Requested a readable passport scan.', visibility: 'both', by: 'Fatema Zahra' },
    ],
    internalNotes: [], customerNotes: [],
  },
]

/* ── Quotations (spec #11) ───────────────────────────────── */

const DEMO_QUOTATIONS = [
  { id: 'vq_1', number: 'QT-2026-0001', partner: 'ABC Travels', clientName: 'Rahim Ahmed', country: 'China', visaType: 'Tourist Visa', visaTypeId: 'vt_cn_tourist', quantity: 2, currency: 'BDT', netPrice: 10000, additionalFee: 1500, total: 21500, validUntil: '2026-10-20', createdAt: '2026-10-01', status: 'sent', notes: 'Includes document pickup from Dhanmondi.' },
  { id: 'vq_2', number: 'QT-2026-0002', partner: 'Sunrise Tours', clientName: 'Chattogram Group (5 pax)', country: 'Malaysia', visaType: 'Tourist Visa (eVisa)', visaTypeId: 'vt_my_tourist', quantity: 5, currency: 'BDT', netPrice: 3600, additionalFee: 2500, total: 20500, validUntil: '2026-10-15', createdAt: '2026-09-29', status: 'draft', notes: '' },
  { id: 'vq_3', number: 'QT-2026-0003', partner: 'Nimbus Travels', clientName: 'Kamal Hossain', country: 'Schengen (France)', visaType: 'Schengen Business Visa', visaTypeId: 'vt_fr_business', quantity: 1, currency: 'BDT', netPrice: 14000, additionalFee: 2000, total: 16000, validUntil: '2026-10-10', createdAt: '2026-09-27', status: 'accepted', notes: 'Quotation accepted, converted to application VISA-2026-000105.' },
]

/* ── SMS templates + logs (spec #20–#22) ─────────────────── */

const DEMO_SMS_TEMPLATES = [
  { id: 'vst_1', name: 'Application Received', trigger: 'submitted', message: 'Dear {{applicantName}}, we have received your {{country}} {{visaType}} application {{applicationNumber}}. Track it at {{trackingUrl}}.', active: true, updatedAt: '2026-09-20' },
  { id: 'vst_2', name: 'Under Review', trigger: 'under_review', message: 'Dear {{applicantName}}, your visa application {{applicationNumber}} is now under review.', active: true, updatedAt: '2026-09-20' },
  { id: 'vst_3', name: 'Action Required', trigger: 'action_required', message: 'Dear {{applicantName}}, action is required on your visa application {{applicationNumber}}. Please upload the requested documents.', active: true, updatedAt: '2026-09-20' },
  { id: 'vst_4', name: 'Submitted to Embassy', trigger: 'submitted_to_embassy', message: 'Dear {{applicantName}}, your {{country}} visa application {{applicationNumber}} has been submitted to the embassy.', active: true, updatedAt: '2026-09-20' },
  { id: 'vst_5', name: 'Visa Approved', trigger: 'approved', message: 'Dear {{applicantName}}, your {{country}} visa application {{applicationNumber}} has been approved. Congratulations!', active: true, updatedAt: '2026-09-20' },
  { id: 'vst_6', name: 'Visa Rejected', trigger: 'rejected', message: 'Dear {{applicantName}}, unfortunately your {{country}} visa application {{applicationNumber}} was rejected. Please contact us for details.', active: true, updatedAt: '2026-09-20' },
  { id: 'vst_7', name: 'Passport Ready', trigger: 'passport_ready', message: 'Dear {{applicantName}}, your passport for application {{applicationNumber}} is ready for collection.', active: true, updatedAt: '2026-09-20' },
  { id: 'vst_8', name: 'Application Completed', trigger: 'completed', message: 'Dear {{applicantName}}, your visa application {{applicationNumber}} is complete. Thank you for choosing Dynamic Travel.', active: false, updatedAt: '2026-09-20' },
]

const DEMO_SMS_LOGS = [
  { id: 'vsl_1', applicationNumber: 'VISA-2026-000101', recipient: 'Rahim Ahmed', phone: '+880 1712 556 340', template: 'Under Review', message: 'Dear Rahim Ahmed, your visa application VISA-2026-000101 is now under review.', provider: 'SSL Wireless', providerMessageId: 'SSL-88231', status: 'delivered', sentAt: '2026-10-02T14:45', deliveredAt: '2026-10-02T14:46', error: '' },
  { id: 'vsl_2', applicationNumber: 'VISA-2026-000102', recipient: 'Tom Becker', phone: '+49 151 2233 4455', template: 'Action Required', message: 'Dear Tom Becker, action is required on your visa application VISA-2026-000102.', provider: 'Twilio', providerMessageId: 'SM8ac2', status: 'delivered', sentAt: '2026-10-03T16:20', deliveredAt: '2026-10-03T16:21', error: '' },
  { id: 'vsl_3', applicationNumber: 'VISA-2026-000103', recipient: 'Sara Ali', phone: '+880 1977 402 118', template: 'Visa Approved', message: 'Dear Sara Ali, your Schengen (France) visa application VISA-2026-000103 has been approved. Congratulations!', provider: 'SSL Wireless', providerMessageId: 'SSL-88914', status: 'delivered', sentAt: '2026-10-02T15:35', deliveredAt: '2026-10-02T15:36', error: '' },
  { id: 'vsl_4', applicationNumber: 'VISA-2026-000108', recipient: 'Mahmudul Hasan', phone: '+880 1719 888 999', template: 'Visa Rejected', message: 'Dear Mahmudul Hasan, unfortunately your visa application VISA-2026-000108 was rejected.', provider: 'SSL Wireless', providerMessageId: 'SSL-87110', status: 'failed', sentAt: '2026-09-27T10:12', deliveredAt: null, error: 'Invalid recipient number (operator rejected).' },
  { id: 'vsl_5', applicationNumber: 'VISA-2026-000107', recipient: 'Jahangir Alam', phone: '+880 1711 222 333', template: 'Application Received', message: 'Dear Jahangir Alam, we have received your visa application VISA-2026-000107.', provider: 'SSL Wireless', providerMessageId: 'SSL-85402', status: 'sent', sentAt: '2026-09-10T09:05', deliveredAt: null, error: '' },
  { id: 'vsl_6', applicationNumber: 'VISA-2026-000110', recipient: 'Shahidul Islam', phone: '+880 1555 123 456', template: 'Action Required', message: 'Dear Shahidul Islam, action is required on your visa application VISA-2026-000110.', provider: 'SSL Wireless', providerMessageId: 'SSL-89002', status: 'delivered', sentAt: '2026-10-04T09:55', deliveredAt: '2026-10-04T09:56', error: '' },
]

/* ── Reference data ──────────────────────────────────────── */

export const VISA_STAFF = ['Priya Nair', 'Daniel Osei', 'Ahmed Karim', 'Fatema Zahra']
export const VISA_PARTNERS = ['ABC Travels', 'Sunrise Tours', 'Nimbus Travels', 'Everest Holidays']
export const APPLICANT_TYPES = ['individual', 'business', 'student', 'employee', 'sponsored']
export const CHECKLIST_REQUIREMENTS = ['required', 'optional', 'conditional']
export const STATUS_CATEGORIES = ['in_progress', 'action_required', 'success', 'failed', 'cancelled']
export const SMS_VARIABLES = ['applicantName', 'applicationNumber', 'country', 'visaType', 'status', 'trackingUrl']
export const SMS_LOG_STATUSES = ['sent', 'delivered', 'failed']

/* ── Passport handling constants (spec #2/#6/#11) ── */
export const PASSPORT_STATUS_LABELS = {
  not_received: 'Not Received',
  pickup_requested: 'Pickup Requested',
  confirmed: 'Confirmed',
  assigned: 'Assigned',
  pickup_in_progress: 'Pickup In Progress',
  picked_up: 'Picked Up',
  received_at_office: 'Received at Office',
  submitted_to_visa_center: 'Submitted to Visa Center',
  submitted_to_embassy: 'Submitted to Embassy',
  returned_to_office: 'Returned to Office',
  ready_for_collection: 'Ready for Collection',
  ready_for_delivery: 'Ready for Delivery',
  client_visited_office: 'Client Visited Office',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  not_required: 'Not Required',
}
export const PASSPORT_STATUS_TONES = {
  not_received: 'neutral',
  pickup_requested: 'info',
  confirmed: 'info',
  assigned: 'info',
  pickup_in_progress: 'warning',
  picked_up: 'warning',
  received_at_office: 'success',
  submitted_to_visa_center: 'info',
  submitted_to_embassy: 'info',
  returned_to_office: 'success',
  ready_for_collection: 'success',
  ready_for_delivery: 'info',
  client_visited_office: 'success',
  out_for_delivery: 'warning',
  delivered: 'success',
  not_required: 'neutral',
}
export const PASSPORT_METHOD_LABELS = {
  pickup: 'Pickup',
  office: 'Office visit',
  online: 'Online',
  unset: '—',
}
export const PASSPORT_REQUIREMENT_LABELS = {
  physical_required: 'Physical Passport Required',
  online_processing: 'Online Processing',
  physical_optional: 'Physical Submission Optional',
  country_specific: 'Country Specific',
}
export const PICKUP_LOCATION_TYPES = ['Home', 'Shop', 'Business', 'Office', 'Other']
export const DOCUMENT_SUBMISSION_MODES = ['digital', 'physical', 'both']

/* ── Mutable stores (persist for the session, reset on reload) ── */

let countriesStore = DEMO_COUNTRIES.map((country) => ({ ...country }))
let visaTypesStore = DEMO_VISA_TYPES.map((type) => ({
  passportRequirement: 'online_processing',
  pickupAvailable: false,
  officeSubmissionAvailable: false,
  ...PASSPORT_CONFIG_SEED[type.id],
  ...type,
  fees: { ...type.fees },
}))

/* ── Document submission rules (spec #9/#10): DIGITAL / PHYSICAL / BOTH ── */
const applyDocumentRules = (items) =>
  items.map((item) => ({
    fileFormats: 'PDF/JPG/PNG',
    maxSizeMb: 10,
    submissionMode: /passport(?! copy)/i.test(item.label) ? 'both' : 'digital',
    ...item,
  }))
let checklistsStore = DEMO_CHECKLISTS.map((checklist) => ({
  ...checklist,
  items: applyDocumentRules(checklist.items.map((item) => ({ ...item }))),
}))

/* ── Passport tracking on applications (spec #6/#11/#14) ── */
const PASSPORT_SEED = {
  va_101: {
    passportSubmissionMethod: 'pickup', passportStatus: 'pickup_requested',
    pickupRequest: { locationType: 'Home', contactName: 'Rahim Ahmed', phone: '+880 1712 556 340', address: 'House 42, Road 7, Dhanmondi', district: 'Dhaka', area: 'Dhanmondi', landmark: 'Beside Star Kabab, Road 7', preferredDate: '2026-10-06', preferredTime: '11:00–13:00', assignedStaff: null, status: 'requested' },
  },
  va_102: { passportSubmissionMethod: 'office', passportStatus: 'not_received' },
  va_103: { passportSubmissionMethod: 'office', passportStatus: 'ready_for_collection' },
  va_104: { passportSubmissionMethod: 'online', passportStatus: 'not_required' },
  va_105: {
    passportSubmissionMethod: 'office', passportStatus: 'received_at_office',
    passportReceived: { receivedDate: '2026-10-01', receivedBy: 'Ahmed Karim', passportNumber: 'AB5566778', remarks: '' },
  },
  va_106: {
    passportSubmissionMethod: 'pickup', passportStatus: 'submitted_to_embassy',
    pickupRequest: { locationType: 'Home', contactName: 'Farhana Islam', phone: '+880 1913 456 780', address: 'Zindabazar Main Road', district: 'Sylhet', area: 'Zindabazar', landmark: 'Opposite White Hall', preferredDate: '2026-09-20', preferredTime: '10:00–12:00', assignedStaff: 'Fatema Zahra', status: 'picked_up' },
  },
  va_107: {
    passportSubmissionMethod: 'pickup', passportStatus: 'delivered',
    pickupRequest: { locationType: 'Home', contactName: 'Jahangir Alam', phone: '+880 1711 222 333', address: 'Badda Thana Road', district: 'Dhaka', area: 'Badda', landmark: 'Near Badda Bridge', preferredDate: '2026-09-11', preferredTime: '14:00–16:00', assignedStaff: 'Ahmed Karim', status: 'picked_up' },
  },
  va_108: { passportSubmissionMethod: 'office', passportStatus: 'returned_to_office' },
  va_109: {
    passportSubmissionMethod: 'pickup', passportStatus: 'ready_for_collection',
    pickupRequest: { locationType: 'Home', contactName: 'Anika Tabassum', phone: '+880 1611 777 888', address: 'Mirpur DOHS, Avenue 4', district: 'Dhaka', area: 'Mirpur DOHS', landmark: 'Gate 2', preferredDate: '2026-08-30', preferredTime: '11:00–13:00', assignedStaff: 'Priya Nair', status: 'picked_up' },
  },
  va_110: { passportSubmissionMethod: 'online', passportStatus: 'not_required' },
}

let statusConfigsStore = DEMO_STATUS_CONFIGS.map((status) => ({ ...status }))
let applicationsStore = DEMO_APPLICATIONS.map((application) => ({
  passportSubmissionMethod: 'online',
  passportStatus: 'not_required',
  ...PASSPORT_SEED[application.id],
  ...application,
  applicant: { ...application.applicant },
  passport: { ...application.passport },
  price: { ...application.price },
  documents: application.documents.map((document) => ({ ...document })),
  timeline: application.timeline.map((event) => ({ ...event })),
  internalNotes: application.internalNotes.map((note) => ({ ...note })),
  customerNotes: application.customerNotes.map((note) => ({ ...note })),
  ...(application.pickupRequest ? { pickupRequest: { ...application.pickupRequest } } : {}),
}))
let quotationsStore = DEMO_QUOTATIONS.map((quotation) => ({ ...quotation }))
let smsTemplatesStore = DEMO_SMS_TEMPLATES.map((template) => ({ ...template }))
let smsLogsStore = DEMO_SMS_LOGS.map((log) => ({ ...log }))

function nextQuotationNumber() {
  const max = quotationsStore.reduce((acc, quotation) => Math.max(acc, Number(quotation.number.split('-').pop()) || 0), 0)
  return `QT-2026-${String(max + 1).padStart(4, '0')}`
}

function sortActiveConfig(statusA, statusB) {
  return statusA.displayOrder - statusB.displayOrder
}

export const activeStatusConfigs = () =>
  statusConfigsStore.filter((status) => status.active).sort(sortActiveConfig)

function logTimeline(application, event, message, visibility = 'both', by = 'Admin') {
  application.timeline = [
    { id: nextId('vtl'), at: new Date().toISOString(), event, message, visibility, by },
    ...application.timeline,
  ]
  application.updatedAt = new Date().toISOString().slice(0, 10)
}

export const visaApi = {
  /* ── Countries ── */
  listCountries: (params = {}) =>
    withMock(
      () => {
        let items = [...countriesStore]
        if (params.search) {
          const query = String(params.search).toLowerCase()
          items = items.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query))
        }
        return { items: clone(items.sort((a, b) => a.displayOrder - b.displayOrder)), total: items.length }
      },
      () => apiClient.get('/visa/countries', { params }),
    ),
  saveCountry: (payload) =>
    withMock(
      () => {
        if (payload.id) {
          const index = countriesStore.findIndex((country) => country.id === payload.id)
          if (index >= 0) {
            countriesStore[index] = { ...countriesStore[index], ...payload }
            return clone(countriesStore[index])
          }
        }
        const record = {
          id: nextId('vc'),
          status: 'active',
          displayOrder: countriesStore.length + 1,
          ...payload,
        }
        countriesStore = [...countriesStore, record]
        return clone(record)
      },
      () => (payload.id ? apiClient.patch(`/visa/countries/${payload.id}`, payload) : apiClient.post('/visa/countries', payload)),
    ),
  updateCountry: (id, patch) =>
    withMock(
      () => {
        countriesStore = countriesStore.map((country) => (country.id === id ? { ...country, ...patch } : country))
        return clone(countriesStore.find((country) => country.id === id))
      },
      () => apiClient.patch(`/visa/countries/${id}`, patch),
    ),
  removeCountry: (id) =>
    withMock(
      () => {
        countriesStore = countriesStore.filter((country) => country.id !== id)
        visaTypesStore = visaTypesStore.filter((type) => type.countryId !== id)
        checklistsStore = checklistsStore.filter((checklist) => checklist.countryId !== id)
        return { ok: true }
      },
      () => apiClient.del(`/visa/countries/${id}`),
    ),

  /* ── Visa types (+ pricing, spec #2/#3/#4) ── */
  listVisaTypes: (params = {}) =>
    withMock(
      () => {
        let items = [...visaTypesStore]
        if (params.countryId) items = items.filter((type) => type.countryId === params.countryId)
        return { items: clone(items) }
      },
      () => apiClient.get('/visa/types', { params }),
    ),
  saveVisaType: (payload) =>
    withMock(
      () => {
        if (payload.id) {
          const index = visaTypesStore.findIndex((type) => type.id === payload.id)
          if (index >= 0) {
            visaTypesStore[index] = { ...visaTypesStore[index], ...payload }
            return clone(visaTypesStore[index])
          }
        }
        const record = { id: nextId('vt'), status: 'active', ...payload }
        visaTypesStore = [...visaTypesStore, record]
        return clone(record)
      },
      () => (payload.id ? apiClient.patch(`/visa/types/${payload.id}`, payload) : apiClient.post('/visa/types', payload)),
    ),
  updateVisaType: (id, patch) =>
    withMock(
      () => {
        visaTypesStore = visaTypesStore.map((type) => (type.id === id ? { ...type, ...patch } : type))
        return clone(visaTypesStore.find((type) => type.id === id))
      },
      () => apiClient.patch(`/visa/types/${id}`, patch),
    ),
  removeVisaType: (id) =>
    withMock(
      () => {
        visaTypesStore = visaTypesStore.filter((type) => type.id !== id)
        checklistsStore = checklistsStore.filter((checklist) => checklist.visaTypeId !== id)
        return { ok: true }
      },
      () => apiClient.del(`/visa/types/${id}`),
    ),

  /* ── Checklists (spec #5) ── */
  getChecklist: ({ countryId, visaTypeId, applicantType }) =>
    withMock(
      () => {
        const found = checklistsStore.find(
          (checklist) =>
            checklist.countryId === countryId && checklist.visaTypeId === visaTypeId && checklist.applicantType === applicantType,
        )
        if (found) return clone(found)
        // Not configured yet: synthesize a default template without persisting,
        // so the admin starts editing from a sensible baseline.
        return clone({
          id: null,
          countryId,
          visaTypeId,
          applicantType,
          items: DEFAULT_CHECKLIST_ITEMS.map((item, index) => ({ id: `default_${index + 1}`, ...item, active: true })),
          isDefault: true,
        })
      },
      () => apiClient.get(`/visa/checklists/${countryId}/${visaTypeId}/${applicantType}`),
    ),
  saveChecklist: ({ countryId, visaTypeId, applicantType, items }) =>
    withMock(
      () => {
        const index = checklistsStore.findIndex(
          (checklist) =>
            checklist.countryId === countryId && checklist.visaTypeId === visaTypeId && checklist.applicantType === applicantType,
        )
        const record = {
          id: index >= 0 ? checklistsStore[index].id : nextId('vcl'),
          countryId,
          visaTypeId,
          applicantType,
          items: items.map((item) => ({ ...item })),
        }
        if (index >= 0) checklistsStore[index] = record
        else checklistsStore = [...checklistsStore, record]
        return clone(record)
      },
      () => apiClient.put(`/visa/checklists/${countryId}/${visaTypeId}/${applicantType}`, { items }),
    ),

  /* ── Applications (spec #9/#10/#12/#13) ── */
  listApplications: (params = {}) =>
    withMock(
      () => {
        let items = [...applicationsStore]
        if (params.status) items = items.filter((application) => application.status === params.status)
        if (params.countryId) items = items.filter((application) => application.countryId === params.countryId)
        if (params.channel) items = items.filter((application) => application.channel === params.channel)
        if (params.staff) items = items.filter((application) => application.assignedStaff === params.staff)
        if (params.search) {
          const query = String(params.search).toLowerCase()
          items = items.filter((application) =>
            [
              application.number,
              application.applicant.fullName,
              application.passport.number,
              application.applicant.mobile,
              application.applicant.email,
              application.country,
              application.partner,
            ]
              .join(' ')
              .toLowerCase()
              .includes(query),
          )
        }
        items.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
        return { items: clone(items), total: items.length }
      },
      () => apiClient.get('/visa/applications', { params }),
    ),
  getApplication: (id) =>
    withMock(
      () => clone(applicationsStore.find((application) => application.id === id) ?? applicationsStore[0]),
      () => apiClient.get(`/visa/applications/${id}`),
    ),
  updateApplication: (id, patch) =>
    withMock(
      () => {
        const index = applicationsStore.findIndex((application) => application.id === id)
        if (index < 0) return null
        applicationsStore[index] = { ...applicationsStore[index], ...patch }
        return clone(applicationsStore[index])
      },
      () => apiClient.patch(`/visa/applications/${id}`, patch),
    ),
  assignStaff: (id, staff) =>
    withMock(
      () => {
        const application = applicationsStore.find((item) => item.id === id)
        if (!application) return null
        application.assignedStaff = staff
        logTimeline(application, 'Assigned to Staff', `Assigned to ${staff}.`, 'internal')
        return clone(application)
      },
      () => apiClient.patch(`/visa/applications/${id}`, { assignedStaff: staff }),
    ),
  changeStatus: (id, { status, customerMessage, internalReason, customerReason, note }) =>
    withMock(
      () => {
        const application = applicationsStore.find((item) => item.id === id)
        if (!application) return null
        const config = statusConfigsStore.find((item) => item.key === status)
        application.status = status
        if (status === 'action_required') {
          application.actionRequired = { message: customerMessage, requestedAt: new Date().toISOString(), requestedBy: 'Admin' }
        } else {
          application.actionRequired = null
        }
        if (status === 'rejected') {
          application.rejection = {
            internalReason: internalReason ?? '',
            customerReason: customerReason ?? '',
            decidedAt: new Date().toISOString(),
          }
        }
        const message =
          note ??
          customerMessage ??
          config?.customerMessage ??
          `Status changed to ${config?.displayName ?? status}.`
        logTimeline(application, config?.displayName ?? status, message, 'both')
        return clone(application)
      },
      () => apiClient.patch(`/visa/applications/${id}/status`, { status, customerMessage, internalReason, customerReason, note }),
    ),
  addNote: (id, { type, text }) =>
    withMock(
      () => {
        const application = applicationsStore.find((item) => item.id === id)
        if (!application) return null
        const note = { id: nextId('vn'), at: new Date().toISOString(), by: 'Admin', text }
        if (type === 'customer') application.customerNotes = [note, ...application.customerNotes]
        else application.internalNotes = [note, ...application.internalNotes]
        logTimeline(application, type === 'customer' ? 'Customer Note Added' : 'Internal Note Added', text, type === 'customer' ? 'customer' : 'internal')
        return clone(application)
      },
      () => apiClient.post(`/visa/applications/${id}/notes`, { type, text }),
    ),
  reviewDocument: (applicationId, documentId, { status, reviewNote }) =>
    withMock(
      () => {
        const application = applicationsStore.find((item) => item.id === applicationId)
        if (!application) return null
        const document = application.documents.find((item) => item.id === documentId)
        if (document) {
          document.status = status
          document.reviewNote = reviewNote ?? ''
          const label = status === 'verified' ? 'Document Verified' : 'Document Rejected'
          logTimeline(application, label, `${document.type}: ${document.name}${reviewNote ? ` — ${reviewNote}` : ''}`, 'internal')
        }
        return clone(application)
      },
      () => apiClient.patch(`/visa/applications/${applicationId}/documents/${documentId}`, { status, reviewNote }),
    ),

  addDocument: (applicationId, payload) =>
    withMock(
      () => {
        const application = applicationsStore.find((item) => item.id === applicationId)
        if (!application) return null
        const document = {
          id: nextId('vd'),
          status: 'pending',
          reviewNote: '',
          uploadedBy: 'Admin (manual upload)',
          uploadedAt: new Date().toISOString().slice(0, 10),
          ...payload,
        }
        application.documents = [...application.documents, document]
        logTimeline(application, 'Document Uploaded', `${document.type}: ${document.name}`, 'both', 'Admin')
        return clone(document)
      },
      () => apiClient.post(`/visa/applications/${applicationId}/documents`, payload),
    ),

  /* ── Passport operations (spec: passport submission, pickup & tracking) ── */
  updatePassport: (id, payload = {}) =>
    withMock(
      () => {
        const application = applicationsStore.find((item) => item.id === id)
        if (!application) return null

        if (payload.passportSubmissionMethod) {
          application.passportSubmissionMethod = payload.passportSubmissionMethod
          application.passportStatus = payload.passportSubmissionMethod === 'online' ? 'not_required' : 'not_received'
          logTimeline(
            application,
            'Passport Submission Method',
            payload.passportSubmissionMethod === 'pickup'
              ? 'Pickup service selected for the original passport.'
              : payload.passportSubmissionMethod === 'office'
                ? 'Applicant will submit the original passport at our office.'
                : 'Online processing — no physical passport required.',
            'both',
          )
        }

        if (payload.pickupRequest) {
          application.pickupRequest = { ...(application.pickupRequest ?? {}), ...payload.pickupRequest, status: 'requested' }
          application.passportStatus = 'pickup_requested'
          logTimeline(
            application,
            'Passport Pickup Requested',
            `${payload.pickupRequest.locationType ?? 'Home'} pickup at ${payload.pickupRequest.address ?? ''}${payload.pickupRequest.preferredDate ? `, preferred ${payload.pickupRequest.preferredDate} ${payload.pickupRequest.preferredTime ?? ''}` : ''}.`,
            'both',
          )
        }

        if (payload.assignedStaff !== undefined && application.pickupRequest) {
          application.pickupRequest.assignedStaff = payload.assignedStaff
          application.pickupRequest.status = 'assigned'
          application.passportStatus = 'assigned'
          logTimeline(application, 'Pickup Staff Assigned', `Pickup assigned to ${payload.assignedStaff}.`, 'both')
        }

        if (payload.passportStatus) {
          application.passportStatus = payload.passportStatus
          const details = payload.details ?? {}
          if (payload.passportStatus === 'picked_up') {
            application.passportCollection = { ...details }
            logTimeline(
              application,
              'Passport Collected',
              `Collected from the applicant${details.collectorName ? ` by ${details.collectorName}` : ''}${details.remarks ? ` — ${details.remarks}` : ''}.`,
              'both',
            )
          } else if (payload.passportStatus === 'received_at_office') {
            application.passportReceived = { ...details }
            logTimeline(
              application,
              'Passport Received at Office',
              `Received by ${details.receivedBy ?? 'office'}${details.remarks ? ` — ${details.remarks}` : ''}.`,
              'both',
            )
          } else {
            logTimeline(application, `Passport: ${PASSPORT_STATUS_LABELS[payload.passportStatus] ?? payload.passportStatus}`, payload.note ?? '', 'both')
          }
        }

        application.updatedAt = new Date().toISOString().slice(0, 10)
        return clone(application)
      },
      () => apiClient.patch(`/visa/applications/${id}/passport`, payload),
    ),

  /* ── Status configuration (spec #14) ── */
  listStatusConfigs: () =>
    withMock(
      () => ({ items: clone([...statusConfigsStore].sort(sortActiveConfig)) }),
      () => apiClient.get('/visa/statuses'),
    ),
  saveStatusConfig: (payload) =>
    withMock(
      () => {
        if (payload.id) {
          const index = statusConfigsStore.findIndex((status) => status.id === payload.id)
          if (index >= 0) {
            statusConfigsStore[index] = { ...statusConfigsStore[index], ...payload }
            return clone(statusConfigsStore[index])
          }
        }
        const record = {
          id: nextId('vsc'),
          isSystem: false,
          active: true,
          key: String(payload.key ?? payload.displayName ?? '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, ''),
          ...payload,
        }
        statusConfigsStore = [...statusConfigsStore, record]
        return clone(record)
      },
      () => (payload.id ? apiClient.patch(`/visa/statuses/${payload.id}`, payload) : apiClient.post('/visa/statuses', payload)),
    ),
  updateStatusConfig: (id, patch) =>
    withMock(
      () => {
        statusConfigsStore = statusConfigsStore.map((status) => (status.id === id ? { ...status, ...patch } : status))
        return clone(statusConfigsStore.find((status) => status.id === id))
      },
      () => apiClient.patch(`/visa/statuses/${id}`, patch),
    ),
  removeStatusConfig: (id) =>
    withMock(
      () => {
        const config = statusConfigsStore.find((status) => status.id === id)
        if (config?.isSystem) return { ok: false, error: 'System statuses cannot be deleted.' }
        statusConfigsStore = statusConfigsStore.filter((status) => status.id !== id)
        return { ok: true }
      },
      () => apiClient.del(`/visa/statuses/${id}`),
    ),

  /* ── Quotations (spec #11) ── */
  listQuotations: (params = {}) =>
    withMock(
      () => {
        let items = [...quotationsStore]
        if (params.search) {
          const query = String(params.search).toLowerCase()
          items = items.filter((quotation) =>
            `${quotation.number} ${quotation.partner} ${quotation.clientName} ${quotation.country}`.toLowerCase().includes(query),
          )
        }
        return { items: clone(items.reverse()), total: items.length }
      },
      () => apiClient.get('/visa/quotations', { params }),
    ),
  createQuotation: (payload) =>
    withMock(
      () => {
        const visaType = visaTypesStore.find((type) => type.id === payload.visaTypeId)
        const netPrice = visaType?.b2bNetPrice ?? 0
        const quantity = Number(payload.quantity) || 1
        const additionalFee = Number(payload.additionalFee) || 0
        const record = {
          id: nextId('vq'),
          number: nextQuotationNumber(),
          status: 'draft',
          createdAt: new Date().toISOString().slice(0, 10),
          ...payload,
          quantity,
          additionalFee,
          netPrice,
          currency: visaType?.currency ?? 'BDT',
          total: netPrice * quantity + additionalFee,
        }
        quotationsStore = [...quotationsStore, record]
        return clone(record)
      },
      () => apiClient.post('/visa/quotations', payload),
    ),
  updateQuotation: (id, patch) =>
    withMock(
      () => {
        quotationsStore = quotationsStore.map((quotation) => (quotation.id === id ? { ...quotation, ...patch } : quotation))
        return clone(quotationsStore.find((quotation) => quotation.id === id))
      },
      () => apiClient.patch(`/visa/quotations/${id}`, patch),
    ),
  removeQuotation: (id) =>
    withMock(
      () => {
        quotationsStore = quotationsStore.filter((quotation) => quotation.id !== id)
        return { ok: true }
      },
      () => apiClient.del(`/visa/quotations/${id}`),
    ),

  /* ── SMS (spec #20–#22) ── */
  listSmsTemplates: () =>
    withMock(
      () => ({ items: clone(smsTemplatesStore) }),
      () => apiClient.get('/visa/sms/templates'),
    ),
  saveSmsTemplate: (payload) =>
    withMock(
      () => {
        if (payload.id) {
          const index = smsTemplatesStore.findIndex((template) => template.id === payload.id)
          if (index >= 0) {
            smsTemplatesStore[index] = { ...smsTemplatesStore[index], ...payload, updatedAt: new Date().toISOString().slice(0, 10) }
            return clone(smsTemplatesStore[index])
          }
        }
        const record = { id: nextId('vst'), active: true, updatedAt: new Date().toISOString().slice(0, 10), ...payload }
        smsTemplatesStore = [...smsTemplatesStore, record]
        return clone(record)
      },
      () => (payload.id ? apiClient.patch(`/visa/sms/templates/${payload.id}`, payload) : apiClient.post('/visa/sms/templates', payload)),
    ),
  updateSmsTemplate: (id, patch) =>
    withMock(
      () => {
        smsTemplatesStore = smsTemplatesStore.map((template) =>
          template.id === id ? { ...template, ...patch, updatedAt: new Date().toISOString().slice(0, 10) } : template,
        )
        return clone(smsTemplatesStore.find((template) => template.id === id))
      },
      () => apiClient.patch(`/visa/sms/templates/${id}`, patch),
    ),
  removeSmsTemplate: (id) =>
    withMock(
      () => {
        smsTemplatesStore = smsTemplatesStore.filter((template) => template.id !== id)
        return { ok: true }
      },
      () => apiClient.del(`/visa/sms/templates/${id}`),
    ),
  listSmsLogs: (params = {}) =>
    withMock(
      () => {
        let items = [...smsLogsStore]
        if (params.status) items = items.filter((log) => log.status === params.status)
        if (params.search) {
          const query = String(params.search).toLowerCase()
          items = items.filter((log) =>
            `${log.applicationNumber} ${log.recipient} ${log.phone} ${log.template}`.toLowerCase().includes(query),
          )
        }
        return { items: clone(items), total: items.length }
      },
      () => apiClient.get('/visa/sms/logs', { params }),
    ),
  sendSms: (applicationId, { templateId, message }) =>
    withMock(
      () => {
        const application = applicationsStore.find((item) => item.id === applicationId)
        const template = smsTemplatesStore.find((item) => item.id === templateId)
        if (!application) return null
        const rendered = (message ?? template?.message ?? '')
          .replaceAll('{{applicantName}}', application.applicant.fullName)
          .replaceAll('{{applicationNumber}}', application.number)
          .replaceAll('{{country}}', application.country)
          .replaceAll('{{visaType}}', application.visaType)
          .replaceAll('{{status}}', application.status)
          .replaceAll('{{trackingUrl}}', `dynamic.travel/track/${application.number}`)
        const log = {
          id: nextId('vsl'),
          applicationNumber: application.number,
          recipient: application.applicant.fullName,
          phone: application.applicant.mobile,
          template: template?.name ?? 'Custom message',
          message: rendered,
          provider: 'SSL Wireless',
          providerMessageId: `SSL-${Math.floor(10000 + Math.random() * 89999)}`,
          status: 'sent',
          sentAt: new Date().toISOString(),
          deliveredAt: null,
          error: '',
        }
        smsLogsStore = [log, ...smsLogsStore]
        logTimeline(application, 'SMS Sent', rendered, 'internal', 'Admin')
        return clone(log)
      },
      () => apiClient.post(`/visa/applications/${applicationId}/sms`, { templateId, message }),
    ),

  /* ── Dashboard overview (spec #24) ── */
  getDashboardStats: () =>
    withMock(
      () => {
        const byStatus = (key) => applicationsStore.filter((application) => application.status === key).length
        const countryStats = countriesStore.map((country) => {
          const items = applicationsStore.filter((application) => application.countryId === country.id)
          const approved = items.filter((application) =>
            ['approved', 'passport_ready', 'completed'].includes(application.status),
          ).length
          return {
            country: country.name,
            flag: country.flag,
            applications: items.length,
            approved,
            approvalRate: items.length ? Math.round((approved / items.length) * 100) : 0,
          }
        })
        const decided = applicationsStore.filter((application) =>
          ['approved', 'passport_ready', 'completed', 'rejected'].includes(application.status),
        ).length
        return clone({
          total: applicationsStore.length,
          submitted: byStatus('submitted'),
          underReview: byStatus('under_review'),
          actionRequired: byStatus('action_required'),
          processing: byStatus('processing'),
          submittedToEmbassy: byStatus('submitted_to_embassy'),
          approved: byStatus('approved') + byStatus('passport_ready') + byStatus('completed'),
          rejected: byStatus('rejected'),
          completed: byStatus('completed'),
          b2c: applicationsStore.filter((application) => application.channel === 'b2c').length,
          b2b: applicationsStore.filter((application) => application.channel === 'b2b').length,
          unassigned: applicationsStore.filter((application) => !application.assignedStaff).length,
          decisionRate: applicationsStore.length ? Math.round((decided / applicationsStore.length) * 100) : 0,
          countries: countryStats.filter((stat) => stat.applications > 0),
          recent: clone(
            [...applicationsStore]
              .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
              .slice(0, 5),
          ),
        })
      },
      () => apiClient.get('/visa/dashboard'),
    ),
}
