import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/Button";
import { EmailTable } from "../components/emails/EmailTable";
import { ComposeEmail } from "../components/emails/ComposeEmail";
import { EmailDetailDrawer } from "../components/emails/EmailDetailDrawer";
import { StatsSection } from "../components/dashboard/StatsSection";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { useEmails } from "../hooks/useEmails";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { formatDateParts } from "../utils/formatDate";
import type { ScheduleEmailPayload, EmailJob } from "../types/email";

type MainTab = "overview" | "emails" | "settings";
type EmailSubTab = "all" | "scheduled" | "sent" | "failed";

export function Dashboard() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<MainTab>("overview");
  const [activeSubTab, setActiveSubTab] = useState<EmailSubTab>("all");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && activeTab !== "emails") {
      setActiveTab("emails");
    }
  };

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
      await schedule(payload);
      showToast("Email scheduled", "success");
      setIsComposeOpen(false);
      
      // Refresh lists
      fetchScheduled();
      fetchSent();
      
      // Switch tab
      setActiveTab("emails");
      setActiveSubTab("scheduled");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Unable to schedule email",
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

  // Initial load triggers
  useEffect(() => {
    loadScheduled();
    loadSent();
  }, [loadScheduled, loadSent]);

  // First name extraction
  const firstName = user?.name ? user.name.split(" ")[0] : "User";

  // Dynamic greeting based on current time
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Tab Filtering
  const getFilteredEmails = (): EmailJob[] => {
    let list: EmailJob[] = [];
    if (activeSubTab === "scheduled") {
      list = scheduledEmails.filter((e) => e.status === "SCHEDULED" || e.status === "PROCESSING");
    } else if (activeSubTab === "sent") {
      list = sentEmails.filter((e) => e.status === "SENT");
    } else if (activeSubTab === "failed") {
      list = sentEmails.filter((e) => e.status === "FAILED");
    } else {
      list = [...scheduledEmails, ...sentEmails];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.recipient.toLowerCase().includes(q)
      );
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const filteredEmails = getFilteredEmails();

  // Overview Progress Stats
  const scheduledCount = scheduledEmails.filter((e) => e.status === "SCHEDULED").length;
  const processingCount = scheduledEmails.filter((e) => e.status === "PROCESSING").length;
  const sentCount = sentEmails.filter((e) => e.status === "SENT").length;
  const failedCount = sentEmails.filter((e) => e.status === "FAILED").length;
  const totalOverview = scheduledCount + processingCount + sentCount + failedCount || 1;

  const schedPercent = (scheduledCount / totalOverview) * 100;
  const procPercent = (processingCount / totalOverview) * 100;
  const sentPercent = (sentCount / totalOverview) * 100;
  const failPercent = (failedCount / totalOverview) * 100;

  // Next 5 upcoming scheduled emails
  const upcomingEmails = scheduledEmails
    .filter((e) => e.status === "SCHEDULED")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      activeSubTab={activeSubTab}
      setActiveSubTab={setActiveSubTab}
      searchQuery={searchQuery}
      setSearchQuery={handleSearchChange}
    >
      {activeTab === "overview" && (
        <div className="space-y-8 animate-slide-in select-none font-sans">
          
          {/* Operations Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-text-main tracking-tight">
                {getGreeting()}, {firstName}.
              </h1>
              <p className="text-xs sm:text-sm text-text-muted mt-1 font-bold">
                Here's your email activity for today.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { fetchScheduled(); fetchSent(); }}
                disabled={isLoadingScheduled || isLoadingSent}
                className="h-9 px-3.5 flex items-center gap-2 border border-border-main rounded-lg text-xs font-bold text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors disabled:opacity-40 cursor-pointer select-none"
                title="Refresh email lists"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingScheduled || isLoadingSent ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Button
                onClick={() => setIsComposeOpen(true)}
                variant="primary"
                size="md"
                className="shrink-0 rounded-lg text-xs py-2.5 px-4.5"
              >
                <Plus className="h-4.5 w-4.5 mr-1 stroke-[2.5]" />
                Compose Email
              </Button>
            </div>
          </div>

          {/* Dynamic metric strip */}
          <StatsSection scheduledEmails={scheduledEmails} sentEmails={sentEmails} />

          {/* Main 3-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sending activity timeline */}
            <div className="lg:col-span-2">
              <RecentActivity scheduledEmails={scheduledEmails} sentEmails={sentEmails} />
            </div>

            {/* Campaign progress stats & Upcoming logs */}
            <div className="space-y-8">
              
              {/* Campaign Overview Panel */}
              <div className="bg-bg-surface border border-border-main rounded-xl p-6 space-y-5">
                <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">
                  Email Overview
                </h3>
                
                <div className="space-y-4 text-xs font-extrabold text-text-main">
                  {/* Scheduled */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-text-muted">
                      <span>Scheduled</span>
                      <span className="text-accent-sub">{scheduledCount}</span>
                    </div>
                    <div className="h-2 w-full bg-bg-primary rounded overflow-hidden">
                      <div className="h-full bg-accent-sub rounded" style={{ width: `${schedPercent}%` }} />
                    </div>
                  </div>

                  {/* Sending */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-text-muted">
                      <span>Sending / Active</span>
                      <span className="text-warn">{processingCount}</span>
                    </div>
                    <div className="h-2 w-full bg-bg-primary rounded overflow-hidden">
                      <div className="h-full bg-warn rounded" style={{ width: `${procPercent}%` }} />
                    </div>
                  </div>

                  {/* Completed */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-text-muted">
                      <span>Completed / Sent</span>
                      <span className="text-accent">{sentCount}</span>
                    </div>
                    <div className="h-2 w-full bg-bg-primary rounded overflow-hidden">
                      <div className="h-full bg-accent rounded" style={{ width: `${sentPercent}%` }} />
                    </div>
                  </div>

                  {/* Failed */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-text-muted">
                      <span>Failed / Bounced</span>
                      <span className="text-err">{failedCount}</span>
                    </div>
                    <div className="h-2 w-full bg-bg-primary rounded overflow-hidden">
                      <div className="h-full bg-err rounded" style={{ width: `${failPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming scheduled queue list panel */}
              <div className="bg-bg-surface border border-border-main rounded-xl p-6 space-y-5">
                <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">
                  Upcoming Queue
                </h3>

                {upcomingEmails.length === 0 ? (
                  <p className="text-xs font-bold text-text-muted/50">
                    Nothing queued yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {upcomingEmails.map((email) => {
                      const { time, date } = formatDateParts(email.scheduledAt);
                      const formattedTime = time ? `${time}` : date;

                      return (
                        <div key={email.id} className="flex justify-between items-start border-b border-border-main/40 pb-3.5 last:border-b-0 last:pb-0 gap-3">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-text-muted/70 block truncate max-w-[140px]">
                              {email.recipient}
                            </span>
                            <span className="text-xs font-extrabold text-text-main block truncate max-w-[140px] mt-0.5">
                              {email.subject}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-accent shrink-0 bg-accent/10 border border-accent/20 rounded-full px-2.5 py-0.5">
                            {formattedTime}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {activeTab === "emails" && (
        <div className="space-y-8 animate-slide-in select-none font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-text-main tracking-tight">Emails</h1>
              <p className="text-xs sm:text-sm text-text-muted mt-1 font-bold">
                Manage your scheduled and sent emails.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { fetchScheduled(); fetchSent(); }}
                disabled={isLoadingScheduled || isLoadingSent}
                className="h-9 px-3.5 flex items-center gap-2 border border-border-main rounded-lg text-xs font-bold text-text-muted hover:text-text-main hover:bg-bg-elevated transition-colors disabled:opacity-40 cursor-pointer select-none"
                title="Refresh email lists"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingScheduled || isLoadingSent ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Button
                onClick={() => setIsComposeOpen(true)}
                variant="primary"
                size="md"
                className="shrink-0 rounded-lg text-xs py-2.5 px-4.5"
              >
                <Plus className="h-4.5 w-4.5 mr-1 stroke-[2.5]" />
                Compose Email
              </Button>
            </div>
          </div>

          {/* Sub Tab filters row */}
          <div className="border-b border-border-main">
            <nav className="-mb-px flex gap-8" aria-label="Email filters">
              {(["all", "scheduled", "sent", "failed"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveSubTab(tab)}
                  className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeSubTab === tab
                      ? "border-accent text-accent"
                      : "border-transparent text-text-muted hover:text-text-main"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Emails table dense representation */}
          <EmailTable
            emails={filteredEmails}
            isLoading={isLoadingScheduled || isLoadingSent}
            timeColumn={activeSubTab === "sent" ? "sent" : "scheduled"}
            emptyTitle={activeSubTab === "sent" ? "Your sent activity will appear here." : "Nothing queued yet."}
            emptyDescription=""
            onEmailClick={setSelectedEmail}
          />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-8 max-w-2xl animate-slide-in select-none font-sans">
          <div>
            <h1 className="text-2xl font-black text-text-main tracking-tight">Settings</h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 font-bold">
              Manage your outreach automation parameters.
            </p>
          </div>

          {/* Account info section */}
          <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-main bg-bg-secondary">
              <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">Account Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm font-bold text-text-main">
                <div>
                  <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-wider block">Full Name</span>
                  <span className="block mt-1.5 font-black">{user?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-wider block">Email Address</span>
                  <span className="block mt-1.5 font-black">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Theme customizer settings option */}
          <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-main bg-bg-secondary">
              <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">Theme Customization</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5 max-w-xs text-xs font-bold text-text-main">
                <label htmlFor="theme-select" className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Interface Theme
                </label>
                <select
                  id="theme-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                  className="w-full h-10 px-3 rounded-lg border border-border-main bg-bg-surface text-sm text-text-main font-bold focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Compose Campaign Workspace Modal */}
      <ComposeEmail
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSubmit={handleSchedule}
        isSubmitting={isScheduling}
      />

      {/* Email detail slide drawer */}
      {selectedEmail && (
        <EmailDetailDrawer
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </DashboardLayout>
  );
}
