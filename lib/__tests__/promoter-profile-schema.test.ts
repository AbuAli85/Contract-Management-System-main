import { promoterProfileSchema } from "../promoter-profile-schema"

describe("promoterProfileSchema", () => {
  const baseData = {
    name_en: "John",
    name_ar: "جون",
    id_card_number: "123",
    status: "active" as const,
    contract_valid_until: "2025-12-31",
    id_card_image: new File(["a"], "id.jpg", { type: "image/jpeg" }),
    passport_image: new File(["a"], "pass.jpg", { type: "image/jpeg" }),
  }

  it("accepts valid ISO date strings", () => {
    const result = promoterProfileSchema.safeParse(baseData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.contract_valid_until).toBeInstanceOf(Date)
    }
  })

  it("rejects invalid date strings", () => {
    const result = promoterProfileSchema.safeParse({
      ...baseData,
      contract_valid_until: "not-a-date",
    })
    expect(result.success).toBe(false)
  })

  it("accepts allowed file types", () => {
    const result = promoterProfileSchema.safeParse(baseData)
    expect(result.success).toBe(true)
  })

  it("rejects disallowed file types", () => {
    const result = promoterProfileSchema.safeParse({
      ...baseData,
      id_card_image: new File(["a"], "id.pdf", { type: "application/pdf" }),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.id_card_image?.[0]).toMatch(/files are accepted/)
    }
  })

  it("rejects files exceeding size limit", () => {
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" })
    const result = promoterProfileSchema.safeParse({
      ...baseData,
      id_card_image: bigFile,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.id_card_image?.[0]).toMatch(/Max file size/)
    }
  })
})
