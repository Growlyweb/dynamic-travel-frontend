import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  MessageSquare,
  Mail,
  Search,
  Send,
  Calendar,
  Bell,
  ChevronDown,
  Info,
  CheckCircle2,
  Settings,
  Eye,
  Check,
  X,
} from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import {
  Table,
  TableCard,
  TablePagination,
  TableBadge,
} from '@/components/re-table';

import SendEmailModal from '../components/SendEmailModal';
import SendSmsModal from '../components/SendSmsModal';
import CampaignDetailsModal from '../components/CampaignDetailsModal';
import ManageTemplatesModal from '../components/ManageTemplatesModal';
import { marketingApi } from '../marketing.api';

export default function ReportMarketing() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalCustomers: 1250,
    smsSentMonth: 342,
    emailsSentMonth: 186,
  });
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Customer List Table State
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(1250);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(1); // default Rahim Ahmed

  // Right Panel "Send Message" State
  const [activeTab, setActiveTab] = useState('sms'); // 'sms' | 'email'
  // SMS Panel fields
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  // Email Panel fields
  const [emailSubject, setEmailSubject] = useState('Special China Visa Offer for You');
  const [emailTemplateId, setEmailTemplateId] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Modals
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [modalCustomer, setModalCustomer] = useState(null);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  // Floating Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Overview (Metrics, Campaigns, Templates)
  const loadOverview = useCallback(async () => {
    try {
      const res = await marketingApi.getOverview();
      if (res.success) {
        setMetrics(res.data.metrics);
        setCampaigns(res.data.recentCampaigns);
        setTemplates(res.data.templates);
      }
    } catch (err) {
      console.error('Failed to load marketing overview:', err);
    }
  }, []);

  // Load Customers
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketingApi.getCustomers({ page, pageSize, search });
      if (res.success) {
        setCustomers(res.data.customers);
        setTotalCount(res.data.totalCount);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Find currently selected customer object
  const currentSelectedCustomer = useMemo(() => {
    return (
      customers.find((c) => c.id === selectedCustomerId) ||
      customers[0] || {
        id: 1,
        name: 'Rahim Ahmed',
        phone: '01711111111',
        email: 'mdmofazzalhossain789@gmail.com',
      }
    );
  }, [customers, selectedCustomerId]);

  // Handle right-panel template change
  const handlePanelTemplateChange = (tmplId) => {
    setEmailTemplateId(tmplId);
    if (!tmplId) return;
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl) {
      setEmailSubject(tmpl.emailSubject || tmpl.subject || '');
      const custName = currentSelectedCustomer?.name || 'Customer';
      const body = (tmpl.emailBodyHtml || tmpl.emailBody || tmpl.smsBody || '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/\{CustomerName\}|\{name\}/g, custName)
        .trim();
      setEmailMessage(body);
    }
  };

  // Table Action: Click SMS -> Open SMS Modal
  const handleOpenSmsModal = (customer, e) => {
    e?.stopPropagation();
    setModalCustomer(customer);
    setSmsModalOpen(true);
  };

  // Table Action: Click Email -> Open Email Modal
  const handleOpenEmailModal = (customer, e) => {
    e?.stopPropagation();
    setModalCustomer(customer);
    setEmailModalOpen(true);
  };

  // Modal Send SMS Callback
  const handleSendSmsFromModal = async (data) => {
    const res = await marketingApi.sendSms(data);
    if (res.success) {
      showToast(`SMS sent successfully to ${data.customerName}!`);
      loadOverview();
    }
  };

  // Modal Send Email Callback
  const handleSendEmailFromModal = async (data) => {
    const res = await marketingApi.sendEmail(data);
    if (res.success) {
      showToast(`Email sent successfully to ${data.customerName}!`);
      loadOverview();
    }
  };

  // Right Panel: Send SMS
  const handlePanelSendSms = async (e) => {
    e.preventDefault();
    if (!smsMessage.trim()) {
      showToast('Please type a message before sending.', 'error');
      return;
    }

    setSendingSms(true);
    try {
      const targetCustomer = currentSelectedCustomer;
      const res = await marketingApi.sendSms({
        customerId: targetCustomer.id,
        customerName: targetCustomer.name,
        phone: targetCustomer.phone,
        message: smsMessage,
      });

      if (res.success) {
        showToast(`SMS sent successfully to ${targetCustomer.name}!`);
        setSmsMessage('');
        loadOverview();
      }
    } catch (err) {
      showToast(err.message || 'Failed to send SMS.', 'error');
    } finally {
      setSendingSms(false);
    }
  };

  // Right Panel: Send Email
  const handlePanelSendEmail = async (e) => {
    e.preventDefault();
    if (!emailSubject.trim()) {
      showToast('Please enter an email subject.', 'error');
      return;
    }
    if (!emailMessage.trim()) {
      showToast('Please type an email message.', 'error');
      return;
    }

    setSendingEmail(true);
    try {
      const targetCustomer = currentSelectedCustomer;
      const res = await marketingApi.sendEmail({
        customerId: targetCustomer.id,
        customerName: targetCustomer.name,
        email: targetCustomer.email,
        subject: emailSubject,
        message: emailMessage,
        sendCopyToMe: true,
      });

      if (res.success) {
        showToast(`Email sent successfully to ${targetCustomer.name}!`);
        setEmailMessage('');
        loadOverview();
      }
    } catch (err) {
      showToast(err.message || 'Failed to send email.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Character counter for right panel SMS
  const smsCharCount = smsMessage.length;
  const smsCount = Math.max(1, Math.ceil(smsCharCount / 160));

  // Customer List Columns configured for ReTable / Table reference
  const customerColumns = useMemo(
    () => [
      {
        key: 'serialNumber',
        header: '#',
        width: '56px',
        align: 'left',
        render: (row, idx) => (
          <span className="text-slate-600 font-normal text-sm">
            {(page - 1) * pageSize + idx + 1}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Customer Name',
        render: (row) => {
          const isSelected = selectedCustomerId === row.id;
          return (
            <div className="flex items-center gap-2">
              {isSelected && (
                <span className="size-2 rounded-full bg-[#0066FF] shrink-0" title="Selected" />
              )}
              <span
                className={`text-sm ${isSelected ? 'font-bold text-[#0066FF]' : 'font-semibold text-slate-900'
                  }`}
              >
                {row.name}
              </span>
            </div>
          );
        },
      },
      {
        key: 'phone',
        header: 'Phone Number',
        render: (row) => (
          <span className="text-slate-600 font-mono text-sm">{row.phone}</span>
        ),
      },
      {
        key: 'email',
        header: 'Email Address',
        render: (row) => (
          <span className="text-slate-600 text-sm truncate block max-w-[220px]">
            {row.email}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        width: '180px',
        align: 'center',
        render: (row) => (
          <div className="inline-flex items-center gap-2 justify-center">
            {/* SMS Button */}
            <button
              type="button"
              onClick={(e) => handleOpenSmsModal(row, e)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-[#0066FF] bg-[#EBF5FF] border border-[#DBEAFE] hover:bg-[#DBEAFE] transition-colors shadow-2xs cursor-pointer"
              title={`Send SMS to ${row.name}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>SMS</span>
            </button>

            {/* Email Button */}
            <button
              type="button"
              onClick={(e) => handleOpenEmailModal(row, e)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              title={`Send Email to ${row.name}`}
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Email</span>
            </button>
          </div>
        ),
      },
    ],
    [page, pageSize, selectedCustomerId]
  );

  // Recent Campaigns Columns configured for ReTable / Table reference
  const campaignColumns = useMemo(
    () => [
      {
        key: 'serialNumber',
        header: '#',
        width: '56px',
        align: 'left',
        render: (row, idx) => (
          <span className="text-slate-600 font-normal text-sm">{idx + 1}</span>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        width: '180px',
        render: (row) => (
          <span className="text-slate-700 text-sm font-normal whitespace-nowrap">
            {row.date}
          </span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        width: '110px',
        render: (row) => (
          <TableBadge
            type="pill"
            variant={row.type === 'SMS' ? 'blue' : 'purple'}
          >
            {row.type}
          </TableBadge>
        ),
      },
      {
        key: 'message',
        header: 'Message / Subject',
        render: (row) => (
          <span className="text-slate-800 text-sm font-medium truncate block max-w-md">
            {row.message || row.subject}
          </span>
        ),
      },
      {
        key: 'recipients',
        header: 'Recipients',
        width: '110px',
        align: 'center',
        render: (row) => (
          <span className="text-slate-800 font-semibold text-sm">
            {row.recipients}
          </span>
        ),
      },
      {
        key: 'sent',
        header: 'Sent',
        width: '110px',
        align: 'center',
        render: (row) => (
          <span className="text-emerald-700 font-semibold text-sm">
            {row.sent}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '130px',
        align: 'center',
        render: (row) => (
          <TableBadge
            type="status"
            variant={row.status.toLowerCase() === 'completed' ? 'active' : 'pending'}
          >
            {row.status}
          </TableBadge>
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        width: '120px',
        align: 'center',
        render: (row) => (
          <button
            type="button"
            onClick={() => {
              setSelectedCampaign(row);
              setCampaignModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-[#0066FF] hover:bg-[#0055D6] transition-colors shadow-2xs cursor-pointer"
            title="View Campaign Details"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-xl animate-in slide-in-from-top-3 duration-200">
          <div
            className={`size-6 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error'
              ? 'bg-rose-100 text-rose-600'
              : 'bg-emerald-100 text-emerald-600'
              }`}
          >
            {toast.type === 'error' ? '✕' : <Check className="size-3.5 stroke-[3]" />}
          </div>
          <span className="text-xs font-semibold text-slate-800">{toast.message}</span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Marketing"
          breadcrumbs={[
            { label: 'Reports', to: '/reports/overview' },
            { label: 'Marketing' },
          ]}
        />
      </div>

      {/* 1. Metric Cards (Matching design language) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Customers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4.5 hover:shadow-sm transition-shadow">
          <div className="size-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="size-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">Total Customers</span>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight block mt-0.5">
              {metrics.totalCustomers.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 2: SMS Sent (This Month) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4.5 hover:shadow-sm transition-shadow">
          <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageSquare className="size-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">SMS Sent (This Month)</span>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight block mt-0.5">
              {metrics.smsSentMonth.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 3: Emails Sent (This Month) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4.5 hover:shadow-sm transition-shadow">
          <div className="size-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Mail className="size-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">Emails Sent (This Month)</span>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight block mt-0.5">
              {metrics.emailsSentMonth.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Middle Section: Customer List + Send Message Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer List Table (7 cols) using reference TableCard & Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
          {/* Header with Title and Search Toolbar matching TableToolbar style */}
          <div className="flex flex-row sm:flex-row sm:items-center justify-between gap-3">
            <div className='shrink-0'>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                Customer List
              </h3>
              {/* <p className="text-sm text-slate-500 font-normal mt-0.5">
                Select a customer to send SMS or email.
              </p> */}
            </div>

            {/* Search Box matching reference table toolbar */}
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name or phone..."
                className="w-full pl-10 pr-9 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Reference Table without checkboxes */}
          <Table
            columns={customerColumns}
            data={customers}
            loading={loading}
            rowKey="id"
            onRowClick={(row) => setSelectedCustomerId(row.id)}
            emptyText="No customers found"
            emptyDescription={`No records matched "${search}". Try adjusting your search.`}
          />

          {/* Reference TablePagination */}
          <TablePagination
            currentPage={page}
            totalEntries={totalCount}
            pageSize={pageSize}
            itemLabel="customers"
            onPageChange={(p) => setPage(p)}
          />
        </div>

        {/* Right Column: Send Message Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3.5">
              Send Message
            </h3>

            {/* Tab switchers: Send SMS | Send Email */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('sms')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'sms'
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <MessageSquare className="size-3.5" />
                <span>Send SMS</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'email'
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <Mail className="size-3.5" />
                <span>Send Email</span>
              </button>
            </div>

            {/* TAB 1: SEND SMS FORM */}
            {activeTab === 'sms' && (
              <form onSubmit={handlePanelSendSms} className="space-y-4">
                {/* Select Customer */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Customer
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                      className="w-full pl-9 pr-8 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer truncate"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                    <Users className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="size-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Message</label>
                    {templates.length > 0 && (
                      <select
                        onChange={(e) => {
                          const tmpl = templates.find((t) => t.id === e.target.value);
                          if (tmpl) {
                            const txt = (tmpl.smsBody || tmpl.content || '').replace(
                              /\{CustomerName\}|\{name\}/g,
                              currentSelectedCustomer.name
                            );
                            setSmsMessage(txt);
                          }
                        }}
                        className="text-xs text-[#0066FF] font-semibold bg-transparent border-0 cursor-pointer focus:outline-none hover:underline"
                      >
                        <option value="">Insert template...</option>
                        {templates.map((tmpl) => (
                          <option key={tmpl.id} value={tmpl.id}>
                            {tmpl.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs leading-relaxed"
                  />
                  {/* SMS Counter Helper */}
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span>{smsCharCount} characters</span>
                      <span className="text-slate-300">|</span>
                      <span>{smsCount} SMS (max 160 characters per SMS)</span>
                    </div>
                    <Info
                      className="size-3.5 text-[#0066FF] cursor-pointer"
                      title="1 SMS credit is used for each 160 characters"
                    />
                  </div>
                </div>

                {/* Submit Send SMS Button */}
                <button
                  type="submit"
                  disabled={sendingSms}
                  className="w-full mt-2 py-2.5 px-4 text-sm font-semibold text-white bg-[#0066FF] hover:bg-[#0055D6] rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <Send className="size-4" />
                  <span>{sendingSms ? 'Sending SMS...' : 'Send SMS'}</span>
                </button>
              </form>
            )}

            {/* TAB 2: SEND EMAIL FORM */}
            {activeTab === 'email' && (
              <form onSubmit={handlePanelSendEmail} className="space-y-3.5">
                {/* Select Customer */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Customer
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                      className="w-full pl-9 pr-8 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer truncate"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                    <Users className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="size-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Email Template (Optional) & Manage Templates */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Template (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={emailTemplateId}
                      onChange={(e) => handlePanelTemplateChange(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                    >
                      <option value="">Select a template</option>
                      {templates.map((tmpl) => (
                        <option key={tmpl.id} value={tmpl.id}>
                          {tmpl.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setTemplatesModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0066FF] bg-[#EBF5FF] border border-[#DBEAFE] rounded-lg hover:bg-[#DBEAFE] transition-colors shrink-0 cursor-pointer"
                    >
                      <Settings className="size-3.5" />
                      <span>Manage Templates</span>
                    </button>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Special China Visa Offer for You"
                    className="w-full px-3.5 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Type your email message here..."
                    className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs leading-relaxed"
                  />
                </div>

                {/* Submit Send Email Button */}
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="w-full mt-2 py-2.5 px-4 text-sm font-semibold text-white bg-[#0066FF] hover:bg-[#0055D6] rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <Send className="size-4" />
                  <span>{sendingEmail ? 'Sending Email...' : 'Send Email'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Recent Campaigns Table using reference TableCard & Table */}
      <TableCard>
        <div className="pb-1">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
            Recent Campaigns
          </h3>
          {/* <p className="text-sm text-slate-500 font-normal mt-0.5">
            Your recent SMS and email campaigns.
          </p> */}
        </div>

        <Table
          columns={campaignColumns}
          data={campaigns}
          emptyText="No campaigns sent yet"
          emptyDescription="Send promotional SMS or Email to your customers to see campaign history."
        />
      </TableCard>

      {/* POPUP MODALS */}
      {/* 1. Send Email Modal (Matching Image 2 popup) */}
      <SendEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        customer={modalCustomer}
        templates={templates}
        onSend={handleSendEmailFromModal}
      />

      {/* 2. Send SMS Modal */}
      <SendSmsModal
        open={smsModalOpen}
        onClose={() => setSmsModalOpen(false)}
        customer={modalCustomer}
        templates={templates}
        onSend={handleSendSmsFromModal}
      />

      {/* 3. Campaign Details Modal */}
      <CampaignDetailsModal
        open={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        campaign={selectedCampaign}
      />

      {/* 4. Manage Templates Modal */}
      <ManageTemplatesModal
        open={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        templates={templates}
        onSaveTemplate={async (tmpl) => {
          await marketingApi.saveTemplate(tmpl);
          loadOverview();
          showToast(`Template "${tmpl.name}" saved!`);
        }}
        onDeleteTemplate={async (tmplId) => {
          await marketingApi.deleteTemplate(tmplId);
          loadOverview();
          showToast('Template deleted.');
        }}
      />
    </div>
  );
}
