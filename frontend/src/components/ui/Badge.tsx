import type { EmailStatus } from "../../types/email";

interface BadgeProps {
  status: EmailStatus;
}

const statusConfig: Record<
  EmailStatus,
  { label: string; dotClass: string }
> = {
  SCHEDULED: {
    label: "Scheduled",
    dotClass: "bg-accent-sub",
  },
  PROCESSING: {
    label: "Processing",
    dotClass: "bg-warn",
  },
  SENT: {
    label: "Sent",
    dotClass: "bg-accent",
  },
  FAILED: {
    label: "Failed",
    dotClass: "bg-err",
  },
};

export function Badge({ status }: BadgeProps) {
  const config = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-text-muted select-none">
      <span className={`h-1.5 w-1.5 rounded-full block shrink-0 ${config.dotClass}`} />
      {config.label}
    </span>
  );
}
