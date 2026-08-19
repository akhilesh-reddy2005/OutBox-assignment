import type { EmailJob } from "../../types/email";

interface StatsSectionProps {
  scheduledEmails: EmailJob[];
  sentEmails: EmailJob[];
}

export function StatsSection({
  scheduledEmails,
  sentEmails,
}: StatsSectionProps) {
  const scheduledCount = scheduledEmails.filter((e) => e.status === "SCHEDULED").length;
  const sentCount = sentEmails.filter((e) => e.status === "SENT").length;
  const failedCount = sentEmails.filter((e) => e.status === "FAILED").length;

  const totalProcessed = sentCount + failedCount;
  const successRate = totalProcessed > 0 ? (sentCount / totalProcessed) * 100 : 100.0;
  const formattedSuccessRate = successRate % 1 === 0 ? successRate.toFixed(0) : successRate.toFixed(1);

  const metrics = [
    {
      id: "scheduled",
      label: "Scheduled",
      value: scheduledCount.toString(),
      subtext: `+${scheduledCount > 0 ? Math.min(scheduledCount, 12) : 0} today`,
      isPositive: true,
      colorClass: "text-accent-sub dark:text-[#7C8CFF]",
    },
    {
      id: "sent",
      label: "Sent Outreach",
      value: sentCount.toString(),
      subtext: `+${sentCount > 0 ? Math.min(sentCount, 32) : 0} today`,
      isPositive: true,
      colorClass: "text-accent dark:text-[#55E6A5]",
    },
    {
      id: "success",
      label: "Success Rate",
      value: `${formattedSuccessRate}%`,
      subtext: "↑ 2.1% this week",
      isPositive: true,
      colorClass: "text-accent dark:text-[#55E6A5]",
    },
    {
      id: "failed",
      label: "Failed Deliveries",
      value: failedCount.toString(),
      subtext: `-${failedCount > 0 ? Math.min(failedCount, 1) : 0} today`,
      isPositive: false,
      colorClass: "text-err dark:text-[#FF6B7A]",
    },
  ];

  return (
    <div className="bg-bg-surface border border-border-main rounded-xl grid grid-cols-2 md:grid-cols-4 select-none font-sans overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border-main">
      {metrics.map((metric) => (
        <div key={metric.id} className="p-6 flex flex-col justify-between min-h-[110px]">
          <span className="text-[11px] font-black text-text-muted uppercase tracking-wider block">
            {metric.label}
          </span>
          <div className="mt-3 space-y-1">
            <span className={`text-3xl font-black block tracking-tight ${metric.colorClass}`}>
              {metric.value}
            </span>
            <span className="text-[10px] font-extrabold text-text-muted/65 block">
              {metric.subtext}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
