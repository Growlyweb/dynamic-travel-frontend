import { createContext, useContext, useState } from 'react'

const CurrencyContext = createContext(null)

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
]

// Approximate conversion rates relative to USD
export const EXCHANGE_RATES = {
  USD: 1,
  BDT: 110,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('USD')

  function convertAmount(amountInUsd) {
    const rate = EXCHANGE_RATES[currency] ?? 1
    return amountInUsd * rate
  }

  function formatTourPrice(tour) {
    if (!tour) return '—'
    const rawPrice = Number(tour?.price) || 0
    const currCode = (tour?.priceCurrency || tour?.currency || (rawPrice > 3000 ? 'BDT' : 'USD')).toUpperCase()

    if (currCode === 'BDT') {
      return `BDT ${rawPrice.toLocaleString()}`
    }
    if (currCode === 'USD') {
      return `$ ${rawPrice.toLocaleString()}`
    }
    return `${currCode} ${rawPrice.toLocaleString()}`
  }

  function formatWithCurrency(amountInUsd) {
    const converted = convertAmount(amountInUsd)
    const curr = SUPPORTED_CURRENCIES.find((c) => c.code === currency)
    if (!curr) return `${converted.toLocaleString()}`
    try {
      return converted.toLocaleString(undefined, {
        style: 'currency',
        currency: curr.code,
        maximumFractionDigits: 0,
      })
    } catch {
      return `${curr.symbol}${Math.round(converted).toLocaleString()}`
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertAmount, formatWithCurrency, formatTourPrice, SUPPORTED_CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
