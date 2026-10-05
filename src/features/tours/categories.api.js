import { apiClient, withMock, withMockList } from '../../services/apiClient'

// Seed matches the original hardcoded segment list so existing tours keep
// resolving; the admin can add more categories from the tour form at runtime.
export const DEFAULT_CATEGORIES = [
  { id: 'cat_beach', name: 'Beach & Resort' },
  { id: 'cat_adventure', name: 'Adventure & Trekking' },
  { id: 'cat_honeymoon', name: 'Honeymoon & Romantic' },
  { id: 'cat_family', name: 'Family Special' },
  { id: 'cat_cultural', name: 'Cultural & Heritage' },
  { id: 'cat_luxury', name: 'Luxury & Wellness' },
  { id: 'cat_city', name: 'City Break' },
  { id: 'cat_custom_group', name: 'Custom Group' },
]

// Mutable so mock-mode create/remove actually persist for the session.
let categoriesStore = DEFAULT_CATEGORIES.map((category) => ({ ...category }))

function nextId() {
  return `cat_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
}

export const categoriesApi = {
  list: (params) => withMockList(categoriesStore, params, { searchKeys: ['name'] }),
  create: (payload) =>
    withMock(
      () => {
        const name = String(payload?.name ?? '').trim()
        const existing = categoriesStore.find(
          (category) => category.name.toLowerCase() === name.toLowerCase(),
        )
        if (existing) return JSON.parse(JSON.stringify(existing))
        const record = { id: nextId(), name }
        categoriesStore = [...categoriesStore, record]
        return JSON.parse(JSON.stringify(record))
      },
      () => apiClient.post('/tour-categories', payload),
    ),
  remove: (id) =>
    withMock(
      () => {
        categoriesStore = categoriesStore.filter((category) => category.id !== id)
        return { ok: true }
      },
      () => apiClient.del(`/tour-categories/${id}`),
    ),
}
