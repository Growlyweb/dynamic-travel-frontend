import { isMocked } from '../../app/config'
import { sleep } from '../../utils/helpers'

// Vendor services (Visa, Air ticket, Hotel...) and the prices a vendor has for them are not on the server yet, so this page
// stays on demo data until they are built. Switch it with VITE_MOCK_MODULES=vendorServices.
let services = [
  { id: 'srv_visa', name: 'Visa', code: 'VISA', isActive: true },
  { id: 'srv_air', name: 'Air Ticket', code: 'AIR', isActive: true },
  { id: 'srv_hotel', name: 'Hotel', code: 'HOTEL', isActive: true },
  { id: 'srv_tour', name: 'Tour Package', code: 'TOUR', isActive: true },
  { id: 'srv_transport', name: 'Transport', code: 'TRANS', isActive: true },
]

const notBuilt = () => {
  throw new Error('Vendor services are not available yet.')
}

export const vendorServicesApi = {
  async getServices() {
    if (!isMocked('vendorServices')) notBuilt()
    await sleep(150)
    return { success: true, data: services.map((service) => ({ ...service })) }
  },
  async createService(data) {
    if (!isMocked('vendorServices')) notBuilt()
    services = [...services, { id: `srv_${Date.now().toString(36)}`, isActive: true, ...data }]
    return { success: true }
  },
  async updateService(id, data) {
    if (!isMocked('vendorServices')) notBuilt()
    services = services.map((service) => (service.id === id ? { ...service, ...data } : service))
    return { success: true }
  },
  async toggleServiceStatus(id) {
    if (!isMocked('vendorServices')) notBuilt()
    services = services.map((service) => (service.id === id ? { ...service, isActive: !service.isActive } : service))
    return { success: true }
  },
  async deleteService(id) {
    if (!isMocked('vendorServices')) notBuilt()
    services = services.filter((service) => service.id !== id)
    return { success: true }
  },
}
