import React from 'react';
import { format, parseISO } from 'date-fns';

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
);

interface ContractDetails {
    contract_start_date?: string | null;
    contract_end_date?: string | null;
}

interface ContractDetailPageProps {
    contract: ContractDetails;
}

const ContractDetailPage: React.FC<ContractDetailPageProps> = ({ contract }) => {
  return (
    <div className="space-y-4">
      <DetailItem
        label="Start Date"
        value={
          contract.contract_start_date
            ? format(parseISO(contract.contract_start_date), "dd-MM-yyyy")
            : "Not set"
        }
      />
      <DetailItem
        label="End Date"
        value={
          contract.contract_end_date
            ? format(parseISO(contract.contract_end_date), "dd-MM-yyyy")
            : "Not set"
        }
      />
    </div>
  );
};

export default ContractDetailPage;
