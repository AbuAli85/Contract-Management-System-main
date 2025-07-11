import { describe, it, expect } from "@jest/globals"
import {
  checkPasswordStrength,
  createPasswordSchema,
  defaultPasswordRequirements,
} from "@/lib/auth/password-validator"

describe("Password Validator", () => {
  describe("checkPasswordStrength", () => {
    it("should return weak score for simple passwords", () => {
      const result = checkPasswordStrength("password")
      expect(result.score).toBeLessThan(2)
      expect(result.isStrong).toBe(false)
      expect(result.feedback.length).toBeGreaterThan(0)
    })

    it("should return strong score for complex passwords", () => {
      const result = checkPasswordStrength("MyStr0ng!P@ssw0rd123")
      expect(result.score).toBeGreaterThanOrEqual(3)
      expect(result.isStrong).toBe(true)
      expect(result.feedback.length).toBe(0)
    })

    it("should detect common passwords", () => {
      const result = checkPasswordStrength("Password123!")
      expect(result.feedback).toContain("This password is too common")
      expect(result.isStrong).toBe(false)
    })

    it("should detect user info in password", () => {
      const result = checkPasswordStrength("john.doe@example123!", defaultPasswordRequirements, {
        email: "john.doe@example.com",
        name: "John Doe",
      })
      expect(result.feedback.some((f) => f.includes("email"))).toBe(true)
    })

    it("should detect repeating characters", () => {
      const result = checkPasswordStrength("Passsword123!")
      expect(result.feedback).toContain("Avoid repeating characters")
    })

    it("should detect sequential characters", () => {
      const result = checkPasswordStrength("Abc123!@#def")
      expect(result.feedback).toContain("Avoid sequential characters")
    })

    it("should give bonus for extra length", () => {
      const shortResult = checkPasswordStrength("Short1!Pass")
      const longResult = checkPasswordStrength("ThisIsAVeryLongPasswordWith123!@#")
      expect(longResult.score).toBeGreaterThan(shortResult.score)
    })
  })

  describe("createPasswordSchema", () => {
    it("should validate passwords according to requirements", () => {
      const schema = createPasswordSchema()

      expect(() => schema.parse("weak")).toThrow()
      expect(() => schema.parse("NoNumbers!")).toThrow()
      expect(() => schema.parse("nonumbers123")).toThrow()
      expect(() => schema.parse("NoSpecial123")).toThrow()
      expect(() => schema.parse("ValidP@ssw0rd!")).not.toThrow()
    })

    it("should respect custom requirements", () => {
      const schema = createPasswordSchema({
        ...defaultPasswordRequirements,
        minLength: 8,
        requireSpecialChars: false,
      })

      expect(() => schema.parse("Short1")).toThrow()
      expect(() => schema.parse("ValidPass123")).not.toThrow()
    })
  })
})
