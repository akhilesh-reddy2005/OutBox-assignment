import { useEffect, useRef } from "react";
import { X, Calendar, User, Mail, AlertTriangle, Send, Clock, Timer, Zap } from "lucide-react";
import type { EmailJob } from "../../types/email";
import { Badge } from "../ui/Badge";
import { formatDateParts } from "../../utils/formatDate";

interface EmailDetailDrawerProps {
  email: EmailJob;
  onClose: () => void;
}

function MetaRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-black text-text-muted/50 uppercase tracking-wider block">
        {label}
      </span>
      <div className="flex items-center gap-2.5 text-text-main">
        <span className="text-text-muted/60 shrink-0">{icon}</span>
        <span className={`font-extrabold break-all text-sm ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function formatTs(iso: string | null): string {
  if (!iso) return "—";
  const { date, time } = formatDateParts(iso);
  return time ? `${date} · ${time}` : date;
}

function formatDelayMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${ms / 1000} second${ms / 1000 !== 1 ? "s" : ""}`;
}

export function EmailDetailDrawer({ email, onClose }: EmailDetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const isFailed = email.status === "FAILED";
  const isSent   = email.status === "SENT";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[1px] transition-opacity"
      onClick={handleBackdropClick}
    >
      <div
        ref={drawerRef}
        className="w-full sm:w-[480px] md:w-[520px] bg-bg-surface h-full border-l border-border-main flex flex-col justify-between animate-slide-left z-10 font-sans text-text-main"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-main px-7 py-5 bg-bg-secondary shrink-0">
          <div className="space-y-0.5 select-none">
            <h2 className="text-xs font-black uppercase tracking-widest text-text-muted">Email Details</h2>
            <div className="flex items-center gap-2 pt-0.5">
              <Badge status={email.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:bg-bg-elevated hover:text-text-main p-2 rounded border border-border-main transition-colors shrink-0 cursor-pointer"
            aria-label="Close details"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-7 space-y-7 text-sm">
          <div className="space-y-5">

            {/* Recipient */}
            <MetaRow
              icon={<User className="h-4.5 w-4.5" />}
              label="Recipient"
              value={email.recipient}
            />

            {/* Subject */}
            <MetaRow
              icon={<Mail className="h-4.5 w-4.5" />}
              label="Subject"
              value={email.subject}
            />

            <div className="border-t border-border-main/50" />

            {/* Scheduled At */}
            <MetaRow
              icon={<Calendar className="h-4.5 w-4.5" />}
              label="Scheduled For"
              value={formatTs(email.scheduledAt)}
            />

            {/* Send Started At */}
            {(isSent || isFailed || email.sendStartedAt) && (
              <MetaRow
                icon={<Zap className="h-4.5 w-4.5" />}
                label="Send Started"
                value={formatTs(email.sendStartedAt)}
              />
            )}

            {/* Sent At */}
            {isSent && (
              <MetaRow
                icon={<Send className="h-4.5 w-4.5" />}
                label="SMTP Completed"
                value={formatTs(email.sentAt)}
              />
            )}

            <div className="border-t border-border-main/50" />

            {/* Delay / Attempts */}
            <div className="grid grid-cols-2 gap-4">
              <MetaRow
                icon={<Timer className="h-4.5 w-4.5" />}
                label="Send Delay"
                value={formatDelayMs(email.delayMs)}
              />
              <MetaRow
                icon={<Clock className="h-4.5 w-4.5" />}
                label="Attempts"
                value={String(email.attempts)}
              />
            </div>

            {/* Error */}
            {isFailed && email.error && (
              <div className="space-y-1.5 bg-err/5 border border-err/30 rounded-lg p-4">
                <span className="text-[10px] font-black text-err uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-err" />
                  SMTP Error
                </span>
                <p className="text-xs text-text-main break-words leading-relaxed font-semibold">
                  {email.error}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border-main my-6" />

          {/* Email Body */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-text-muted/50 uppercase tracking-wider">
              Message Body
            </h3>
            <div className="rounded-lg border border-border-main bg-bg-primary p-5 min-h-[250px] max-h-[460px] overflow-y-auto">
              <p className="text-text-main leading-relaxed text-sm break-words whitespace-pre-wrap font-medium font-sans">
                {email.body}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-main px-7 py-4.5 bg-bg-secondary shrink-0 flex justify-end select-none">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 border border-border-main text-text-muted hover:bg-bg-elevated hover:text-text-main rounded-md text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
