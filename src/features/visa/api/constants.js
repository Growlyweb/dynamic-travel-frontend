// The words the visa screens use. The values are the server's.
export const APPLICANT_TYPES = ['individual', 'business', 'student', 'employee', 'sponsored']
export const CHECKLIST_REQUIREMENTS = ['required', 'optional', 'conditional']
export const STATUS_CATEGORIES = ['in_progress', 'action_required', 'success', 'failed', 'cancelled']
export const MESSAGE_VARIABLES = ['applicantName', 'applicationNumber', 'country', 'visaType', 'status', 'trackingUrl']
export const MESSAGE_CHANNELS = ['email', 'sms']
export const MESSAGE_STATUSES = ['pending', 'sent', 'failed']
export const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Credit / Debit Card', 'bKash / Nagad']
export const SERVICE_OPTIONS = [
  { value: 'visa', label: 'Visa' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'tour', label: 'Tour Package' },
]
export const SERVICE_LABELS = Object.fromEntries(SERVICE_OPTIONS.map((option) => [option.value, option.label]))
export const TEMPLATE_SERVICE_OPTIONS = [{ value: 'all', label: 'All services' }, ...SERVICE_OPTIONS]
export const TRIP_TYPES = ['One Way', 'Round Way']
export const TICKET_CLASSES = ['Economy', 'Premium Economy', 'Business', 'First Class']
export const ENTRY_TYPES = [
  { value: 'single', label: 'Single entry' },
  { value: 'double', label: 'Double entry' },
  { value: 'multiple', label: 'Multiple entry' },
]

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

export const PASSPORT_METHOD_LABELS = { pickup: 'Pickup', office: 'Office visit', online: 'Online', unset: '—' }

export const PASSPORT_REQUIREMENT_LABELS = {
  physical_required: 'Physical Passport Required',
  online_processing: 'Online Processing',
}

export const PICKUP_LOCATION_TYPES = ['Home', 'Shop', 'Business', 'Office', 'Other']
export const DOCUMENT_SUBMISSION_MODES = ['digital', 'physical', 'both']

// The payment status the server calculates.
export const PAYMENT_STATUS_TONES = { Paid: 'success', Partial: 'warning', Unpaid: 'danger' }
