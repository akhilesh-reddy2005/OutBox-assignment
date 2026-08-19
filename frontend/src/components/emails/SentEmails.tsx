import { useEffect } from "react";
import type { EmailJob } from "../../types/email";
import { EmailTable } from "./EmailTable";

interface SentEmailsProps {
  emails: EmailJob[];
  isLoading: boolean;
  onMount: () => void;
  onEmailClick: (email: EmailJob) => void;
}

export function SentEmails({ emails, isLoading, onMount, onEmailClick }: SentEmailsProps) {
  useEffect(() => {
    onMount();
  }, [onMount]);

  return (
    <EmailTable
      emails={emails}
      isLoading={isLoading}
      timeColumn="sent"
      emptyTitle="No sent emails yet"
      emptyDescription="Sent and failed emails will appear here once processed."
      onEmailClick={onEmailClick}
    />
  );
}
