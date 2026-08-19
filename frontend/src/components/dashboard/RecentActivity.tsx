import { MessageSquare } from "lucide-react";
import type { EmailJob } from "../../types/email";
import { formatDateParts } from "../../utils/formatDate";

interface RecentActivityProps {
  scheduledEmails: EmailJob[];
  sentEmails: EmailJob[];
}

export function RecentActivity({
  scheduledEmails,
  sentEmails,
}: RecentActivityProps) {
  const allJobs = [...scheduledEmails, ...sentEmails]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (allJobs.length === 0) {
    return (
      <div className="bg-bg-surface border border-border-main rounded-xl p-10 text-center select-none font-sans">
        <MessageSquare className="h-8 w-8 text-text-muted/30 mx-auto mb-3.5" />
        <p className="text-sm font-bold text-text-main">Nothing queued yet.</p>
        <p className="text-xs text-text-muted/60 mt-1 font-semibold">Your sending logs will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden font-sans select-none">
      <div className="px-6 py-4.5 border-b border-border-main bg-bg-secondary">
        <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">
          Sending Activity Log
        </h3>
      </div>
      
      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {allJobs.map((job, idx) => {
              const { date, time } = formatDateParts(job.status === "SENT" ? job.sentAt || job.updatedAt : job.scheduledAt);
              const formattedTime = time ? `${time}` : date;

              let dotColor = "bg-accent-sub";
              let glowRing = "";
              let title = `Email scheduled`;
              
              if (job.status === "SENT") {
                dotColor = "bg-accent";
                glowRing = "ring-4 ring-accent/20";
                title = `Email sent`;
              } else if (job.status === "FAILED") {
                dotColor = "bg-err";
                title = `Email failed`;
              }

              return (
                <li key={job.id}>
                  <div className="relative pb-8">
                    {idx !== allJobs.length - 1 && (
                      <span
                        className="absolute left-2.5 top-6.5 -ml-px h-full w-0.5 bg-border-main"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-4.5 items-start">
                      <div className="pt-2 shrink-0">
                        <span className={`h-2.5 w-2.5 rounded-full block ${dotColor} ${glowRing}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[11px] font-bold text-text-muted block">
                              ● {formattedTime}
                            </span>
                            <p className="text-sm font-extrabold text-text-main mt-0.5">
                              {title}{" "}
                              <span className="text-text-muted font-bold break-all">
                                {job.recipient}
                              </span>
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-text-muted/70 font-semibold mt-1 truncate max-w-[280px]">
                          {job.subject}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
