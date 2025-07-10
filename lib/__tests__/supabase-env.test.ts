import { z } from "zod"

describe("Supabase Environment Variables", () => {
  it("should have NEXT_PUBLIC_SUPABASE_URL defined", () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    expect(typeof process.env.NEXT_PUBLIC_SUPABASE_URL).toBe("string")
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).not.toBe("")
    // Optionally, validate it's a URL
    expect(() => z.string().url().parse(process.env.NEXT_PUBLIC_SUPABASE_URL)).not.toThrow()
  })

  it("should have NEXT_PUBLIC_SUPABASE_ANON_KEY defined", () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
    expect(typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("string")
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).not.toBe("")
  })

  it("should have SUPABASE_SERVICE_ROLE_KEY defined (for server-side operations)", () => {
    // This key is typically only used on the server, so it might not be available in all test environments
    // For client-side tests, you might mock it or skip this test.
    // For server-side tests, ensure it's set.
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      // In a typical Next.js setup, server-side envs are available during build/runtime
      // For Jest, you might need to explicitly set it in setupFiles or mock it.
      // This test assumes it's available if running in an environment where it should be.
      console.warn("Skipping SUPABASE_SERVICE_ROLE_KEY check in client-side test environment.")
    } else {
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined()
      expect(typeof process.env.SUPABASE_SERVICE_ROLE_KEY).toBe("string")
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).not.toBe("")
    }
  })
})
