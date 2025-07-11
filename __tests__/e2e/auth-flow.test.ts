import { test, expect } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"

const TEST_USER = {
  email: "test@example.com",
  password: "TestP@ssw0rd123!",
  name: "Test User",
}

test.describe("Authentication Flow", () => {
  let supabase: any

  test.beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Clean up test user if exists
    const { data: users } = await supabase.auth.admin.listUsers()
    const testUser = users?.users?.find((u: any) => u.email === TEST_USER.email)
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id)
    }
  })

  test.afterAll(async () => {
    // Clean up test user
    const { data: users } = await supabase.auth.admin.listUsers()
    const testUser = users?.users?.find((u: any) => u.email === TEST_USER.email)
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id)
    }
  })

  test("complete signup flow", async ({ page }) => {
    // Navigate to signup page
    await page.goto("/auth/signup")

    // Fill signup form
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.fill('input[name="confirmPassword"]', TEST_USER.password)
    await page.fill('input[name="fullName"]', TEST_USER.name)

    // Check password strength indicator
    await expect(page.locator('[data-testid="password-strength"]')).toContainText("Strong")

    // Accept terms
    await page.check('input[name="acceptTerms"]')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to email verification page
    await expect(page).toHaveURL("/auth/verify-email/pending")
    await expect(page.locator("h1")).toContainText("Verify your email")
  })

  test("signin with unverified email shows warning", async ({ page }) => {
    // Create unverified user
    await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: false,
    })

    // Try to sign in
    await page.goto("/auth/signin")
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // Should show verification warning
    await expect(page.locator('[role="alert"]')).toContainText("verify your email")
  })

  test("password reset flow", async ({ page }) => {
    // Navigate to forgot password
    await page.goto("/auth/forgot-password")

    // Enter email
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.click('button[type="submit"]')

    // Should show success message
    await expect(page.locator('[role="alert"]')).toContainText("reset email sent")
  })

  test("signin with MFA", async ({ page }) => {
    // Create user with MFA enabled
    const {
      data: { user },
    } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
    })

    // Enable MFA for user
    await supabase.from("mfa_settings").insert({
      user_id: user.id,
      totp_enabled: true,
      totp_secret: "JBSWY3DPEHPK3PXP", // Test secret
    })

    // Try to sign in
    await page.goto("/auth/signin")
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // Should redirect to MFA page
    await expect(page).toHaveURL(/\/auth\/mfa/)
    await expect(page.locator("h1")).toContainText("Two-Factor Authentication")
  })

  test("account lockout after failed attempts", async ({ page }) => {
    // Create verified user
    await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
    })

    await page.goto("/auth/signin")

    // Try wrong password 5 times
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="email"]', TEST_USER.email)
      await page.fill('input[name="password"]', "WrongPassword123!")
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000) // Wait between attempts
    }

    // Should show account locked message
    await expect(page.locator('[role="alert"]')).toContainText("account has been locked")
  })

  test("session timeout and refresh", async ({ page, context }) => {
    // Create and sign in user
    const {
      data: { user },
    } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
    })

    await page.goto("/auth/signin")
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // Should be redirected to dashboard
    await expect(page).toHaveURL("/dashboard")

    // Get cookies
    const cookies = await context.cookies()
    const sessionCookie = cookies.find((c) => c.name === "access-token")
    expect(sessionCookie).toBeDefined()

    // Wait for session to be refreshed (in test, we'd mock this)
    await page.waitForTimeout(2000)

    // Check if still authenticated
    await page.reload()
    await expect(page).toHaveURL("/dashboard")
  })

  test("OAuth signin", async ({ page }) => {
    await page.goto("/auth/signin")

    // Check OAuth buttons exist
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible()
    await expect(page.locator('button:has-text("Continue with LinkedIn")')).toBeVisible()

    // Click Google OAuth (will redirect to Google)
    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      page.click('button:has-text("Continue with Google")'),
    ])

    // Check popup URL contains Google OAuth
    expect(popup.url()).toContain("accounts.google.com")
    await popup.close()
  })

  test("profile update", async ({ page }) => {
    // Create and sign in user
    const {
      data: { user },
    } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
    })

    // Sign in
    await page.goto("/auth/signin")
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')

    // Navigate to account settings
    await page.goto("/account/settings")

    // Update profile
    await page.fill('input[name="fullName"]', "Updated Name")
    await page.fill('input[name="phone"]', "+1234567890")
    await page.click('button:has-text("Update Profile")')

    // Check success message
    await expect(page.locator('[role="alert"]')).toContainText("Profile updated")

    // Reload and check values persisted
    await page.reload()
    await expect(page.locator('input[name="fullName"]')).toHaveValue("Updated Name")
    await expect(page.locator('input[name="phone"]')).toHaveValue("+1234567890")
  })
})
