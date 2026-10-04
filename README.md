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
