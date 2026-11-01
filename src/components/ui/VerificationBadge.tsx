import { CircleAlert, CircleCheck, CircleDashed } from 'lucide-react';
import { formatFullDate } from '../../lib/format';
import type { ISODate, VerificationStatus } from '../../types';

const CONFIG = {
  verified: {
    label: 'Verified',
    icon: CircleCheck,
    classes: 'bg-status-verified-bg text-status-verified border-status-verified/30',
  },
  partial: {
    label: 'Partially verified',
    icon: CircleDashed,
    classes: 'bg-status-partial-bg text-status-partial border-status-partial/30',
  },
  unverified: {
    label: 'Not yet verified',
    icon: CircleAlert,
    classes: 'bg-status-unverified-bg text-status-unverified border-status-unverified/30',
  },
} satisfies Record<VerificationStatus, unknown>;

interface Props {
  status: VerificationStatus;
  lastVerified?: ISODate | null;
}

export function VerificationBadge({ status, lastVerified }: Props) {
  const { label, icon: Icon, classes } = CONFIG[status];
  const date = formatFullDate(lastVerified ?? null);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-caption font-semibold ${classes}`}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
      {date && <span className="font-normal">· checked {date}</span>}
    </span>
  );
}
