/**
 * Marketing Feature Storage & API Layer
 * Manages promotional SMS & Email campaigns, templates, customer lists,
 * and delivery stats with LocalStorage persistence.
 */

import { apiClient } from '../../services/apiClient'
import { config } from '../../app/config'

const STORAGE_KEY = 'abl_marketing_data_v3';

// Seed initial customers (First 10 match Image 1 exactly, followed by realistic generated records up to 1,250)
const SEED_CUSTOMERS_BASE = [
  { id: 1, name: 'Rahim Ahmed', phone: '01711111111', email: 'rahim@gmail.com' },
  { id: 2, name: 'ABC Travels', phone: '01822222222', email: 'abc@travels.com' },
  { id: 3, name: 'Nusrat Jahan', phone: '01933333333', email: 'nusrat@gmail.com' },
  { id: 4, name: 'Global Tours Agency', phone: '01844444444', email: 'info@globaltours.com' },
  { id: 5, name: 'Imran Hossain', phone: '01755555555', email: 'imran@gmail.com' },
  { id: 6, name: 'Hasan Travel', phone: '01866666666', email: 'hasan@travel.com' },
  { id: 7, name: 'Sadia Rahman', phone: '01777777777', email: 'sadia@gmail.com' },
  { id: 8, name: 'Dream Holiday', phone: '01888888888', email: 'contact@dream.com' },
  { id: 9, name: 'Tanvir Hossain', phone: '01999999999', email: 'tanvir@gmail.com' },
  { id: 10, name: 'Eastern Tours', phone: '01812345678', email: 'eastern@tours.com' },
];

const FIRST_NAMES = [
  'Kamal', 'Farhana', 'Mehedi', 'Jannatul', 'Sabbir', 'Rashed', 'Sharmin', 'Arif',
  'Tasnim', 'Mahmud', 'Sumaiya', 'Anik', 'Nabila', 'Fahim', 'Shamima', 'Zubair',
  'Shakil', 'Tahmina', 'Monir', 'Laila', 'Shakib', 'Rifat', 'Nafisa', 'Babul'
];
const LAST_NAMES = [
  'Khan', 'Islam', 'Chowdhury', 'Uddin', 'Haque', 'Sarker', 'Bhuiyan', 'Mia',
  'Begum', 'Akter', 'Rahman', 'Ali', 'Hasan', 'Ahmed', 'Talukdar', 'Gazi'
];
const AGENCIES = [
  'Sky Line Travels', 'Dhaka Holidays', 'Padma Tourism', 'Bengal Wings', 'City Express Tours',
  'Sonargaon Travel', 'Meghna Airways', 'Green Valley Agency', 'Continental Travels', 'Surma Tours'
];

const SERVICES = ['Visa', 'Tour Package', 'Air Ticket', 'Hotel']

function decorateCustomer(customer, index = 0) {
  const looksLikeAgency = /travel|tours|airways|agency|holidays|voyage|trip/i.test(customer.name || '')
  return {
    ...customer,
    type: customer.type || (looksLikeAgency ? 'B2B' : 'B2C'),
    service: customer.service || SERVICES[index % SERVICES.length],
    consent: customer.consent || {
      sms: (index + 1) % 19 !== 0,
      email: (index + 1) % 23 !== 0,
    },
    optedOut: customer.optedOut ?? false,
  }
}

function generateCustomers(total = 1250) {
  const list = [...SEED_CUSTOMERS_BASE];
  const totalToAdd = total - SEED_CUSTOMERS_BASE.length;

  for (let i = 0; i < totalToAdd; i++) {
    const id = i + 11;
    const isAgency = i % 5 === 0;
    let name = '';
    let email = '';

    if (isAgency) {
      const baseAgency = AGENCIES[i % AGENCIES.length];
      const suffix = Math.floor(i / AGENCIES.length) + 1;
      name = suffix > 1 ? `${baseAgency} ${suffix}` : baseAgency;
      email = `info@${baseAgency.toLowerCase().replace(/[^a-z]/g, '')}${suffix > 1 ? suffix : ''}.com`;
    } else {
      const fn = FIRST_NAMES[i % FIRST_NAMES.length];
      const ln = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
      name = `${fn} ${ln}`;
      email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i % 7 ? (i % 89) + 1 : ''}@gmail.com`;
    }

    const prefixes = ['017', '018', '019', '016', '015', '013'];
    const prefix = prefixes[i % prefixes.length];
    const phone = `${prefix}${String(10000000 + (i * 37) % 89999999).slice(0, 8)}`;

    list.push(decorateCustomer({ id, name, phone, email, type: isAgency ? 'B2B' : 'B2C' }, i + 10));
  }

  return list.map(decorateCustomer);
}

export const DEFAULT_TEMPLATES = [
  {
    id: 'tmpl-china-visa',
    name: 'Special China Visa Offer',
    type: 'both',
    subject: 'Special China Visa Offer for You',
    smsBody: 'Dear {CustomerName}, Special offer on China Visa processing with ABL Travels! Express processing, expert support & high approval rate. Call +880 1711-111111.',
    emailSubject: 'Special China Visa Offer for You',
    emailBodyHtml: `<p>Dear {CustomerName},</p>
<p>We are pleased to inform you about our special China visa processing offer. Get reliable service, expert guidance and hassle-free processing with ABL Travels.</p>
<p>If you have any questions, feel free to contact us.</p>
<p>Best regards,<br/><strong>ABL Travels</strong><br/>House #1/B, Road #126, Gulshan 01, Dhaka 1212<br/>+880 1XXX-XXXXXX</p>`,
  },
  {
    id: 'tmpl-thailand-tour',
    name: 'Explore Thailand Tour Packages',
    type: 'both',
    subject: 'Explore Thailand Tour Packages with Exclusive Discounts!',
    smsBody: 'Dear {CustomerName}, Explore Bangkok & Phuket with ABL Travels 5D4N tour package from ৳32,000! Limited slots. Call +880 1711-111111.',
    emailSubject: 'Explore Thailand Tour Packages with Exclusive Discounts!',
    emailBodyHtml: `<p>Dear {CustomerName},</p>
<p>Get ready for an unforgettable journey! ABL Travels brings you exclusive Thailand vacation packages covering Bangkok and Pattaya at special promotional rates.</p>
<p>Package includes flights, 4-star accommodation, guided sightseeing, and daily breakfast.</p>
<p>Warm regards,<br/><strong>ABL Travels Tour Department</strong><br/>+880 1XXX-XXXXXX</p>`,
  },
  {
    id: 'tmpl-eid-special',
    name: 'Eid Special Travel Offer',
    type: 'both',
    subject: 'Eid Special Travel Offer for You & Family',
    smsBody: 'Dear {CustomerName}, Eid Mubarak! Book your family holiday flight & hotel packages with ABL Travels and get up to 15% discount. Call +880 1711-111111.',
    emailSubject: 'Eid Special Travel Offer for You & Family',
    emailBodyHtml: `<p>Dear {CustomerName},</p>
<p>Celebrate Eid with your loved ones in your dream destination. Enjoy our special curated holiday packages with early-bird discounts.</p>
<p>Book before the holiday rush to lock in the best airfares and hotel deals.</p>
<p>Warm regards,<br/><strong>ABL Travels Team</strong></p>`,
  },
  {
    id: 'tmpl-malaysia-evisa',
    name: 'Malaysia E-Visa Update',
    type: 'both',
    subject: 'Malaysia E-Visa Fast-Track Processing Available',
    smsBody: 'Dear {CustomerName}, Malaysia e-Visa processing now open with fast 48-hr approval assistance at ABL Travels. Contact +880 1711-111111.',
    emailSubject: 'Malaysia E-Visa Fast-Track Processing Available',
    emailBodyHtml: `<p>Dear {CustomerName},</p>
<p>We are excited to announce fast-track assistance for Malaysia e-Visa applications. Hassle-free submission and timely updates for your leisure or business trip.</p>
<p>Contact our visa experts today to begin your application.</p>
<p>Best regards,<br/><strong>ABL Travels Visa Wing</strong></p>`,
  },
  {
    id: 'tmpl-umrah-group',
    name: 'Premium Umrah Group Package',
    type: 'both',
    subject: 'Premium Umrah Group Package - Booking Open',
    smsBody: 'Dear {CustomerName}, Complete 14-day Umrah package with 5-star hotel near Haram & direct flights. Contact ABL Travels: +880 1711-111111.',
    emailSubject: 'Premium Umrah Group Package - Booking Open',
    emailBodyHtml: `<p>Dear {CustomerName},</p>
<p>Embark on a sacred journey with our spiritually uplifting Umrah packages. Includes direct flight, luxury accommodation close to the Haram Sharif, and dedicated local guide.</p>
<p>May your prayers be answered.</p>
<p>Best regards,<br/><strong>ABL Travels Religious Tourism</strong></p>`,
  },
];

const SEED_CAMPAIGNS = [
  {
    id: 'camp-1',
    date: '20 Oct 2025, 10:30 AM',
    type: 'SMS',
    message: 'Special China Visa processing offer...',
    subject: 'Special China Visa processing offer',
    content: 'Special China Visa processing offer with ABL Travels! Express processing, document vetting & 99% approval rate. Call +880 1711-111111.',
    recipients: 350,
    sent: 350,
    status: 'Completed',
    recipientName: 'China Visa Batch A',
  },
  {
    id: 'camp-2',
    date: '18 Oct 2025, 03:15 PM',
    type: 'Email',
    message: 'Explore Thailand Tour Packages...',
    subject: 'Explore Thailand Tour Packages with Exclusive Discounts!',
    content: 'Explore Thailand with our exclusive 5D4N tour package covering Bangkok and Pattaya at special promotional rates starting from ৳32,000.',
    recipients: 420,
    sent: 420,
    status: 'Completed',
    recipientName: 'Thailand Leisure Group',
  },
  {
    id: 'camp-3',
    date: '15 Oct 2025, 11:20 AM',
    type: 'SMS',
    message: 'Eid special travel offer for you...',
    subject: 'Eid special travel offer for you',
    content: 'Eid Mubarak! Book your family holiday flight & hotel packages with ABL Travels and get up to 15% discount on all tours.',
    recipients: 280,
    sent: 275,
    status: 'Completed',
    recipientName: 'Eid Holiday Subscribers',
  },
  {
    id: 'camp-4',
    date: '10 Oct 2025, 09:45 AM',
    type: 'Email',
    message: 'Malaysia e-visa update...',
    subject: 'Malaysia E-Visa Fast-Track Processing Available',
    content: 'Fast-track Malaysia e-Visa processing now available at ABL Travels. 48-hour submission turnaround with complete document verification.',
    recipients: 500,
    sent: 472,
    status: 'Completed',
    recipientName: 'Frequent Flyer & Agent Network',
  },
  {
    id: 'camp-5',
    date: '05 Oct 2025, 02:10 PM',
    type: 'Email',
    message: 'Discover our new destinations...',
    subject: 'Discover our new destinations this autumn',
    content: 'Discover exciting new travel routes across Central Asia and Caucasus with ABL Travels guided group tours.',
    recipients: 300,
    sent: 289,
    status: 'Processing',
    recipientName: 'All Registered Travelers',
  },
];

function getInitialState() {
  return {
    metrics: {
      totalCustomers: 1250,
      smsSentMonth: 342,
      emailsSentMonth: 186,
    },
    customers: generateCustomers(1250),
    campaigns: SEED_CAMPAIGNS,
    templates: DEFAULT_TEMPLATES,
  };
}

function loadMarketingState() {
  if (!config.enableMocks) return getInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = getInitialState();
      saveMarketingState(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw);
    // Ensure data integrity
    if (!parsed.customers || parsed.customers.length === 0) {
      parsed.customers = generateCustomers(1250);
    } else {
      parsed.customers = parsed.customers.map(decorateCustomer);
    }
    if (!parsed.campaigns) {
      parsed.campaigns = SEED_CAMPAIGNS;
    } else {
      parsed.campaigns = parsed.campaigns.map((campaign) => ({
        delivered: campaign.sent ?? campaign.recipients ?? 0,
        failed: 0,
        ...campaign,
      }))
    }
    if (!parsed.templates) {
      parsed.templates = DEFAULT_TEMPLATES;
    }
    if (!parsed.metrics) {
      parsed.metrics = {
        totalCustomers: parsed.customers.length,
        smsSentMonth: 342,
        emailsSentMonth: 186,
      };
    }
    return parsed;
  } catch (err) {
    console.error('Error loading marketing state:', err);
    return getInitialState();
  }
}

function saveMarketingState(state) {
  if (!config.enableMocks) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving marketing state:', err);
  }
}

export const marketingApi = {
  getOverview: async () => {
    if (!config.enableMocks) {
      const res = await apiClient.get('/marketing/overview')
      const payload = res?.data ?? res
      return { success: true, data: payload }
    }
    const state = loadMarketingState();
    return {
      success: true,
      data: {
        metrics: { ...state.metrics, totalCustomers: state.customers.length },
        recentCampaigns: state.campaigns,
        templates: state.templates,
      },
    };
  },

  getCustomers: async ({ page = 1, pageSize = 10, search = '', type = '', service = '' } = {}) => {
    if (!config.enableMocks) {
      const res = await apiClient.get('/marketing/customers', {
        params: { page, limit: pageSize, search: search || undefined, type: type || undefined, service: service || undefined }
      })
      const payload = res?.data ?? res
      return {
        success: true,
        data: {
          customers: payload.customers || [],
          totalCount: payload.totalCount || 0,
          page: payload.page || page,
          pageSize: payload.pageSize || pageSize,
          totalPages: payload.totalPages || 1,
        },
      }
    }
    const state = loadMarketingState();
    let list = state.customers;

    if (type) list = list.filter((customer) => customer.type === type)
    if (service) list = list.filter((customer) => customer.service === service)

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    const totalCount = list.length;
    const start = (page - 1) * pageSize;
    const paginated = list.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        customers: paginated,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  },

  getAllCustomers: async ({ type = '', service = '' } = {}) => {
    if (!config.enableMocks) {
      const res = await apiClient.get('/marketing/customers/all', {
        params: { type: type || undefined, service: service || undefined }
      })
      const payload = res?.data ?? res
      return { success: true, data: payload }
    }
    const state = loadMarketingState()
    let list = state.customers
    if (type) list = list.filter((customer) => customer.type === type)
    if (service) list = list.filter((customer) => customer.service === service)
    return { success: true, data: list }
  },

  sendSms: async ({ customerId: _customerId, customerName, phone, message, templateId: _templateId }) => {
    if (!config.enableMocks) {
      const res = await apiClient.post('/marketing/send-sms', {
        customerId: _customerId ? String(_customerId) : undefined,
        customerName,
        phone,
        message,
        templateId: _templateId ? String(_templateId) : undefined
      })
      const payload = res?.data ?? res
      return { success: true, data: payload }
    }
    const state = loadMarketingState();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + `, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const newCampaign = {
      id: `camp-${Date.now()}`,
      date: dateStr,
      type: 'SMS',
      message: message.length > 40 ? `${message.slice(0, 37)}...` : message,
      subject: `SMS to ${customerName}`,
      content: message,
      recipients: 1,
      sent: 1,
      delivered: 1,
      failed: 0,
      status: 'Completed',
      recipientName: `${customerName} (${phone})`,
      scheduledAt: null,
    };

    state.campaigns.unshift(newCampaign);
    state.metrics.smsSentMonth = (state.metrics.smsSentMonth || 0) + 1;
    saveMarketingState(state);

    return { success: true, data: newCampaign };
  },

  sendEmail: async ({ customerId: _customerId, customerName, email, subject, message, sendCopyToMe = false, templateId: _templateId }) => {
    if (!config.enableMocks) {
      const res = await apiClient.post('/marketing/send-email', {
        customerId: _customerId ? String(_customerId) : undefined,
        customerName,
        email,
        subject,
        message,
        sendCopyToMe,
        templateId: _templateId ? String(_templateId) : undefined
      })
      const payload = res?.data ?? res
      return { success: true, data: payload }
    }
    const state = loadMarketingState();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + `, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const plainText = message.replace(/<[^>]+>/g, '').trim();
    const summary = plainText.length > 40 ? `${plainText.slice(0, 37)}...` : plainText;

    const newCampaign = {
      id: `camp-${Date.now()}`,
      date: dateStr,
      type: 'Email',
      message: summary || subject,
      subject: subject || 'Promotional Offer',
      content: message,
      recipients: sendCopyToMe ? 2 : 1,
      sent: sendCopyToMe ? 2 : 1,
      delivered: sendCopyToMe ? 2 : 1,
      failed: 0,
      status: 'Completed',
      recipientName: `${customerName} (${email})`,
      scheduledAt: null,
    };

    state.campaigns.unshift(newCampaign);
    state.metrics.emailsSentMonth = (state.metrics.emailsSentMonth || 0) + 1;
    saveMarketingState(state);

    return { success: true, data: newCampaign };
  },

  sendBulkCampaign: async ({
    type,
    recipientCount,
    recipients,
    subject,
    message,
    campaignName,
    scheduledAt = '',
    templateId = '',
  }) => {
    if (!config.enableMocks) {
      const res = await apiClient.post('/marketing/campaigns', {
        type,
        recipientCount,
        recipients,
        subject,
        message,
        campaignName,
        scheduledAt: scheduledAt || undefined,
        templateId: templateId || undefined
      })
      const payload = res?.data ?? res
      return { success: true, data: payload }
    }
    const state = loadMarketingState();
    const now = new Date();
    const formatDate = (date) =>
      date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      `, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const unique = []
    const seen = new Set()
    for (const recipient of recipients || []) {
      const key = String(recipient.id ?? recipient.phone ?? recipient.email ?? '')
      if (!key || seen.has(key)) continue
      seen.add(key)
      unique.push(recipient)
    }

    const count = unique.length || Number(recipientCount) || 1
    if (count > 2000) throw new Error('A single campaign can have at most 2,000 recipients.')
    const scheduled = scheduledAt ? new Date(scheduledAt) : null
    const isScheduled = scheduled && scheduled.getTime() > Date.now()
    const plainText = String(message || '').replace(/<[^>]+>/g, '').trim()
    const summary = plainText.length > 40 ? `${plainText.slice(0, 37)}...` : plainText
    const channel = type === 'SMS' ? 'SMS' : 'Email'

    const newCampaign = {
      id: `camp-${Date.now()}`,
      date: formatDate(isScheduled ? scheduled : now),
      type: channel,
      message: summary || subject,
      subject: subject || (channel === 'SMS' ? 'Promotional SMS' : 'Promotional Email'),
      content: message,
      recipients: count,
      sent: isScheduled ? 0 : count,
      delivered: isScheduled ? 0 : count,
      failed: 0,
      status: isScheduled ? 'Scheduled' : 'Completed',
      recipientName: campaignName || `Bulk ${channel} (${count} customers)`,
      scheduledAt: isScheduled ? scheduled.toISOString() : null,
      templateId: templateId || null,
      recipientIds: unique.map((recipient) => recipient.id),
    };

    state.campaigns.unshift(newCampaign);
    if (!isScheduled) {
      if (channel === 'SMS') {
        state.metrics.smsSentMonth = (state.metrics.smsSentMonth || 0) + count;
      } else {
        state.metrics.emailsSentMonth = (state.metrics.emailsSentMonth || 0) + count;
      }
    }
    saveMarketingState(state);

    return { success: true, data: newCampaign };
  },

  retryFailedCampaign: async (campaignId) => {
    if (!config.enableMocks) {
      const res = await apiClient.post(`/marketing/campaigns/${campaignId}/retry`)
      const payload = res?.data ?? res
      return { success: true, data: payload }
    }
    const state = loadMarketingState()
    const campaign = state.campaigns.find((item) => item.id === campaignId)
    if (!campaign) throw new Error('Campaign not found.')
    campaign.failed = 0
    campaign.delivered = campaign.sent
    campaign.status = 'Completed'
    saveMarketingState(state)
    return { success: true, data: campaign }
  },

  saveTemplate: async (template) => {
    if (!config.enableMocks) {
      const res = await apiClient.post('/marketing/templates', template)
      const payload = res?.data ?? res
      return { success: true, data: payload }
    }
    const state = loadMarketingState();
    const existingIndex = state.templates.findIndex((t) => t.id === template.id);
    if (existingIndex >= 0) {
      state.templates[existingIndex] = { ...state.templates[existingIndex], ...template };
    } else {
      state.templates.push({
        id: template.id || `tmpl-${Date.now()}`,
        ...template,
      });
    }
    saveMarketingState(state);
    return { success: true, data: state.templates };
  },

  deleteTemplate: async (templateId) => {
    if (!config.enableMocks) {
      const res = await apiClient.delete(`/marketing/templates/${templateId}`)
      const payload = res?.data ?? res
      return { success: true, data: payload }
    }
    const state = loadMarketingState();
    state.templates = state.templates.filter((t) => t.id !== templateId);
    saveMarketingState(state);
    return { success: true, data: state.templates };
  },

  resetMarketingData: async () => {
    const fresh = getInitialState();
    saveMarketingState(fresh);
    return { success: true, data: fresh };
  },
};
