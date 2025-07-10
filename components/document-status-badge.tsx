import type { DocumentStatus } from '@/lib/document-status';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const statusConfigs: Record<DocumentStatus, StatusConfig> = {
  valid: {
    label: 'Valid',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  expiring_soon: {
    label: 'Expiring Soon',
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  expired: {
    label: 'Expired',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  missing: {
    label: 'Missing',
    icon: HelpCircle,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  label: string;
  expiryDate?: string | null;
  className?: string;
}

export function DocumentStatusBadge({ status, label, expiryDate, className }: DocumentStatusBadgeProps) {
  const config = statusConfigs[status];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center space-x-2 rounded-md border p-2", config.color, className)}>
      <Icon className="h-5 w-5" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs">
          {config.label}
          {expiryDate && ` (Expires: ${format(parseISO(expiryDate), 'PPP')})`}
        </span>
      </div>
    </div>
  );
}
