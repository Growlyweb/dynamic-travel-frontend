# Dynamic Travel admin dashboard

The back office of the travel agency.
It works with visa applications, tours, memberships, partners, customers, accounts, vendors and users.

React 18, Vite and React Router 6.
There is no data library: each feature has an API file that talks to the backend.

## Run it

```bash
npm install
cp .env.example .env     # then set VITE_API_BASE_URL
npm run dev              # http://localhost:5173
npm run build
npm run lint
```

The backend runs on port 5000 and the public website on port 5174.
The dashboard and the website must be on the same site (for example both on localhost) so the refresh cookie works.

## Environment

| Name | What it does |
|---|---|
| `VITE_API_BASE_URL` | The address of the backend API, for example `http://localhost:5000/api`. There is no default. Without it the app stops at start-up and says so. |
| `VITE_MOCK_MODULES` | Modules that still show demo data because their backend is not built yet, separated by commas. `all` runs the whole dashboard on demo data with no backend. |
| `VITE_APP_NAME` | The name shown in the interface. |

Modules that are still on demo data: `vendorServices`, `marketing`, `notifications`, `documents` (the all-documents list), `dashboard` (the numbers on the home page) and `b2bOperations` (partner pickups, commissions and withdrawals).

## How it fits together

| Part | Where | Notes |
|---|---|---|
| API client | `src/services/apiClient.js` | Sends the access token, renews it once when it expires, and turns the server's answer into plain objects. A list becomes `{ items, total, page, pageSize, totalPages, ...summary }`. Every `_id` also gets an `id`. |
| Session | `src/context/AuthContext.jsx`, `src/services/authStorage.js` | The access token is kept in memory. The refresh token is an httpOnly cookie. A reload asks the server for a new access token. |
| Errors | `src/utils/errors.js`, `src/hooks/useAction.js`, `src/context/ToastContext.jsx` | A server error code becomes a plain message. A failed action shows a message in the corner. |
| Permissions | `src/utils/permissions.js`, `src/hooks/usePermission.js` | The keys are the server's. The server works out what a person may do from their roles and sends it. An admin passes every check. |
| Lists | `src/hooks/useServerTable.js`, `src/components/re-table`, `src/components/tables` | The server pages every list. Rows per page is 50 to 500, remembered per table. The table scrolls inside a fixed box. |
| Demo data | `withModuleMock` in `src/services/apiClient.js` | One switch per module. |

## Sign in

There is one sign-in page, `/dashboard/login/admin`.
The account decides what a person sees: an administrator sees everything, and staff see what their roles allow.
A new staff member gets an email with a link to `/dashboard/setup-account`, where they choose a password.

## Features and their API

| Feature | Backend |
|---|---|
| Users, staff invitations, roles | `/api/admin/users`, `/api/admin/roles`, `/api/admin/rbac` |
| Visa: catalog, applications, payments, documents, passports, messages, quotations | `/api/visa` |
| Accounts | `/api/accounts` |
| Vendors, bills, payments | `/api/vendors` |
| Tours and categories | `/api/tours`, `/api/tour-categories` |
| Memberships | `/api/memberships`, `/api/membership-plans` |
| Partners | `/api/admin/b2b` |
| Customers | `/api/admin/users?role=B2C` |
| Settings | `/api/settings` |
