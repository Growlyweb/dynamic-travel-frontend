import { apiClient } from '../../../services/apiClient'

// The catalog is small (countries, their visa types, statuses), so a screen reads it in one go.
const ALL = { pageSize: 500 }

const day = (value) => (value ? String(value).slice(0, 10) : '')

const toType = (type) => (type ? { ...type, countryId: type.countryId ?? type.country, validFrom: day(type.validFrom) } : type)

const toChecklist = (checklist) =>
  checklist ? { ...checklist, items: (checklist.items ?? []).map((item) => ({ ...item, id: item.id ?? item._id })) } : checklist

// A "Visa Check List" page, with its country and visa type as ids next to their names.
const toChecklistEntry = (entry) => (entry ? { ...entry, countryId: entry.country, visaTypeId: entry.visaType, createdDate: day(entry.createdAt) } : entry)

// The country form still carries a visa type field from before the catalog was on the server. The server ignores it.
const toCountryBody = ({ id: _id, visaType: _visaType, ...body }) => body

export const catalogApi = {
  /* ── Countries ── */
  listCountries: (params = {}) => apiClient.get('/visa/countries', { params: { ...ALL, ...params } }),
  saveCountry: (payload) =>
    payload.id ? apiClient.patch(`/visa/countries/${payload.id}`, toCountryBody(payload)) : apiClient.post('/visa/countries', toCountryBody(payload)),
  updateCountry: (id, patch) => apiClient.patch(`/visa/countries/${id}`, patch),
  removeCountry: (id) => apiClient.del(`/visa/countries/${id}`),

  /* ── Visa types and their prices ── */
  listVisaTypes: (params = {}) => apiClient.get('/visa/types', { params: { ...ALL, ...params } }).then((result) => ({ ...result, items: result.items.map(toType) })),
  saveVisaType: ({ id, validFrom, ...payload }) => {
    const body = { ...payload, ...(validFrom ? { validFrom } : {}) }
    return (id ? apiClient.patch(`/visa/types/${id}`, body) : apiClient.post('/visa/types', body)).then(toType)
  },
  updateVisaType: (id, patch) => apiClient.patch(`/visa/types/${id}`, patch).then(toType),
  removeVisaType: (id) => apiClient.del(`/visa/types/${id}`),

  /* ── Checklists ── */
  getChecklist: ({ countryId, visaTypeId, applicantType }) => apiClient.get(`/visa/checklists/${countryId}/${visaTypeId}/${applicantType}`).then(toChecklist),
  saveChecklist: ({ countryId, visaTypeId, applicantType, items }) =>
    apiClient
      .put(`/visa/checklists/${countryId}/${visaTypeId}/${applicantType}`, {
        items: items.map(({ label, requirement, active, submissionMode, fileFormats, maxSizeMb }) => ({ label, requirement, active, submissionMode, fileFormats, maxSizeMb })),
      })
      .then(toChecklist),

  /* ── Visa Check List pages: one for each country and visa type, written in rich text ── */
  listChecklistEntries: (params = {}) => apiClient.get('/visa/checklist-entries', { params }).then((result) => ({ ...result, items: result.items.map(toChecklistEntry) })),
  // The country and the visa type are chosen when the page is added and cannot change afterwards.
  saveChecklistEntry: ({ id, countryId, visaTypeId, title, description, processingTime, media, displayOrder, status }) => {
    const body = { title, description, processingTime, media, displayOrder, status }
    return (id ? apiClient.patch(`/visa/checklist-entries/${id}`, body) : apiClient.post('/visa/checklist-entries', { countryId, visaTypeId, ...body })).then(toChecklistEntry)
  },
  removeChecklistEntry: (id) => apiClient.del(`/visa/checklist-entries/${id}`),

  /* ── Statuses ── */
  listStatusConfigs: () => apiClient.get('/visa/statuses', { params: ALL }),
  saveStatusConfig: ({ id, key, isSystem: _isSystem, ...payload }) =>
    id ? apiClient.patch(`/visa/statuses/${id}`, payload) : apiClient.post('/visa/statuses', { ...(key ? { key } : {}), ...payload }),
  updateStatusConfig: (id, patch) => apiClient.patch(`/visa/statuses/${id}`, patch),
  removeStatusConfig: (id) => apiClient.del(`/visa/statuses/${id}`),
}
