import { useState, type ReactNode } from "react";
import { Search, LogOut } from "lucide-react";
import { Sidebar } from "../navigation/Sidebar";
import { useAuth } from "../../hooks/useAuth";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: "overview" | "emails" | "settings";
  setActiveTab: (tab: "overview" | "emails" | "settings") => void;
  activeSubTab?: "all" | "scheduled" | "sent" | "failed";
  setActiveSubTab?: (tab: "all" | "scheduled" | "sent" | "failed") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function DashboardLayout({
  children,
  activeTab,
  setActiveTab,
  activeSubTab = "all",
  setActiveSubTab,
  searchQuery,
  setSearchQuery,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [imgFailed, setImgFailed] = useState(false);

  const titleMap = {
    overview: "Operations Command Center",
    emails: "Email Management",
    settings: "Settings Preferences",
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col md:flex-row text-text-main font-sans antialiased">
      {/* Sidebar for Desktop */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
          user={user}
          onLogout={logout}
        />
      </div>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-bg-secondary border-b border-border-main px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 select-none">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-bg-surface border border-border-main">
            <span className="text-[11px] font-black text-accent tracking-tighter">R</span>
          </div>
          <span className="text-sm font-black text-text-main tracking-tight">
            ReachInbox
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile search bar trigger input */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted/55">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-28 h-8.5 pl-8 pr-2.5 rounded-lg border border-border-main bg-bg-surface text-[11px] font-bold text-text-main placeholder-text-muted/30 focus:outline-none focus:border-accent"
            />
          </div>
          
          <button
            type="button"
            onClick={logout}
            className="text-text-muted p-2 rounded border border-border-main bg-bg-surface hover:bg-err/10 hover:text-err cursor-pointer shrink-0"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <nav className="md:hidden flex border-b border-border-main bg-bg-secondary sticky top-[52px] z-30 select-none">
        {(["overview", "emails", "settings"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-wider transition-all border-r border-border-main last:border-r-0 ${
              activeTab === tab
                ? "bg-bg-elevated text-accent"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-16 border-b border-border-main bg-bg-secondary px-8 items-center justify-between shrink-0 sticky top-0 z-40">
          <div>
            <h2 className="text-xs font-black text-text-muted uppercase tracking-widest">
              {titleMap[activeTab]}
            </h2>
          </div>
          
          <div className="flex items-center gap-4.5">
            {/* Outlined Search Option */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/55">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails..."
                className="w-56 h-9 pl-9 pr-3 rounded-lg border border-border-main bg-bg-surface text-xs font-bold text-text-main placeholder-text-muted/30 focus:outline-none focus:border-accent"
              />
            </div>
            
            <div className="h-6 w-px bg-border-main" />

            <div className="flex items-center gap-2.5">
              {user?.avatar && !imgFailed ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  onError={() => setImgFailed(true)}
                  className="h-8 w-8 rounded object-cover border border-border-main"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-bg-elevated text-xs font-black text-accent border border-border-main select-none">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content body wrapper */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 bg-bg-primary">
          {children}
        </main>
      </div>
    </div>
  );
}
