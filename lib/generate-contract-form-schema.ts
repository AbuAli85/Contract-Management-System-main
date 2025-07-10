import { z } from "zod"

export const formSchema = z
  .object({
    contractName: z.string().min(1, "Contract name is required"),
    contractType: z.string().min(1, "Contract type is required"),
    partyA: z.string().uuid("Please select a valid party"),
    partyB: z.string().uuid("Please select a valid party"),
    promoter: z.string().uuid("Please select a valid promoter"),
    effectiveDate: z.date().optional(),
    terminationDate: z.date().optional(),
    contractValue: z.number().optional(),
    paymentTerms: z.string().optional(),
    contentEnglish: z.string().optional(),
    contentSpanish: z.string().optional(),
  })
  .refine((d) => {
    if (d.effectiveDate && d.terminationDate) {
      return d.terminationDate > d.effectiveDate
    }
    return true
  }, {
    path: ["terminationDate"],
    message: "Termination date must be after effective date",
  })

// Export the schema with the expected name
export const generateContractFormSchema = formSchema

// Export the type
export type GenerateContractFormValues = z.infer<typeof formSchema>
