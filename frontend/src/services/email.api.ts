import api from "./api";
import type {
  EmailsResponse,
  ScheduleEmailPayload,
  ScheduleEmailResponse,
} from "../types/email";

export async function getScheduledEmails(): Promise<EmailsResponse> {
  const { data } = await api.get<EmailsResponse>("/api/emails/scheduled");
  return data;
}

export async function getSentEmails(): Promise<EmailsResponse> {
  const { data } = await api.get<EmailsResponse>("/api/emails/sent");
  return data;
}

export async function scheduleEmails(
  payload: ScheduleEmailPayload
): Promise<ScheduleEmailResponse> {
  const { data } = await api.post<ScheduleEmailResponse>(
    "/api/emails/schedule",
    payload
  );
  return data;
}
