import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getPartyDetails, calculateDuration } from "@/lib/utils";
import { Contract, Party } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon, CopyIcon } from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { getStatusConfig } from "@/constants/status";

interface ContractDetail extends Contract {
    parties: Party[];
}

export default async function ContractPage({ params }: { params: { id: string } }) {
    if (!params.id) {
        notFound();
    }

    const supabase = createServerComponentClient({ cookies });
    const { data: contract, error } = await supabase
        .from('contracts')
        .select(`
            *,
            parties:parties(*)
        `)
        .eq('id', params.id)
        .single();

    if (error || !contract) {
        console.error("Error fetching contract:", error);
        notFound();
    }

    const typedContract = contract as ContractDetail;

    const { employer, employee, promoter } = getPartyDetails(typedContract.parties);

    const statusConfig = getStatusConfig(typedContract.status);
    const StatusIcon = statusConfig.icon;
    const contractId = typedContract.id;

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <Link href="/contracts">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Back to Contracts
                    </Link>
                </Button>
            </div>
            <div className="grid gap-6">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Contract Details</h1>
                        <Badge
                            className={`${statusConfig.color} flex items-center gap-1 px-3 py-1 text-sm font-medium`}>
                            <StatusIcon className="h-4 w-4" />
                            {statusConfig.label}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">Contract Information</h2>
                            <div className="space-y-2">
                                <p><strong>ID:</strong>
                                    <code
                                        className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{contractId}</code>
                                    <Button size="sm" variant="ghost"
                                        onClick={() => navigator.clipboard.writeText(contractId)}>
                                        <CopyIcon className="h-3 w-3" />
                                    </Button>
                                </p>
                                <p><strong>Title:</strong> {typedContract.title || 'N/A'}</p>
                                <p><strong>Start
                                    Date:</strong> {typedContract.start_date ? new Date(typedContract.start_date).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>End Date:</strong> {typedContract.end_date ? new Date(typedContract.end_date).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Duration:</strong> {typedContract.start_date && typedContract.end_date ? calculateDuration(typedContract.start_date, typedContract.end_date) : 'N/A'}</p>
                                <p><strong>Total
                                    Value:</strong> ${typedContract.total_value ? typedContract.total_value.toLocaleString() : 'N/A'}</p>
                            </div>
                        </div>
                        {promoter && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">Promoter</h2>
                                <div className="space-y-2">
                                    <p><strong>Name:</strong> {promoter.name_en}</p>
                                    <p><strong>Phone:</strong> {promoter.contact_phone}</p>
                                    <p><strong>Email:</strong> {promoter.contact_email}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {employer && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">Employer</h2>
                                <div className="space-y-2">
                                    <p><strong>Name:</strong> {employer.name_en}</p>
                                    <p><strong>Address:</strong> {employer.address_en}</p>
                                    <p><strong>Phone:</strong> {employer.contact_phone}</p>
                                    <p><strong>Email:</strong> {employer.contact_email}</p>
                                </div>
                            </div>
                        )}

                        {employee && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">Employee</h2>
                                <div className="space-y-2">
                                    <p><strong>Name:</strong> {employee.name_en}</p>
                                    <p><strong>Address:</strong> {employee.address_en}</p>
                                    <p><strong>Phone:</strong> {employee.contact_phone}</p>
                                    <p><strong>Email:</strong> {employee.contact_email}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
