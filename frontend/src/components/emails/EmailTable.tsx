import type { EmailJob } from "../../types/email";
import { formatDateParts } from "../../utils/formatDate";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { TableSkeleton } from "../ui/Skeleton";

interface EmailTableProps {
  emails: EmailJob[];
  isLoading: boolean;
  timeColumn: "scheduled" | "sent";
  emptyTitle: string;
  emptyDescription: string;
  onEmailClick: (email: EmailJob) => void;
}

export function EmailTable({
  emails,
  isLoading,
  timeColumn,
  emptyTitle,
  emptyDescription,
  onEmailClick,
}: EmailTableProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-surface border border-border-main rounded-xl p-6">
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden font-sans">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border-main bg-bg-secondary select-none">
            <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-muted w-1/4">
              Recipient
            </th>
            <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-muted w-2/5">
              Subject
            </th>
            <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-muted w-1/5">
              {timeColumn === "scheduled" ? "Scheduled" : "Sent"}
            </th>
            <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-muted text-right pr-7 w-1/6">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-main/65">
          {emails.map((email) => {
            const timeValue =
              timeColumn === "scheduled" ? email.scheduledAt : email.sentAt;
            const { date, time } = formatDateParts(timeValue);

            return (
              <tr
                key={email.id}
                onClick={() => onEmailClick(email)}
                className="hover:bg-bg-elevated/40 transition-colors cursor-pointer text-sm font-bold text-text-main h-13"
              >
                <td className="px-6 py-2.5 break-all truncate font-semibold">
                  {email.recipient}
                </td>
                <td className="px-6 py-2.5 text-text-muted truncate max-w-0 font-medium">
                  {email.subject}
                </td>
                <td className="px-6 py-2.5 text-text-muted/70 font-medium">
                  <span>{date}</span>
                  {time && <span className="text-xs text-text-muted/45 ml-1.5 font-semibold">· {time}</span>}
                </td>
                <td className="px-6 py-2.5 text-right pr-7">
                  <Badge status={email.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
