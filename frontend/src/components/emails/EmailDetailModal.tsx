import { useEffect, useRef } from "react";
import { X, Calendar, User, Mail, AlertTriangle, Send, Clock, Timer, Zap } from "lucide-react";
import type { EmailJob } from "../../types/email";
import { Badge } from "../ui/Badge";
import { formatDateParts } from "../../utils/formatDate";

interface EmailDetailModalProps {
  email: EmailJob;
  onClose: () => void;
}

function MetaCell({
  label,
  icon,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
        {label}
      </span>
      <div className="flex items-center gap-2 text-slate-700">
        <span className="text-slate-400 shrink-0">{icon}</span>
        <span className="font-semibold break-all text-sm">{value}</span>
      </div>
    </div>
  );
}

function formatTs(iso: string | null): string {
  if (!iso) return "—";
  const { date, time } = formatDateParts(iso);
  return time ? `${date}, ${time}` : date;
}

function formatDelayMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${ms / 1000} second${ms / 1000 !== 1 ? "s" : ""}`;
}

export function EmailDetailModal({ email, onClose }: EmailDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const isFailed = email.status === "FAILED";
  const isSent   = email.status === "SENT";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[680px] max-h-[85vh] bg-white rounded-2xl border border-slate-100 shadow-xl flex flex-col overflow-hidden animate-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-white shrink-0">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">Email Details</h2>
            <div className="flex items-center gap-2 pt-0.5">
              <Badge status={email.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm">

          {/* Recipient + Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetaCell
              label="To"
              icon={<User className="h-4 w-4" />}
              value={email.recipient}
            />
            <MetaCell
              label="Subject"
              icon={<Mail className="h-4 w-4" />}
              value={email.subject}
            />
          </div>

          <div className="border-t border-slate-100" />

          {/* Timing section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetaCell
              label="Scheduled For"
              icon={<Calendar className="h-4 w-4" />}
              value={formatTs(email.scheduledAt)}
            />

            {(isSent || isFailed || email.sendStartedAt) && (
              <MetaCell
                label="Send Started"
                icon={<Zap className="h-4 w-4" />}
                value={formatTs(email.sendStartedAt)}
              />
            )}

            {isSent && (
              <MetaCell
                label="SMTP Completed"
                icon={<Send className="h-4 w-4" />}
                value={formatTs(email.sentAt)}
              />
            )}
          </div>

          <div className="border-t border-slate-100" />

          {/* Config metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MetaCell
              label="Send Delay"
              icon={<Timer className="h-4 w-4" />}
              value={formatDelayMs(email.delayMs)}
            />
            <MetaCell
              label="Hourly Limit"
              icon={<Zap className="h-4 w-4" />}
              value={`${email.hourlyLimit}/hr`}
            />
            <MetaCell
              label="Attempts"
              icon={<Clock className="h-4 w-4" />}
              value={String(email.attempts)}
            />
          </div>

          {/* Error */}
          {isFailed && email.error && (
            <div className="space-y-1 bg-red-50 border border-red-100 rounded-lg p-3">
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                SMTP Error
              </span>
              <p className="text-xs text-red-700 break-words leading-relaxed font-medium">
                {email.error}
              </p>
            </div>
          )}

          <div className="border-t border-slate-100" />

          {/* Message body */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Message
            </h3>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 min-h-[120px] max-h-[300px] overflow-y-auto">
              <p className="text-slate-700 leading-relaxed text-sm break-words whitespace-pre-wrap font-sans">
                {email.body}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
