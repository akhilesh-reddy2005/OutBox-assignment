import type { EmailStatus } from "../../types/email";

interface BadgeProps {
  status: EmailStatus;
}

const statusConfig: Record<
  EmailStatus,
  { label: string; className: string }
> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  SENT: {
    label: "Sent",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function Badge({ status }: BadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
