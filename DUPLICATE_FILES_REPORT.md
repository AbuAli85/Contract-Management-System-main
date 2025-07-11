# Duplicate and Unused Files Report

## 1. Duplicate Authentication Pages

### Login/Signin Pages (DUPLICATES)

- `/app/login/page.tsx` - Uses `auth-form-fixed`
- `/app/[locale]/login/page.tsx` - Uses `auth-form`
- `/app/auth/signin/page.tsx` - Uses custom signin form

**Recommendation**: Keep only `/app/[locale]/login/page.tsx` for internationalization support

### Auth Forms (DUPLICATES)

- `/components/auth-form.tsx` - Main auth form with locale support
- `/components/auth-form-fixed.tsx` - Fixed version without locale
- `/components/simple-auth-form.tsx` - Simplified version

**Recommendation**: Keep only `/components/auth-form.tsx`

## 2. Duplicate Contract Generator Forms

### Contract Generator Forms (DUPLICATES)

- `/components/contract-generator-form.tsx` - Main form
- `/components/generate-contract-form.tsx` - Another implementation
- `/components/enhanced-contract-generator-form.tsx` - Enhanced version
- `/components/contract-generator-form-simple.tsx` - Simple version
- `/components/contract-generator-form-with-template.tsx` - Template version
- `/components/ContractGeneratorForm.tsx` - Just exports the main form

**Recommendation**: Keep only `/components/contract-generator-form.tsx` and `/components/enhanced-contract-generator-form.tsx`

### Contract Generation Pages (DUPLICATES)

- `/app/generate-contract/page.tsx` - Main generation page
- `/app/generate-contract-v2/page.tsx` - Version 2
- `/app/[locale]/generate-contract/page.tsx` - Localized version
- `/app/[locale]/dashboard/generate-contract/page.tsx` - Dashboard version

**Recommendation**: Keep only `/app/[locale]/generate-contract/page.tsx` for consistency

## 3. Duplicate Profile/Account Pages

### Profile Pages (DUPLICATES)

- `/app/profile/page.tsx` - Uses RequireAuth from enhanced auth
- `/app/[locale]/profile/page.tsx` - Uses RequireAuth from simple auth
- `/app/account/settings/page.tsx` - Account settings page

**Recommendation**: Keep only `/app/[locale]/profile/page.tsx`

## 4. Duplicate Admin Pages

### Admin User Management (DUPLICATES)

- `/app/admin/users/page.tsx` - Admin users page
- `/app/[locale]/admin/users/page.tsx` - Localized admin users
- `/app/dashboard/users/page.tsx` - Dashboard users page

**Recommendation**: Keep only `/app/[locale]/admin/users/page.tsx`

## 5. Duplicate Components

### Status Badges (DUPLICATES)

- `/components/StatusBadge.tsx` - Main status badge
- `/components/enhanced-status-badge.tsx` - Enhanced version
- `/components/document-status-badge.tsx` - Document specific

**Recommendation**: Keep only `/components/StatusBadge.tsx`

### Error Components (DUPLICATES)

- `/components/ErrorCard.tsx` - Main error card
- `/components/ErrorBoundary.tsx` - Error boundary
- `/components/ManualErrorBoundary.tsx` - Manual error boundary

**Recommendation**: Keep `/components/ErrorCard.tsx` and `/components/ErrorBoundary.tsx`

## 6. Unused Files

### Test Files

- `/components/contract-generator-form.test.tsx` - Test file in components

### Unused Auth Components

- `/components/forgot-password-form.tsx` - Not referenced
- `/components/reset-password-form.tsx` - Not referenced
- `/components/verify-email-notice.tsx` - Not referenced

### Unused Contract Components

- `/components/contract-debug-info.tsx` - Debug component
- `/components/contract-details-with-generate.tsx` - Not used
- `/components/draft-contracts-manager.tsx` - Not referenced
- `/components/makecom-contract-templates.tsx` - Not used

### Unused Pages

- `/app/forgot-password/page.tsx` - Not linked
- `/app/reset-password/page.tsx` - Not linked
- `/app/verify-email/page.tsx` - Not linked
- `/app/not-authorized/page.tsx` - Duplicate of [locale] version
- `/app/contracts/page.tsx` - Old contracts page
- `/app/dashboard/page.tsx` - Old dashboard

## 7. Files to Delete

### Immediate Deletion (Duplicates)

```bash
# Auth related
rm app/login/page.tsx
rm app/auth/signin/page.tsx
rm app/auth/signup/page.tsx
rm components/auth-form-fixed.tsx
rm components/simple-auth-form.tsx

# Contract forms
rm components/generate-contract-form.tsx
rm components/contract-generator-form-simple.tsx
rm components/contract-generator-form-with-template.tsx
rm components/ContractGeneratorForm.tsx

# Contract pages
rm app/generate-contract/page.tsx
rm app/generate-contract-v2/page.tsx

# Profile/Account
rm app/profile/page.tsx
rm app/account/settings/page.tsx

# Admin
rm app/admin/users/page.tsx
rm app/dashboard/users/page.tsx

# Status badges
rm components/enhanced-status-badge.tsx
rm components/document-status-badge.tsx

# Error components
rm components/ManualErrorBoundary.tsx
```

### Consider Deletion (Unused)

```bash
# Test files
rm components/contract-generator-form.test.tsx

# Unused auth
rm components/forgot-password-form.tsx
rm components/reset-password-form.tsx
rm components/verify-email-notice.tsx
rm app/forgot-password/page.tsx
rm app/reset-password/page.tsx
rm app/verify-email/page.tsx

# Unused contract components
rm components/contract-debug-info.tsx
rm components/contract-details-with-generate.tsx
rm components/draft-contracts-manager.tsx
rm components/makecom-contract-templates.tsx

# Old pages
rm app/not-authorized/page.tsx
rm app/contracts/page.tsx
rm app/dashboard/page.tsx
```

## 8. Refactoring Recommendations

1. **Standardize on [locale] routes**: All pages should be under `/app/[locale]/` for consistency
2. **Single auth form**: Use only one auth form component with proper configuration
3. **Component naming**: Use consistent naming (either PascalCase or kebab-case, not both)
4. **Remove test files from components**: Move tests to `__tests__` directories
5. **Consolidate status badges**: Use one configurable StatusBadge component

## Summary

- **Total duplicate files identified**: ~25 files
- **Total unused files identified**: ~15 files
- **Potential space saved**: ~40 files can be removed
- **Code clarity improvement**: Significant reduction in confusion
