import { ContractFormSchema } from "../contract"

describe("ContractFormSchema", () => {
  const baseData = {
    firstPartyId: "1",
    secondPartyId: "2",
    promoterId: "3",
    contractStartDate: "01-01-2025",
    contractEndDate: "02-01-2025",
    jobTitleEn: "Dev",
    jobTitleAr: "مطور",
    salaryAmount: 100,
    salaryCurrency: "SAR",
    workingHours: "8",
    workingDays: "Mon-Fri",
    annualLeaveDays: 1,
    promoterIdCardCopy: new File(["a"], "id.jpg", { type: "image/jpeg" }),
    promoterPassportCopy: new File(["a"], "pass.pdf", { type: "application/pdf" }),
  }

  it("accepts valid dates in DD-MM-YYYY format", () => {
    const result = ContractFormSchema.safeParse(baseData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.contractStartDate).toBeInstanceOf(Date)
    }
  })

  it("rejects invalid date formats", () => {
    const result = ContractFormSchema.safeParse({
      ...baseData,
      contractStartDate: "2025/01/01",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.contractStartDate?.[0]).toMatch(
        /Invalid date format/,
      )
    }
  })

  it("accepts allowed file types", () => {
    const result = ContractFormSchema.safeParse(baseData)
    expect(result.success).toBe(true)
  })

  it("rejects disallowed file types", () => {
    const result = ContractFormSchema.safeParse({
      ...baseData,
      promoterIdCardCopy: new File(["a"], "test.txt", { type: "text/plain" }),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.promoterIdCardCopy?.[0]).toMatch(
        /files are accepted/,
      )
    }
  })

  it("rejects files exceeding size limit", () => {
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "big.pdf", {
      type: "application/pdf",
    })
    const result = ContractFormSchema.safeParse({
      ...baseData,
      promoterIdCardCopy: bigFile,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.promoterIdCardCopy?.[0]).toMatch(/Max file size/)
    }
  })
})
