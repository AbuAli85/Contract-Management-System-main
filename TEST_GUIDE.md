# Quick Testing Guide

## How to Test Your Application

### Method 1: Using the Navigation Tester (Recommended)

1. **Start your development server**:

   \`\`\`bash
   npm run dev
   \`\`\`

2. **Open the test navigation page**:
   http://localhost:3001/en/test-navigation

3. **Use the Navigation Tester**:
   - A floating panel will appear in the bottom right
   - Click on each route to open it in a new tab
   - Mark each route as:
     - ✓ (Green) - Page works correctly
     - ! (Yellow) - Page has warnings or minor issues
     - ✗ (Red) - Page has errors or doesn't load

4. **Monitor console errors**:
   - Click "Start Console Monitoring" on the test page
   - Any errors will be captured and displayed

### Method 2: Manual Navigation

1. **Start with the home page**:
   http://localhost:3001

2. **Test public pages** (without login):
   - Home page
   - Login page
   - Try accessing protected pages (should redirect to login)

3. **Create a test account**:
   - Go to http://localhost:3001/en/login
   - Click "Sign Up" or toggle to registration
   - Create an account with a test email

4. **Test authenticated pages**:
   - Dashboard
   - Contracts
   - Generate Contract
   - Manage Parties
   - Manage Promoters
   - Profile

### Method 3: Quick Browser Console Test

Open your browser console (F12) and run this script:

\`\`\`javascript
// Test all routes quickly
const testRoutes = async () => {
  const routes = [
    "/en/dashboard",
    "/en/contracts",
    "/en/generate-contract",
    "/en/manage-parties",
    "/en/manage-promoters",
    "/en/profile",
  ]

  console.log("Testing routes...")

  for (const route of routes) {
    try {
      const response = await fetch(`http://localhost:3001${route}`)
      console.log(`${route}: ${response.status} ${response.ok ? "✅" : "❌"}`)
    } catch (error) {
      console.log(`${route}: ❌ Error - ${error.message}`)
    }
  }
}

testRoutes()
\`\`\`

## What to Look For

### ✅ Good Signs:

- Page loads without errors
- All content displays properly
- Forms and buttons work
- Navigation between pages works
- No console errors (red text in console)

### ❌ Bad Signs:

- Blank/white pages
- "404 Not Found" errors
- "500 Internal Server Error"
- Console errors (red text)
- Infinite loading spinners
- Broken layouts

### ⚠️ Warning Signs:

- Console warnings (yellow text)
- Slow page loads
- Missing images or icons
- Layout shifts while loading

## Common Issues and Solutions

### Issue: "Cannot read properties of undefined"

**Solution**: This usually means data is not loaded yet. Check if the component handles loading states.

### Issue: "404 Not Found"

**Solution**: The page doesn't exist. Check if you're using the correct URL with `/en/` prefix.

### Issue: "Unauthorized" or redirect to login

**Solution**: The page requires authentication. Log in first.

### Issue: "Multiple GoTrueClient instances"

**Solution**: This should be fixed now with the singleton pattern.

## Quick Test Checklist

- [ ] Home page loads
- [ ] Can navigate to login
- [ ] Can create an account
- [ ] Can log in
- [ ] Dashboard loads after login
- [ ] Can navigate to all main pages
- [ ] Can create a party
- [ ] Can create a promoter
- [ ] Can start contract generation
- [ ] Profile page shows user info
- [ ] Can log out

## Reporting Issues

If you find issues, note:

1. The page URL
2. What you expected to happen
3. What actually happened
4. Any error messages (copy from console)
5. Steps to reproduce the issue
