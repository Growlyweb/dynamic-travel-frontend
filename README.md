# Travel Dashboard

Admin dashboard boilerplate for a travel agency: visa applications, tour packages,
B2B partners, B2C customers, documents, reports and settings.

Built with **React 18 + Vite + React Router 6** and plain CSS (no UI library).

## Quick start

```bash
npm install
npm run dev      # start dev server on http://localhost:5173
npm run build    # production build
npm run lint     # eslint
```

The `.env` ships with `VITE_ENABLE_MOCKS=true`, so the app runs **without a backend**:

- Sign in with any email/password (or click "Use demo credentials").
- List screens are populated with demo data; search, filters and pagination work.
- Set `VITE_ENABLE_MOCKS=false` when your API is ready.

## Accounting module (travel & tourism)

The **Accounts** area under `src/features/reports` is a double-entry accounting
system built for a travel agency, not a spreadsheet-style dashboard:

- **Chart of accounts** — assets, liabilities, equity, income and expense codes
  with statement grouping and live balances.
- **Journal vouchers** — a debit/credit editor that refuses to post unbalanced
  entries, with void/audit trail and printable vouchers.
- **General ledger, trial balance, profit & loss, balance sheet** — every figure
  is derived from the same posted journal, so the statements always reconcile.
- **Receivables & payables** — customer/agent and supplier sub-ledgers with
  FIFO allocation, ageing buckets, statements and payment/receipt capture.
- **Visa & tour files** — job costing for every application, package, ticket,
  hotel booking and transfer: sale, embassy/airline/DMC cost, margin, deposit
  and outstanding balance, with an invoice and money receipt.
- **Service segments** — visa, tour, air, hotel and transport profitability.
- **Monthly performance** and prior-year comparatives, including a year-end
  closing entry that rolls profit into retained earnings.
- CSV/Excel exports and print-ready A4 documents for vouchers, invoices,
  receipts, statements and financial statements.

Demo data is deterministic and stored in `localStorage` under
`abl_accounting_v1`; use **Reset** on the Accounts Overview to rebuild the
sample books. Clear that key to start from a clean seed.

## Simple Accounts (plain language)

The client-facing Accounts area is at `/accounts` and is written for people with
no accounting knowledge. It shows only **Selling Price, Cost Price, Profit,
Received** and **Due** — never debit, credit, ledger or journal.

- `/accounts` — Home: current-month cards, 6-month selling/cost chart, B2B/B2C
  chart, cash/bank/bKash, vendor payable, partner capital, dues aging and the
  top 10 clients who owe us.
- `/accounts/sales` — Sales list with View, Edit, Delete, Money Receipt and
  Add Cost.
- `/accounts/dues` — all invoices with due, oldest first, days waiting, B2B/B2C
  split and aging.
- `/accounts/receipts` — every Money Receipt with MR number, client, account,
  print/download and delete; the MR number in Sales opens the same receipt.
- `/accounts/monthly` — month/year report, day-by-day table, office expenses,
  yearly summary, monthly/yearly CSV and print.
- `/accounts/profit` — selling, cost, office expenses, profit by category and
  net profit.
- `/accounts/categories` — add and remove services with a colour.
- `/accounts/price-list` — B2B and B2C price guide with profit margins.
- `/accounts/agents` and `/accounts/clients` — add and manage B2B agents and
  B2C clients, with sales, received, due and credit limit.
- `/accounts/payables` — what we still owe vendors, with aging.
- `/accounts/partners` — two partners, money in/out, invested/taken out,
  capital share and profit share.

### Vendors and Accounts connection

The Vendors module and Accounts share one set of books:

- Adding a vendor creates the matching supplier in Accounts and posts its
  opening due/advance.
- A vendor bill posts the service cost and supplier payable.
- A vendor payment reduces the payable and the chosen Cash/Bank/bKash account.
- A vendor advance is held as **Advances to Suppliers** and shown separately
  from payables.
- Editing or deleting a bill/payment reverses its previous posting.
- `/accounts/payables` shows the same vendor due plus available advances.
- Vendor Services is the admin screen for adding/removing service segments;
  the same **Add Service** action is available inside Add/Edit Vendor.

### Visa applications and Accounts

Saving a Visa application now creates the matching accounting records:

- client sale invoice with Selling Price, Discount and Due
- one vendor cost per vendor row, with the vendor payable
- Money Receipt for the Advance Amount
- accounts file number equals the application number, so it is easy to trace

Open the application detail to see the **Account** card: Selling Price, Discount,
Advance, Due, Payment Method and posted status. The same sale appears in
Accounts → Sales, its due in Client Dues and the vendor cost in Vendor Payables.

### B2B partner onboarding

The frontend now has a public partner panel:

- `/partner/register` — agency/company details, contact person, portal password
  and upload of Trade License, Business Card or another document.
- `/partner/login` — approved partners only. Pending, document-verified,
  rejected and suspended accounts receive a clear message.
- `/partner/portal` — company profile, active status and document verification
  status.

Admin verification:

- Partner applications appear at **Partners · B2B → Applications**.
- Admin verifies each uploaded document at **Partners · B2B → Documents**.
- When every document is verified the application moves to
  **documents verified**.
- Admin approves the partner; only then is the account **Active** and login
  allowed.
- **Create partner portal** on the Partners page lets an admin create an
  already-approved partner account immediately.

The double-entry postings still happen underneath, automatically. See
[ACCOUNTS_HANDOFF_PROMPT.md](ACCOUNTS_HANDOFF_PROMPT.md) for the production
Node/API/DB implementation brief.

## Connecting your API

1. Set `VITE_API_BASE_URL` in `.env` and `VITE_ENABLE_MOCKS=false`.
2. Implement the endpoints referenced in each feature's `*.api.js`
   (`features/*/[feature].api.js`). The demo payloads in those files document
   the expected response shapes.
3. Auth expects `POST /auth/login` → `{ user, accessToken, refreshToken }`;
   the token is sent as `Authorization: Bearer <token>` (see `services/apiClient.js`).
   A 401 clears the session and redirects to `/login`.

## Structure

```
src/
├── app/            # App shell: routes, providers, config
├── assets/         # images, icons, fonts
├── components/
│   ├── common/     # Button, Input, Modal, Badge, Loader, states…
│   ├── layout/     # DashboardLayout, Sidebar, Header, breadcrumbs…
│   ├── tables/     # DataTable, TablePagination, TableActions
│   └── charts/     # StatCard, LineChart, BarChart, DonutChart (SVG, no deps)
├── features/       # one folder per domain (auth, dashboard, users, visa,
│   │               # tours, b2b, b2c, documents, notifications, reports, settings)
│   ├── <feature>/
│   ├── pages/      # route-level screens
│   ├── components/ # feature-scoped components
│   └── <feature>.api.js
├── hooks/          # useAuth, usePermission, useDebounce, usePagination
├── context/        # AuthContext, NotificationContext
├── services/       # apiClient (fetch wrapper), authStorage, uploadService
├── utils/          # constants, permissions, roles, formatters, validators, helpers
└── styles/         # variables.css, components.css, utilities.css
```

## Auth & permissions

- `context/AuthContext.jsx` stores the session in `localStorage` via
  `services/authStorage.js` and exposes `useAuth()`.
- `utils/permissions.js` maps roles (admin, manager, agent, partner, viewer) to
  permissions. Routes are guarded with `<RequirePermission>` and sidebar entries
  filter themselves through `usePermission()`. Adjust `ROLE_PERMISSIONS` to match
  your backend.
