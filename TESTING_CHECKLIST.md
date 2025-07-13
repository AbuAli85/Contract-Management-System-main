# Application Testing Checklist

## Prerequisites

1. Make sure the development server is running:
   \`\`\`bash
   npm run dev
   \`\`\`
2. Open your browser to: http://localhost:3001
3. Open the browser console (F12) to check for errors

## Pages to Test

### 1. Home Page

- **URL**: http://localhost:3001/
- **Expected**: Should show the home page with navigation
- **Check for**:
  - No console errors
  - All navigation links work
  - Page loads completely

### 2. Login Page

- **URL**: http://localhost:3001/en/login
- **Expected**: Login form with email/password fields
- **Check for**:
  - Form displays correctly
  - No console errors
  - Toggle between Sign In/Sign Up works

### 3. Dashboard Pages

- **URL**: http://localhost:3001/en/dashboard
- **Expected**: Dashboard with statistics and navigation
- **Check for**:
  - Requires authentication (redirects to login if not logged in)
  - All dashboard cards load
  - Navigation menu works

#### Sub-pages to test:

- http://localhost:3001/en/dashboard/contracts
- http://localhost:3001/en/dashboard/generate-contract
- http://localhost:3001/en/dashboard/settings
- http://localhost:3001/en/dashboard/analytics

### 4. Contract Pages

- **URL**: http://localhost:3001/en/contracts
- **Expected**: List of contracts
- **Check for**:
  - Table/list loads (even if empty)
  - Create New Contract button exists
  - No console errors

### 5. Generate Contract Page

- **URL**: http://localhost:3001/en/generate-contract
- **Expected**: Contract generation form
- **Check for**:
  - Form loads with all fields
  - Dropdowns for parties and promoters work
  - No console errors

### 6. Manage Parties Page

- **URL**: http://localhost:3001/en/manage-parties
- **Expected**: Parties management interface
- **Check for**:
  - List loads (even if empty)
  - Add New Party button works
  - No console errors

### 7. Manage Promoters Page

- **URL**: http://localhost:3001/en/manage-promoters
- **Expected**: Promoters management interface
- **Check for**:
  - List loads (even if empty)
  - Add New Promoter button works
  - No console errors

### 8. Profile Page

- **URL**: http://localhost:3001/en/profile
- **Expected**: User profile page
- **Check for**:
  - Requires authentication
  - Profile information displays
  - No console errors

### 9. Admin Pages (if you have admin access)

- **URL**: http://localhost:3001/en/admin
- **Expected**: Admin dashboard
- **Check for**:
  - Requires admin role
  - Admin navigation works
  - No console errors

#### Admin sub-pages:

- http://localhost:3001/en/admin/users
- http://localhost:3001/en/admin/audit
- http://localhost:3001/en/admin/roles-permissions

## Common Issues to Look For

### Console Errors

1. **Red errors** - These need immediate attention
2. **Yellow warnings** - Note these but they may not be critical
3. **Network errors (404, 500)** - Check if APIs are working

### Visual Issues

1. **Broken layouts** - Elements overlapping or misaligned
2. **Missing content** - Empty sections that should have data
3. **Loading states** - Infinite loading spinners
4. **Responsive issues** - Test on different screen sizes

### Functionality Issues

1. **Broken links** - Clicking leads to 404 pages
2. **Non-working buttons** - Buttons that don't respond
3. **Form submission errors** - Forms that won't submit
4. **Authentication issues** - Can't login or stay logged in

## Testing Steps

### Step 1: Test Without Authentication

1. Open http://localhost:3001
2. Try to access each public page
3. Verify redirects to login for protected pages

### Step 2: Test With Authentication

1. Go to http://localhost:3001/en/login
2. Create an account or login with test credentials
3. Navigate through all authenticated pages
4. Check that you stay logged in

### Step 3: Test Core Features

1. **Create a Party**: Go to Manage Parties and add a new party
2. **Create a Promoter**: Go to Manage Promoters and add a new promoter
3. **Generate a Contract**: Go to Generate Contract and fill the form
4. **View Contracts**: Check if the contract appears in the list

### Step 4: Test Language Switching

1. Look for language switcher (usually in header)
2. Switch between English and Arabic
3. Verify pages load in the selected language

## Quick Navigation Test Script

You can paste this in the browser console to quickly open all pages:

\`\`\`javascript
const pages = [
  "/en/dashboard",
  "/en/contracts",
  "/en/generate-contract",
  "/en/manage-parties",
  "/en/manage-promoters",
  "/en/profile",
  "/en/dashboard/settings",
  "/en/dashboard/analytics",
]

console.log("Testing pages:")
pages.forEach((page, index) => {
  setTimeout(() => {
    console.log(`Opening: ${page}`)
    window.open(`http://localhost:3001${page}`, "_blank")
  }, index * 2000) // Opens each page with 2 second delay
})
\`\`\`

## Recording Issues

Create a list of issues found:

\`\`\`markdown
## Issues Found

### Page: [Page Name]

- **Issue**: Description of the problem
- **Error**: Copy any console errors
- **Steps to Reproduce**: How to see the issue
- **Priority**: High/Medium/Low
\`\`\`

## Success Criteria

✅ All pages load without console errors
✅ Navigation between pages works
✅ Forms can be submitted
✅ Data displays correctly
✅ Authentication flow works
✅ No visual glitches or broken layouts
