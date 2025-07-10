"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ContractDetail, Party, Promoter } from "@/lib/types";
import { useParties } from "@/hooks/use-parties";
import { usePromoters } from "@/hooks/use-promoters";
import { ComboboxField } from "./combobox-field";
import { DatePickerWithManualInput } from "./date-picker-with-manual-input";
import { createContract, updateContract, ContractInsert } from "@/app/actions/contracts";

const contractFormSchema = z.object({
  first_party_id: z.string().min(1, "First party is required."),
  second_party_id: z.string().min(1, "Second party is required."),
  promoter_id: z.string().min(1, "Promoter is required."),
  contract_start_date: z.date({ required_error: "Start date is required." }),
  contract_end_date: z.date({ required_error: "End date is required." }),
  contract_value: z.coerce.number().min(0, "Contract value must be a positive number.").optional(),
  job_title: z.string().optional(),
  work_location: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

interface ContractGeneratorFormProps {
  contract?: ContractDetail;
}

export function ContractGeneratorForm({ contract }: ContractGeneratorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data: parties, isLoading: partiesLoading } = useParties();
  const { data: promoters, isLoading: promotersLoading } = usePromoters();
  const [error, setError] = useState<string | null>(null);

  const defaultValues: Partial<ContractFormValues> = contract
    ? {
        first_party_id: contract.first_party_id,
        second_party_id: contract.second_party_id,
        promoter_id: contract.promoter_id,
        contract_start_date: contract.contract_start_date ? new Date(contract.contract_start_date) : undefined,
        contract_end_date: contract.contract_end_date ? new Date(contract.contract_end_date) : undefined,
        contract_value: contract.contract_value ?? undefined,
        job_title: contract.job_title ?? undefined,
        work_location: contract.work_location ?? undefined,
      }
    : {};

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues,
  });

  const onSubmit = (data: ContractFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        const payload: Partial<ContractInsert> = {
          ...data,
          contract_start_date: data.contract_start_date.toISOString(),
          contract_end_date: data.contract_end_date.toISOString(),
        };

        if (contract) {
          await updateContract(contract.id, payload);
          toast.success("Contract updated successfully!");
        } else {
          await createContract(payload as ContractInsert);
          toast.success("Contract created successfully!");
        }
        router.push("/contracts");
        router.refresh();
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const partyOptions =
    parties?.map((party) => ({
      value: party.id.toString(),
      label: party.name_en,
    })) || [];

  const promoterOptions =
    promoters?.map((promoter) => ({
      value: promoter.id.toString(),
      label: `${promoter.name_en} (${promoter.name_ar})`,
    })) || [];

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">
        {contract ? "Edit Contract" : "Generate New Contract"}
      </h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="first_party_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Party (e.g., Client)</FormLabel>
                <FormControl>
                  <ComboboxField
                    field={field}
                    options={partyOptions}
                    placeholder="Select a party"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="second_party_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Second Party (e.g., Employer)</FormLabel>
                <FormControl>
                  <ComboboxField
                    field={field}
                    options={partyOptions}
                    placeholder="Select a party"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="promoter_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Promoter</FormLabel>
                <FormControl>
                  <ComboboxField
                    field={field}
                    options={promoterOptions}
                    placeholder="Select a promoter"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contract_start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <DatePickerWithManualInput
                    date={field.value}
                    setDate={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contract_end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <DatePickerWithManualInput
                    date={field.value}
                    setDate={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contract_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Value</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter contract value" 
                    {...field} 
                    onChange={event => field.onChange(event.target.value === '' ? null : +event.target.value)}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter job title" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="work_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Location</FormLabel>
                <FormControl>
                  <Input placeholder="Enter work location" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? (contract ? "Updating..." : "Creating...") : (contract ? "Update Contract" : "Create Contract")}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default ContractGeneratorForm;
