import { useEffect } from "react";
import type { EmailJob } from "../../types/email";
import { EmailTable } from "./EmailTable";

interface ScheduledEmailsProps {
  emails: EmailJob[];
  isLoading: boolean;
  onMount: () => void;
}

export function ScheduledEmails({
  emails,
  isLoading,
  onMount,
}: ScheduledEmailsProps) {
  useEffect(() => {
    onMount();
  }, [onMount]);

  return (
    <EmailTable
      emails={emails}
      isLoading={isLoading}
      timeColumn="scheduled"
      emptyTitle="No scheduled emails"
      emptyDescription="Schedule your first email to see it here."
    />
  );
}
