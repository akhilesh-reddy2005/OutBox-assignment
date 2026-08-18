import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/Button";
import { ScheduledEmails } from "../components/emails/ScheduledEmails";
import { SentEmails } from "../components/emails/SentEmails";
import { ComposeEmail } from "../components/emails/ComposeEmail";
import { useEmails } from "../hooks/useEmails";
import { useToast } from "../hooks/useToast";
import type { ScheduleEmailPayload } from "../types/email";

type Tab = "scheduled" | "sent";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("scheduled");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const { showToast } = useToast();

  const {
    scheduledEmails,
    sentEmails,
    isLoadingScheduled,
    isLoadingSent,
    isScheduling,
    fetchScheduled,
    fetchSent,
    schedule,
  } = useEmails();

  const handleSchedule = async (payload: ScheduleEmailPayload) => {
    try {
      const response = await schedule(payload);
      showToast(
        `Successfully scheduled ${response.count} email${response.count !== 1 ? "s" : ""}.`,
        "success"
      );
      setIsComposeOpen(false);
      setActiveTab("scheduled");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to schedule emails.",
        "error"
      );
    }
  };

  const loadScheduled = useCallback(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  const loadSent = useCallback(() => {
    fetchSent();
  }, [fetchSent]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "scheduled", label: "Scheduled Emails" },
    { id: "sent", label: "Sent Emails" },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Emails</h1>
        <Button onClick={() => setIsComposeOpen(true)}>
          <Plus className="h-4 w-4" />
          Compose New Email
        </Button>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Email tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "scheduled" ? (
        <ScheduledEmails
          emails={scheduledEmails}
          isLoading={isLoadingScheduled}
          onMount={loadScheduled}
        />
      ) : (
        <SentEmails
          emails={sentEmails}
          isLoading={isLoadingSent}
          onMount={loadSent}
        />
      )}

      <ComposeEmail
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSubmit={handleSchedule}
        isSubmitting={isScheduling}
      />
    </DashboardLayout>
  );
}
