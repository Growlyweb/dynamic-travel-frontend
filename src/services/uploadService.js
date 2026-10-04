import { config } from '../app/config'
import { apiClient } from './apiClient'
import { sleep } from '../utils/helpers'

/**
 * Uploads a file and returns `{ url, name, size }`. In mock mode the file is
 * never sent anywhere — a local object URL is returned so previews still work.
 */
export async function uploadFile(file, { folder = 'general' } = {}) {
  if (config.enableMocks) {
    await sleep(400)
    return { url: URL.createObjectURL(file), name: file.name, size: file.size, folder }
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  return apiClient.post('/uploads', formData)
}
