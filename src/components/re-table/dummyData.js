/**
 * Detailed HTML template matching the exact requirements from user prompt:
 * Country Name: China | Tourist (Sticker)
 * Code: VI0005
 */
export const CHINA_TOURIST_CHECKLIST_HTML = `<h3>Visa Requirement</h3>
<ul>
  <li>Original Passport (Validity should be at least 06 months from the date of departure)</li>
  <li>Recent 33 cm x 48 cm size photo with white background (2 copies, mat paper)</li>
  <li>Visiting Card &amp; National ID Card</li>
  <li>N.O.C / G.O / Trade License (Notarized copy with English translation on letterhead pad)</li>
  <li>Original Bank Statement for last 6 months (Minimum balance: BDT 300,000)</li>
  <li>Bank Solvency Certificate</li>
  <li>Confirmed Return Air Ticket</li>
  <li>Student ID Card (if a child is traveling)</li>
  <li>Birth Certificate (for infants)</li>
  <li>Marriage Certificate (only for newly married couples)</li>
</ul>

<h3>Terms &amp; Conditions</h3>
<ul>
  <li>Visa fee is non-refundable, regardless of the outcome.</li>
  <li>Visa approval is at the sole discretion of the Embassy.</li>
  <li>Client must provide authentic and complete documents.</li>
  <li>We provide guidance, support, and document processing assistance only.</li>
  <li>Processing time may vary depending on Embassy operations</li>
</ul>

<p><strong>Processing time :</strong> 15 day (+ -)</p>

<h3>B2B Price</h3>
<ol>
  <li>Single Entry BDT= 9,500/- (China, Malaysia, Singapore, Schengen, Canada Visited After 2022)</li>
  <li>Single Entry BDT= 10,000/- (Any 3 Country Visited)</li>
  <li>Single Entry BDT= 11,000/- (Fresh Or Visited)</li>
  <li>06 Month Double Entry BDT= 11,500/- (Must Have 2 Single Entry Tourist Visa After 2022)</li>
  <li>01 Year Multiple Entry BDT= 15,500/- (Must Have 2 Double Entry Tourist Visa After 2022)</li>
  <li>02 Years Multiple Entry BDT= 17,000/- (Must Have 01 Year Multiple Tourist Visa After 2022)</li>
</ol>`;

export const getDefaultChecklistHTML = (country, visaType = 'Tourist') => `<h3>Visa Requirement</h3>
<ul>
  <li>Original Passport (Validity should be at least 06 months from departure date)</li>
  <li>Recent passport-size photograph with white background (2 copies)</li>
  <li>Visiting Card &amp; National ID Card copy</li>
  <li>Forwarding Letter / NOC on corporate pad or Trade License copy</li>
  <li>Last 6 months Bank Statement with official bank stamp &amp; seal</li>
  <li>Bank Solvency Certificate</li>
  <li>Roundtrip Flight Reservation &amp; Hotel Booking</li>
</ul>

<h3>Terms &amp; Conditions</h3>
<ul>
  <li>Visa processing fee is strictly non-refundable once submitted to the embassy.</li>
  <li>Visa issuance decisions are solely made by the respective embassy/consulate.</li>
  <li>Applicant is responsible for providing verified, legitimate documentation.</li>
</ul>

<p><strong>Processing time :</strong> 10-15 working days</p>

<h3>B2B Price</h3>
<ol>
  <li>Standard Processing BDT= 8,500/-</li>
  <li>Express Processing BDT= 12,000/-</li>
</ol>`;

/**
 * 25 realistic dummy entries matching the exact data shown in the provided image.
 */
export const VISA_CHECKLIST_DUMMY_DATA = [
  {
    id: 1,
    serialNumber: 1,
    country: 'China',
    countryCode: 'CN',
    visaType: 'Tourist (Sticker)',
    code: 'VI0005',
    title: 'China Tourist Visa Document Check List',
    status: 'Active',
    displayOrder: 1,
    createdDate: '2026-08-07',
    processingTime: '15 day (+ -)',
    description: CHINA_TOURIST_CHECKLIST_HTML,
  },
  {
    id: 2,
    serialNumber: 2,
    country: 'Japan',
    countryCode: 'JP',
    visaType: 'Single',
    code: 'VI0002',
    title: 'Japan Business Visa Requirements',
    status: 'Active',
    displayOrder: 2,
    createdDate: '2026-08-06',
    processingTime: '7-10 working days',
    description: getDefaultChecklistHTML('Japan', 'Business'),
  },
  {
    id: 3,
    serialNumber: 3,
    country: 'India',
    countryCode: 'IN',
    visaType: 'Multiple',
    code: 'VI0003',
    title: 'India Tourist Visa Document List',
    status: 'Active',
    displayOrder: 3,
    createdDate: '2026-08-06',
    processingTime: '5-7 working days',
    description: getDefaultChecklistHTML('India', 'Tourist'),
  },
  {
    id: 4,
    serialNumber: 4,
    country: 'Thailand',
    countryCode: 'TH',
    visaType: 'Single',
    code: 'VI0004',
    title: 'Thailand Tourist Visa Checklist',
    status: 'Active',
    displayOrder: 4,
    createdDate: '2026-08-05',
    processingTime: '5-7 working days',
    description: getDefaultChecklistHTML('Thailand', 'Tourist'),
  },
  {
    id: 5,
    serialNumber: 5,
    country: 'Malaysia',
    countryCode: 'MY',
    visaType: 'Multiple',
    code: 'VI0005M',
    title: 'Malaysia Business Visa Documents',
    status: 'Active',
    displayOrder: 5,
    createdDate: '2026-08-05',
    processingTime: '3-5 working days',
    description: getDefaultChecklistHTML('Malaysia', 'Business'),
  },
  {
    id: 6,
    serialNumber: 6,
    country: 'Singapore',
    countryCode: 'SG',
    visaType: 'Single',
    code: 'VI0006',
    title: 'Singapore Tourist Visa Requirement',
    status: 'Inactive',
    displayOrder: 6,
    createdDate: '2026-08-04',
    processingTime: '4-6 working days',
    description: getDefaultChecklistHTML('Singapore', 'Tourist'),
  },
  {
    id: 7,
    serialNumber: 7,
    country: 'UAE',
    countryCode: 'AE',
    visaType: 'Multiple',
    code: 'VI0007',
    title: 'UAE Visit Visa Document Checklist',
    status: 'Active',
    displayOrder: 7,
    createdDate: '2026-08-04',
    processingTime: '24-48 hours',
    description: getDefaultChecklistHTML('UAE', 'Visit'),
  },
  {
    id: 8,
    serialNumber: 8,
    country: 'Saudi Arabia',
    countryCode: 'SA',
    visaType: 'Multiple',
    code: 'VI0008',
    title: 'Saudi Arabia Business Visa Documents',
    status: 'Active',
    displayOrder: 8,
    createdDate: '2026-08-03',
    processingTime: '3-5 working days',
    description: getDefaultChecklistHTML('Saudi Arabia', 'Business'),
  },
  {
    id: 9,
    serialNumber: 9,
    country: 'United Kingdom',
    countryCode: 'GB',
    visaType: 'Single',
    code: 'VI0009',
    title: 'UK Tourist Visa Requirements',
    status: 'Active',
    displayOrder: 9,
    createdDate: '2026-08-02',
    processingTime: '15-20 working days',
    description: getDefaultChecklistHTML('United Kingdom', 'Tourist'),
  },
  {
    id: 10,
    serialNumber: 10,
    country: 'United States',
    countryCode: 'US',
    visaType: 'Multiple',
    code: 'VI0010',
    title: 'USA Business Visa Checklist',
    status: 'Active',
    displayOrder: 10,
    createdDate: '2026-08-02',
    processingTime: 'Interview appointment based',
    description: getDefaultChecklistHTML('United States', 'Business'),
  },
  {
    id: 11,
    serialNumber: 11,
    country: 'Canada',
    countryCode: 'CA',
    visaType: 'Multiple',
    code: 'VI0011',
    title: 'Canada Visitor Visa (V-1) Requirements',
    status: 'Active',
    displayOrder: 11,
    createdDate: '2026-08-01',
    processingTime: '20-30 working days',
    description: getDefaultChecklistHTML('Canada', 'Visitor'),
  },
  {
    id: 12,
    serialNumber: 12,
    country: 'Australia',
    countryCode: 'AU',
    visaType: 'Multiple',
    code: 'VI0012',
    title: 'Australia Subclass 600 Tourist Stream Document List',
    status: 'Active',
    displayOrder: 12,
    createdDate: '2026-07-30',
    processingTime: '15-25 working days',
    description: getDefaultChecklistHTML('Australia', 'Tourist'),
  },
  {
    id: 13,
    serialNumber: 13,
    country: 'France',
    countryCode: 'FR',
    visaType: 'Single',
    code: 'VI0013',
    title: 'Schengen France Tourist Visa Document Checklist',
    status: 'Active',
    displayOrder: 13,
    createdDate: '2026-07-28',
    processingTime: '15 working days',
    description: getDefaultChecklistHTML('France', 'Schengen'),
  },
  {
    id: 14,
    serialNumber: 14,
    country: 'Germany',
    countryCode: 'DE',
    visaType: 'Multiple',
    code: 'VI0014',
    title: 'Germany Business Visa & Invitation Checklist',
    status: 'Active',
    displayOrder: 14,
    createdDate: '2026-07-27',
    processingTime: '15 working days',
    description: getDefaultChecklistHTML('Germany', 'Business'),
  },
  {
    id: 15,
    serialNumber: 15,
    country: 'Italy',
    countryCode: 'IT',
    visaType: 'Single',
    code: 'VI0015',
    title: 'Italy Tourism & Visit Checklist',
    status: 'Inactive',
    displayOrder: 15,
    createdDate: '2026-07-25',
    processingTime: '15 working days',
    description: getDefaultChecklistHTML('Italy', 'Tourist'),
  },
  {
    id: 16,
    serialNumber: 16,
    country: 'Spain',
    countryCode: 'ES',
    visaType: 'Single',
    code: 'VI0016',
    title: 'Spain Schengen Visa Application Requirements',
    status: 'Active',
    displayOrder: 16,
    createdDate: '2026-07-24',
    processingTime: '15 working days',
    description: getDefaultChecklistHTML('Spain', 'Schengen'),
  },
  {
    id: 17,
    serialNumber: 17,
    country: 'Switzerland',
    countryCode: 'CH',
    visaType: 'Multiple',
    code: 'VI0017',
    title: 'Switzerland Tourist & Transit Visa Checklist',
    status: 'Active',
    displayOrder: 17,
    createdDate: '2026-07-22',
    processingTime: '10-15 working days',
    description: getDefaultChecklistHTML('Switzerland', 'Tourist'),
  },
  {
    id: 18,
    serialNumber: 18,
    country: 'South Korea',
    countryCode: 'KR',
    visaType: 'Single',
    code: 'VI0018',
    title: 'South Korea K-ETA & Embassy Visa Checklist',
    status: 'Active',
    displayOrder: 18,
    createdDate: '2026-07-20',
    processingTime: '7-10 working days',
    description: getDefaultChecklistHTML('South Korea', 'Tourist'),
  },
  {
    id: 19,
    serialNumber: 19,
    country: 'Turkey',
    countryCode: 'TR',
    visaType: 'Multiple',
    code: 'VI0019',
    title: 'Turkey Electronic Visa & Sticker Visa Documents',
    status: 'Active',
    displayOrder: 19,
    createdDate: '2026-07-18',
    processingTime: '24-72 hours',
    description: getDefaultChecklistHTML('Turkey', 'eVisa'),
  },
  {
    id: 20,
    serialNumber: 20,
    country: 'Qatar',
    countryCode: 'QA',
    visaType: 'Single',
    code: 'VI0020',
    title: 'Qatar Hayya Entry & Tourist Visa Checklist',
    status: 'Active',
    displayOrder: 20,
    createdDate: '2026-07-15',
    processingTime: '24-48 hours',
    description: getDefaultChecklistHTML('Qatar', 'Tourist'),
  },
  {
    id: 21,
    serialNumber: 21,
    country: 'Oman',
    countryCode: 'OM',
    visaType: 'Multiple',
    code: 'VI0021',
    title: 'Oman Royal Police Tourist eVisa Requirements',
    status: 'Inactive',
    displayOrder: 21,
    createdDate: '2026-07-12',
    processingTime: '2-4 working days',
    description: getDefaultChecklistHTML('Oman', 'eVisa'),
  },
  {
    id: 22,
    serialNumber: 22,
    country: 'Vietnam',
    countryCode: 'VN',
    visaType: 'Single',
    code: 'VI0022',
    title: 'Vietnam Tourist eVisa Document Requirements',
    status: 'Active',
    displayOrder: 22,
    createdDate: '2026-07-10',
    processingTime: '3-5 working days',
    description: getDefaultChecklistHTML('Vietnam', 'eVisa'),
  },
  {
    id: 23,
    serialNumber: 23,
    country: 'Egypt',
    countryCode: 'EG',
    visaType: 'Single',
    code: 'VI0023',
    title: 'Egypt Consular Visa Application Checklist',
    status: 'Active',
    displayOrder: 23,
    createdDate: '2026-07-08',
    processingTime: '7-10 working days',
    description: getDefaultChecklistHTML('Egypt', 'Tourist'),
  },
  {
    id: 24,
    serialNumber: 24,
    country: 'Brazil',
    countryCode: 'BR',
    visaType: 'Multiple',
    code: 'VI0024',
    title: 'Brazil VIVIS Visitor Visa Checklist',
    status: 'Active',
    displayOrder: 24,
    createdDate: '2026-07-05',
    processingTime: '10-15 working days',
    description: getDefaultChecklistHTML('Brazil', 'Visitor'),
  },
  {
    id: 25,
    serialNumber: 25,
    country: 'South Africa',
    countryCode: 'ZA',
    visaType: 'Multiple',
    code: 'VI0025',
    title: 'South Africa Visitor Visa Document Checklist',
    status: 'Inactive',
    displayOrder: 25,
    createdDate: '2026-07-01',
    processingTime: '15-20 working days',
    description: getDefaultChecklistHTML('South Africa', 'Visitor'),
  },
];
