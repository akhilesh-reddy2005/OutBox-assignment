export type EmailStatus = "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED";

export interface EmailJob {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sendStartedAt: string | null;
  sentAt: string | null;
  status: EmailStatus;
  attempts: number;
  error: string | null;
  idempotencyKey: string;
  delayMs: number;
  hourlyLimit: number;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEmailPayload {
  subject: string;
  body: string;
  emails: string[];
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
}

export interface EmailsResponse {
  success: boolean;
  emails: EmailJob[];
}

export interface ScheduleEmailResponse {
  success: boolean;
  count: number;
  jobs: EmailJob[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}
