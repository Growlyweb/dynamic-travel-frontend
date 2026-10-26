/** localStorage persistence for the accounting module. */

import { buildSeed, SEED_VERSION } from './seed.js'

const STORAGE_KEY = 'abl_accounting_v1'

let cache = null

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Unable to save accounting data:', error)
  }
}

export function loadState() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        parsed &&
        parsed.version === SEED_VERSION &&
        Array.isArray(parsed.journals) &&
        parsed.journals.length > 0 &&
        Array.isArray(parsed.accounts)
      ) {
        cache = parsed
        return cache
      }
    }
  } catch (error) {
    console.error('Unable to read accounting data:', error)
  }
  cache = buildSeed(new Date())
  persist(cache)
  return cache
}

export function saveState(state) {
  cache = state
  persist(state)
  return state
}

export function resetState() {
  cache = buildSeed(new Date())
  persist(cache)
  return cache
}

export function clearCache() {
  cache = null
}

export { STORAGE_KEY }
