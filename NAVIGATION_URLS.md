# Navigation URLs for Testing

## Quick Access Links

After starting your development server (`npm run dev`), you can access these pages:

### Main Navigation Pages

- **Navigation Overview**: http://localhost:3001/en/navigation
- **Navigation Tester**: http://localhost:3001/en/test-navigation

### Public Pages (No Login Required)

- **Home**: http://localhost:3001/en
- **Login**: http://localhost:3001/en/login

### Authenticated Pages (Login Required)

- **Dashboard**: http://localhost:3001/en/dashboard
- **Contracts**: http://localhost:3001/en/contracts
- **Generate Contract**: http://localhost:3001/en/generate-contract
- **Manage Parties**: http://localhost:3001/en/manage-parties
- **Manage Promoters**: http://localhost:3001/en/manage-promoters
- **Profile**: http://localhost:3001/en/profile

### Dashboard Sub-pages

- **Dashboard Contracts**: http://localhost:3001/en/dashboard/contracts
- **Dashboard Generate**: http://localhost:3001/en/dashboard/generate-contract
- **Dashboard Settings**: http://localhost:3001/en/dashboard/settings
- **Dashboard Analytics**: http://localhost:3001/en/dashboard/analytics

### Admin Pages (Admin Role Required)

- **Admin Dashboard**: http://localhost:3001/en/admin
- **Admin Users**: http://localhost:3001/en/admin/users
- **Admin Audit**: http://localhost:3001/en/admin/audit
- **Admin Roles**: http://localhost:3001/en/admin/roles-permissions

## Testing Flow

1. **Start here**: http://localhost:3001/en/navigation
   - This page shows all available routes
   - Click any route to test it

2. **For systematic testing**: http://localhost:3001/en/test-navigation
   - Use the floating Navigation Tester
   - Track which pages work/fail
   - Monitor console errors

## Notes

- The middleware will automatically redirect paths without locale to `/en/`
- For example: `/dashboard` → `/en/dashboard`
- All pages require the locale prefix (`/en/` or `/ar/`)
- If you get a 404 error, make sure you're using the full path with locale
