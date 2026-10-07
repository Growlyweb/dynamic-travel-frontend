import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import CampaignComposeModal from '../components/CampaignComposeModal'
import AddContactModal from '../components/AddContactModal'
import AcknowledgementSlipModal from '../components/AcknowledgementSlipModal'
import { vendorApi } from '../vendor.api'
import { formatDateTime, formatDate } from '@/utils/formatters'
import {
  Send,
  Sparkles,
  Users,
  Printer,
  Plus,
  Search,
  MessageSquare,
  Mail,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  FileText,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
} from 'lucide-react'

export default function VendorMarketing() {
  const [activeTab, setActiveTab] = useState('campaigns')
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [automations, setAutomations] = useState([])
  const [contacts, setContacts] = useState([])
  const [slips, setSlips] = useState([])

  // Search & Filters
  const [searchContact, setSearchContact] = useState('')
  const [searchSlip, setSearchSlip] = useState('')

  // Modals
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [selectedSlip, setSelectedSlip] = useState(null)
  const [slipModalOpen, setSlipModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [campRes, autoRes, contRes, slipRes] = await Promise.all([
        vendorApi.listCampaigns(),
        vendorApi.listAutomations(),
        vendorApi.listMarketingContacts({ pageSize: 100 }),
        vendorApi.listAcknowledgementSlips({ pageSize: 50 }),
      ])
      setCampaigns(campRes.items || [])
      setAutomations(autoRes || [])
      setContacts(contRes.items || [])
      setSlips(slipRes.items || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggleAutomation = async (id) => {
    await vendorApi.toggleAutomation(id)
    await loadData()
  }

  const handleCreateCampaign = async (data) => {
    await vendorApi.createCampaign(data)
    await loadData()
  }

  const handleCreateContact = async (data) => {
    await vendorApi.createMarketingContact(data)
    await loadData()
  }

  const filteredContacts = contacts.filter((c) => {
    const q = searchContact.toLowerCase()
    return (
      !searchContact ||
      c.name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.source?.toLowerCase().includes(q)
    )
  })

  const filteredSlips = slips.filter((s) => {
    const q = searchSlip.toLowerCase()
    return (
      !searchSlip ||
      s.slipNumber?.toLowerCase().includes(q) ||
      s.receivedFrom?.toLowerCase().includes(q) ||
      s.contactPerson?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Marketing & Automated Sequences"
          description="Compose promotional offers, schedule automated workflow notifications, view auto-synced vendor contacts, and print acknowledgement slips."
          breadcrumbs={[{ label: 'Vendors' }, { label: 'Marketing & Automations' }]}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setCampaignModalOpen(true)}
            className="rounded-xl gap-2 shadow-xs cursor-pointer h-10 px-4"
          >
            <Send className="size-4" />
            <span>Compose Campaign</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Send className="size-3.5" />
            <span>Campaigns & Offers ({campaigns.length})</span>
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-1.5">
            <Sparkles className="size-3.5" />
            <span>Automated Sequences ({automations.length})</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5">
            <Users className="size-3.5" />
            <span>Synced Contacts ({contacts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="slips" className="gap-1.5">
            <Printer className="size-3.5" />
            <span>Acknowledgement Slips ({slips.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Campaigns */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-border/80">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Broadcasts
              </p>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">
                {campaigns.length} Campaigns
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Dispatched to agencies</p>
            </Card>

            <Card className="p-4 border-border/80">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Average Delivery Rate
              </p>
              <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">97.3%</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Direct SMS & Email gateways</p>
            </Card>

            <Card className="p-4 border-border/80">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Audience Reach
              </p>
              <p className="text-2xl font-bold font-mono text-primary mt-1">
                {contacts.length} Contacts
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Synced vendor decision makers</p>
            </Card>
          </div>

          <Card className="border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Campaigns History & Metrics</CardTitle>
                <CardDescription className="text-xs">
                  Review sent broadcast offers, recipient segments, and engagement rates.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCampaignModalOpen(true)}
                className="gap-1.5 text-xs h-8 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>New Campaign</span>
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-y border-border/80">
                    <tr>
                      <th className="p-3 pl-4">Campaign Title</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Audience Segment</th>
                      <th className="p-3">Scheduled / Sent At</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right pr-4">Delivery & Open Metrics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 pl-4">
                          <p className="font-bold text-sm text-foreground">{c.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[320px]">
                            {c.messageContent}
                          </p>
                        </td>

                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            {c.channel}
                          </Badge>
                        </td>

                        <td className="p-3 text-muted-foreground">{c.audience}</td>

                        <td className="p-3 font-mono text-muted-foreground">
                          {c.scheduledAt}
                        </td>

                        <td className="p-3">
                          {c.status === 'sent' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                              <CheckCircle2 className="size-3.5" /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                              <Clock className="size-3.5" /> Scheduled
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right pr-4 font-mono">
                          {c.status === 'sent' ? (
                            <div className="text-[11px]">
                              <span className="font-bold text-foreground">
                                {c.metrics?.delivered || c.recipientCount} Delv.
                              </span>
                              <span className="text-muted-foreground"> · </span>
                              <span className="text-primary font-semibold">
                                {c.metrics?.opened || 0} Opened
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Pending Dispatch</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Automated Sequences */}
        <TabsContent value="automations" className="space-y-4">
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base font-bold">Automated Workflow Triggers</CardTitle>
              <CardDescription className="text-xs">
                Zero-click event workflows that automatically dispatch SMS, Emails, and Acknowledgement Slips when operational events occur.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {automations.map((auto) => (
                  <div
                    key={auto.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{auto.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {auto.channel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Trigger:</strong> {auto.trigger}
                      </p>
                      <p className="text-xs text-primary">
                        <strong>Action:</strong> {auto.action}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-foreground">
                          {auto.executions} fired
                        </p>
                        <p className="text-[10.5px] text-muted-foreground">total executions</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleAutomation(auto.id)}
                        className="cursor-pointer"
                        title={auto.enabled ? 'Click to disable' : 'Click to enable'}
                      >
                        {auto.enabled ? (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold">
                            <span className="size-2 rounded-full bg-emerald-500"></span>
                            <span>ACTIVE</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border text-xs font-bold">
                            <span className="size-2 rounded-full bg-slate-400"></span>
                            <span>PAUSED</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Synced Contacts */}
        <TabsContent value="contacts" className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-96 relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search contact name, company, mobile, source..."
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <Button
                onClick={() => setContactModalOpen(true)}
                className="w-full sm:w-auto rounded-xl gap-2 text-xs h-10 cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Add Manual Contact</span>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/80">
                    <tr>
                      <th className="p-3 pl-4">Contact Name</th>
                      <th className="p-3">Agency / Company</th>
                      <th className="p-3">Mobile & WhatsApp</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Sync Source</th>
                      <th className="p-3">Segments & Tags</th>
                      <th className="p-3 text-right pr-4">Synced Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredContacts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No marketing contacts found.
                        </td>
                      </tr>
                    ) : (
                      filteredContacts.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 pl-4 font-bold text-sm text-foreground">{c.name}</td>
                          <td className="p-3 font-medium text-foreground">{c.company || '—'}</td>
                          <td className="p-3 font-mono font-medium text-primary">{c.phone}</td>
                          <td className="p-3 text-muted-foreground">{c.email || '—'}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                c.source === 'Vendor Sync'
                                  ? 'bg-primary/10 text-primary border-primary/30'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {c.source}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {c.tags?.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-medium"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-right pr-4 font-mono text-muted-foreground">
                            {formatDate(c.syncedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Acknowledgement Slips Archive */}
        <TabsContent value="slips" className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-96 relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search slip reference number, vendor, submitter..."
                  value={searchSlip}
                  onChange={(e) => setSearchSlip(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>All slips generated with official legal safekeeping terms.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/80">
                    <tr>
                      <th className="p-3 pl-4">Slip Number</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Received From Agency</th>
                      <th className="p-3">Submitter Person</th>
                      <th className="p-3">Service Type</th>
                      <th className="p-3 text-center">Passports Count</th>
                      <th className="p-3 text-right pr-4">Print Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredSlips.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No acknowledgement slips found.
                        </td>
                      </tr>
                    ) : (
                      filteredSlips.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 pl-4 font-mono font-bold text-sm text-primary">
                            {s.slipNumber}
                          </td>

                          <td className="p-3 font-mono text-muted-foreground">
                            {formatDateTime(s.receivedDate)}
                          </td>

                          <td className="p-3 font-semibold text-foreground">
                            {s.receivedFrom}
                          </td>

                          <td className="p-3 text-muted-foreground">
                            {s.contactPerson} ({s.phone})
                          </td>

                          <td className="p-3 font-medium text-foreground">
                            {s.serviceType}
                          </td>

                          <td className="p-3 text-center font-bold text-foreground">
                            {s.passengers?.length || 1}
                          </td>

                          <td className="p-3 text-right pr-4">
                            <Button
                              variant="outline"
                              size="xs"
                              className="h-7 text-xs text-primary gap-1.5 cursor-pointer"
                              onClick={() => {
                                setSelectedSlip(s)
                                setSlipModalOpen(true)
                              }}
                            >
                              <Printer className="size-3" />
                              <span>Print Slip</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CampaignComposeModal
        open={campaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        totalContacts={contacts.length}
        onSubmit={handleCreateCampaign}
      />

      <AddContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        onSubmit={handleCreateContact}
      />

      <AcknowledgementSlipModal
        slip={selectedSlip}
        open={slipModalOpen}
        onOpenChange={setSlipModalOpen}
      />
    </div>
  )
}
