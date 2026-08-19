import { useState } from "react";
import { BarChart3, Mail, Settings as SettingsIcon, LogOut, Calendar, Send } from "lucide-react";
import type { User } from "../../types/auth";

interface SidebarProps {
  activeTab: "overview" | "emails" | "settings";
  setActiveTab: (tab: "overview" | "emails" | "settings") => void;
  activeSubTab?: "all" | "scheduled" | "sent" | "failed";
  setActiveSubTab?: (tab: "all" | "scheduled" | "sent" | "failed") => void;
  user: User | null;
  onLogout: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  activeSubTab = "all",
  setActiveSubTab,
  user,
  onLogout,
}: SidebarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const handleNav = (main: "overview" | "emails" | "settings", sub?: "all" | "scheduled" | "sent" | "failed") => {
    setActiveTab(main);
    if (sub && setActiveSubTab) {
      setActiveSubTab(sub);
    }
  };

  return (
    <aside className="w-60 bg-bg-secondary border-r border-border-main flex flex-col shrink-0 h-screen sticky top-0 font-sans">
      {/* Brand logo block */}
      <div className="h-16 px-6 border-b border-border-main flex items-center gap-2.5 bg-bg-secondary select-none shrink-0">
        <div className="flex h-7.5 w-7.5 items-center justify-center rounded bg-bg-surface border border-border-main">
          <span className="text-[11px] font-black text-accent tracking-tighter">R</span>
        </div>
        <span className="text-sm font-black text-text-main tracking-tight">
          ReachInbox
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-5 overflow-y-auto space-y-5">
        {/* Workspace section */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-text-muted/45 uppercase tracking-widest px-6 py-1 block select-none">
            Workspace
          </span>
          
          {/* Overview link */}
          <button
            type="button"
            onClick={() => handleNav("overview")}
            className={`w-full flex items-center gap-3.5 px-5.5 py-2.5 text-sm font-bold transition-all border-l-2 select-none ${
              activeTab === "overview"
                ? "bg-bg-elevated text-text-main border-accent"
                : "bg-transparent text-text-muted border-transparent hover:bg-bg-surface hover:text-text-main"
            }`}
          >
            <BarChart3 className={`h-4.5 w-4.5 shrink-0 ${activeTab === "overview" ? "text-accent" : "text-text-muted"}`} />
            Overview
          </button>

          {/* Emails link */}
          <button
            type="button"
            onClick={() => handleNav("emails", "all")}
            className={`w-full flex items-center gap-3.5 px-5.5 py-2.5 text-sm font-bold transition-all border-l-2 select-none ${
              activeTab === "emails" && activeSubTab === "all"
                ? "bg-bg-elevated text-text-main border-accent"
                : "bg-transparent text-text-muted border-transparent hover:bg-bg-surface hover:text-text-main"
            }`}
          >
            <Mail className={`h-4.5 w-4.5 shrink-0 ${activeTab === "emails" && activeSubTab === "all" ? "text-accent" : "text-text-muted"}`} />
            Emails
          </button>

          {/* Scheduled link */}
          <button
            type="button"
            onClick={() => handleNav("emails", "scheduled")}
            className={`w-full flex items-center gap-3.5 px-5.5 py-2.5 text-sm font-bold transition-all border-l-2 select-none ${
              activeTab === "emails" && activeSubTab === "scheduled"
                ? "bg-bg-elevated text-text-main border-accent"
                : "bg-transparent text-text-muted border-transparent hover:bg-bg-surface hover:text-text-main"
            }`}
          >
            <Calendar className={`h-4.5 w-4.5 shrink-0 ${activeTab === "emails" && activeSubTab === "scheduled" ? "text-accent" : "text-text-muted"}`} />
            Scheduled
          </button>

          {/* Sent link */}
          <button
            type="button"
            onClick={() => handleNav("emails", "sent")}
            className={`w-full flex items-center gap-3.5 px-5.5 py-2.5 text-sm font-bold transition-all border-l-2 select-none ${
              activeTab === "emails" && activeSubTab === "sent"
                ? "bg-bg-elevated text-text-main border-accent"
                : "bg-transparent text-text-muted border-transparent hover:bg-bg-surface hover:text-text-main"
            }`}
          >
            <Send className={`h-4.5 w-4.5 shrink-0 ${activeTab === "emails" && activeSubTab === "sent" ? "text-accent" : "text-text-muted"}`} />
            Sent
          </button>
        </div>

        {/* Manage section */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-text-muted/45 uppercase tracking-widest px-6 py-1 block select-none">
            Manage
          </span>

          {/* Settings link */}
          <button
            type="button"
            onClick={() => handleNav("settings")}
            className={`w-full flex items-center gap-3.5 px-5.5 py-2.5 text-sm font-bold transition-all border-l-2 select-none ${
              activeTab === "settings"
                ? "bg-bg-elevated text-text-main border-accent"
                : "bg-transparent text-text-muted border-transparent hover:bg-bg-surface hover:text-text-main"
            }`}
          >
            <SettingsIcon className={`h-4.5 w-4.5 shrink-0 ${activeTab === "settings" ? "text-accent" : "text-text-muted"}`} />
            Settings
          </button>
        </div>
      </div>

      {/* User profile footer info */}
      {user && (
        <div className="p-3.5 border-t border-border-main bg-bg-secondary shrink-0">
          <div className="flex items-center justify-between gap-2 overflow-hidden bg-bg-surface border border-border-main rounded-lg p-3">
            <div className="flex items-center gap-2 overflow-hidden">
              {user.avatar && !imgFailed ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  onError={() => setImgFailed(true)}
                  className="h-8 w-8 rounded object-cover border border-border-main"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-bg-elevated text-xs font-black text-accent border border-border-main">
                  {initials}
                </div>
              )}
              <div className="flex flex-col text-left overflow-hidden select-none">
                <span className="text-xs font-extrabold text-text-main truncate leading-tight">
                  {user.name}
                </span>
                <span className="text-[9px] text-text-muted truncate mt-0.5 font-semibold">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded p-1.5 text-text-muted hover:bg-err/10 hover:text-err border border-transparent transition-all shrink-0 cursor-pointer"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
