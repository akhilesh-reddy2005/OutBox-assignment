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
}

export function EmailTable({
  emails,
  isLoading,
  timeColumn,
  emptyTitle,
  emptyDescription,
}: EmailTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {timeColumn === "scheduled" ? "Scheduled Time" : "Sent Time"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {emails.map((email) => {
              const timeValue =
                timeColumn === "scheduled" ? email.scheduledAt : email.sentAt;
              const { date, time } = formatDateParts(timeValue);

              return (
                <tr
                  key={email.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {email.recipient}
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                    {email.subject}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div>{date}</div>
                    {time && (
                      <div className="text-xs text-gray-400">{time}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={email.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {emails.map((email) => {
          const timeValue =
            timeColumn === "scheduled" ? email.scheduledAt : email.sentAt;
          const { date, time } = formatDateParts(timeValue);

          return (
            <div
              key={email.id}
              className="rounded-xl border border-gray-200 bg-white p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 break-all">
                  {email.recipient}
                </p>
                <Badge status={email.status} />
              </div>
              <p className="text-sm text-gray-600">{email.subject}</p>
              <p className="text-xs text-gray-400">
                {date}
                {time && ` · ${time}`}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
