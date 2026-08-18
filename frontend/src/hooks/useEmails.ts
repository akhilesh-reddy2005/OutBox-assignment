import { useCallback, useState } from "react";
import {
  getScheduledEmails,
  getSentEmails,
  scheduleEmails,
} from "../services/email.api";
import { getErrorMessage } from "../services/api";
import type { EmailJob, ScheduleEmailPayload } from "../types/email";

export function useEmails() {
  const [scheduledEmails, setScheduledEmails] = useState<EmailJob[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailJob[]>([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);
  const [isLoadingSent, setIsLoadingSent] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduled = useCallback(async () => {
    setIsLoadingScheduled(true);
    setError(null);
    try {
      const response = await getScheduledEmails();
      setScheduledEmails(response.emails);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingScheduled(false);
    }
  }, []);

  const fetchSent = useCallback(async () => {
    setIsLoadingSent(true);
    setError(null);
    try {
      const response = await getSentEmails();
      setSentEmails(response.emails);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingSent(false);
    }
  }, []);

  const schedule = useCallback(
    async (payload: ScheduleEmailPayload) => {
      setIsScheduling(true);
      setError(null);
      try {
        const response = await scheduleEmails(payload);
        await fetchScheduled();
        return response;
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsScheduling(false);
      }
    },
    [fetchScheduled]
  );

  return {
    scheduledEmails,
    sentEmails,
    isLoadingScheduled,
    isLoadingSent,
    isScheduling,
    error,
    fetchScheduled,
    fetchSent,
    schedule,
    clearError: () => setError(null),
  };
}
