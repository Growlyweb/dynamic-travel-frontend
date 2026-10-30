// The business details printed on receipts and invoices. They are placeholders: the real ones belong in the settings.
export const COMPANY = {
  name: 'ABL Travel & Tours',
  legalName: 'ABL Travel & Tours Ltd.',
  tagline: 'Visa · Tour Packages · Air Ticketing',
  address: 'House 12, Road 7, Banani, Dhaka 1213, Bangladesh',
  phone: '+880 1711-000000',
  email: 'accounts@abltravel.com.bd',
  web: 'www.abltravel.com.bd',
  bin: 'BIN 003214567-0102',
  bank: 'City Bank — A/C 1402 5566 7890 (Banani Branch)',
  currency: 'BDT',
}

// The cash and bank methods of the Accounts screens, with the account each one posts to on the server.
export const PAYMENT_METHODS = [
  { value: 'city', label: 'Bank', account: '1020', icon: 'bank' },
  { value: 'brac', label: 'Bank (BRAC)', account: '1030', icon: 'bank' },
  { value: 'cash', label: 'Cash', account: '1010', icon: 'cash' },
  { value: 'bkash', label: 'bKash', account: '1040', icon: 'wallet' },
]

export const PAYMENT_METHOD_BY_VALUE = Object.fromEntries(PAYMENT_METHODS.map((method) => [method.value, method]))
