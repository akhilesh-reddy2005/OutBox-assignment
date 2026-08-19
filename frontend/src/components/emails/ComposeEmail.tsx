import { useRef, useState, useEffect, type FormEvent } from "react";
import { 
  X, 
  FileText,
  Undo, 
  Redo, 
  Type, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  ListOrdered, 
  Upload,
  ArrowLeft,
  Edit3
} from "lucide-react";
import { Button } from "../ui/Button";
import { DateTimePicker } from "../ui/DateTimePicker";
import { parseEmailFile, extractEmailsFromText } from "../../utils/csvParser";
import {
  datetimeLocalToISO,
  toDatetimeLocalValue,
} from "../../utils/formatDate";
import type { ScheduleEmailPayload } from "../../types/email";

interface ComposeEmailProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ScheduleEmailPayload) => Promise<void>;
  isSubmitting: boolean;
}

const defaultStartTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 10);
  date.setSeconds(0, 0);
  return toDatetimeLocalValue(date);
};

export function ComposeEmail({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ComposeEmailProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [delayMs, setDelayMs] = useState("2000");
  const [hourlyLimit, setHourlyLimit] = useState("50");
  const [emails, setEmails] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [recipientMode, setRecipientMode] = useState<"upload" | "manual">("upload");
  const [manualEmails, setManualEmails] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };

  const resetForm = () => {
    setSubject("");
    setBody("");
    setStartTime(defaultStartTime());
    setDelayMs("2000");
    setHourlyLimit("50");
    setEmails([]);
    setFileName(null);
    setManualEmails("");
    setRecipientMode("upload");
    setErrors({});
    setApiError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleManualEmailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setManualEmails(val);
    const parsed = extractEmailsFromText(val);
    setEmails(parsed);
    if (errors.file && parsed.length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.file;
        return next;
      });
    }
  };

  const handleModeSwitch = (mode: "upload" | "manual") => {
    setRecipientMode(mode);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });
    if (mode === "manual") {
      if (emails.length > 0 && !manualEmails.trim()) {
        setManualEmails(emails.join(", "));
      }
    } else {
      if (!fileName && !manualEmails.trim()) {
        setEmails([]);
      }
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [".csv", ".txt"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!validTypes.includes(ext)) {
      setErrors((prev) => ({
        ...prev,
        file: "Upload a valid CSV or TXT file",
      }));
      return;
    }

    setIsParsing(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });

    try {
      const parsed = await parseEmailFile(file);

      if (parsed.length === 0) {
        setEmails([]);
        setFileName(null);
        setErrors((prev) => ({
          ...prev,
          file: "No valid email addresses found",
        }));
        return;
      }

      setEmails(parsed);
      setFileName(file.name);
    } catch {
      setErrors((prev) => ({
        ...prev,
        file: "Parse error",
      }));
    } finally {
      setIsParsing(false);
    }
  };

  const handleRemoveFile = () => {
    setEmails([]);
    setFileName(null);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setStartTime(toDatetimeLocalValue(d));
  };

  const handle10AM = () => {
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    if (d.getTime() <= Date.now()) {
      d.setDate(d.getDate() + 1);
    }
    setStartTime(toDatetimeLocalValue(d));
  };

  const handle11AM = () => {
    const d = new Date();
    d.setHours(11, 0, 0, 0);
    if (d.getTime() <= Date.now()) {
      d.setDate(d.getDate() + 1);
    }
    setStartTime(toDatetimeLocalValue(d));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!subject.trim()) newErrors.subject = "Subject is required";
    if (!body.trim()) newErrors.body = "Email body is required";
    if (emails.length === 0) {
      newErrors.file = recipientMode === "upload"
        ? "CSV or TXT recipient file is required"
        : "Enter at least one valid recipient email address";
    }
    if (!startTime) {
      newErrors.startTime = "Please select a future time";
    } else if (new Date(startTime).getTime() <= Date.now()) {
      newErrors.startTime = "Please select a future time";
    }

    const delay = Number(delayMs);
    if (Number.isNaN(delay) || delay < 1000) {
      newErrors.delayMs = "Delay must be at least 1 second (1000 ms)";
    }

    const limit = Number(hourlyLimit);
    if (Number.isNaN(limit) || limit <= 0) {
      newErrors.hourlyLimit = "Enter a valid positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (isSubmitting) return;
    if (!validate()) return;

    const payload: ScheduleEmailPayload = {
      subject: subject.trim(),
      body: body.trim(),
      emails,
      startTime: datetimeLocalToISO(startTime),
      delayMs: Number(delayMs),
      hourlyLimit: Number(hourlyLimit),
    };

    try {
      await onSubmit(payload);
    } catch {
      setApiError("Unable to schedule campaign");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[1px]"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[920px] max-h-[95vh] sm:max-h-[90vh] bg-bg-surface rounded-2xl border border-border-main shadow-2xl flex flex-col overflow-hidden animate-slide-in font-sans text-text-main"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        {/* Header workspace title bar */}
        <div className="flex items-center justify-between border-b border-border-main px-6 py-5 bg-bg-secondary shrink-0">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={handleClose}
              className="text-text-muted hover:text-text-main p-2 rounded hover:bg-bg-elevated transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-black uppercase tracking-wider">Compose Email</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted bg-bg-elevated border border-border-main px-2 py-0.5 rounded">
                  Draft
                </span>
              </div>
              <p className="text-[10px] text-text-muted/70 font-semibold mt-0.5">
                Draft, schedule and dispatch outreach
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-text-muted hover:text-text-main p-2.5 rounded hover:bg-bg-elevated transition-colors shrink-0 cursor-pointer"
            aria-label="Close workspace"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-bg-primary">
          {/* Main 2-Pane Split Workspace */}
          <div className="flex-1 overflow-y-auto p-6.5 grid grid-cols-1 md:grid-cols-2 gap-6.5 min-h-0 text-sm font-semibold text-text-muted">
            
            {/* Left Column: Email Workspace */}
            <div className="space-y-5 flex flex-col justify-between">
              {apiError && (
                <div className="rounded-lg border border-err/25 bg-err/5 px-3.5 py-2.5 text-xs text-err text-center font-bold">
                  {apiError}
                </div>
              )}

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="subject-input" className="text-xs font-black uppercase tracking-wider text-text-muted/60">
                  Subject
                </label>
                <input
                  id="subject-input"
                  type="text"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (errors.subject) setErrors((prev) => ({ ...prev, subject: "" }));
                  }}
                  placeholder="Campaign subject line..."
                  required
                  className={`w-full h-10 px-3.5 rounded-lg border border-border-main bg-bg-surface text-sm text-text-main font-bold focus:outline-none focus:border-accent ${
                    errors.subject ? "border-err" : ""
                  }`}
                />
                {errors.subject && <p className="text-xs text-err mt-0.5">{errors.subject}</p>}
              </div>

              {/* Text Message box */}
              <div className="flex-1 flex flex-col gap-1.5 min-h-[180px]">
                <label htmlFor="message-box" className="text-xs font-black uppercase tracking-wider text-text-muted/60">
                  Message
                </label>
                <div className="flex-1 border border-border-main rounded-lg bg-bg-surface overflow-hidden flex flex-col">
                  {/* Clean Mock Visual Editor */}
                  <div className="border-b border-border-main bg-bg-secondary px-2.5 py-1.5 flex items-center gap-1 select-none shrink-0">
                    <button type="button" className="p-0.5 rounded text-text-muted hover:text-text-main" title="Undo"><Undo className="h-3.5 w-3.5" /></button>
                    <button type="button" className="p-0.5 rounded text-text-muted hover:text-text-main" title="Redo"><Redo className="h-3.5 w-3.5" /></button>
                    <div className="w-px h-4 bg-border-main mx-1" />
                    <button type="button" className="p-0.5 rounded text-text-muted hover:text-text-main" title="Text"><Type className="h-3.5 w-3.5" /></button>
                    <button type="button" className="p-0.5 rounded text-text-muted hover:text-text-main" title="Bold"><Bold className="h-3.5 w-3.5" /></button>
                    <button type="button" className="p-0.5 rounded text-text-muted hover:text-text-main" title="Italic"><Italic className="h-3.5 w-3.5" /></button>
                    <button type="button" className="p-0.5 rounded text-text-muted hover:text-text-main" title="Underline"><Underline className="h-3.5 w-3.5" /></button>
                    <div className="w-px h-4 bg-border-main mx-1" />
                    <button type="button" className="p-0.5 rounded text-text-muted hover:text-text-main" title="Align"><AlignLeft className="h-3.5 w-3.5" /></button>
                    <button type="button" className="p-0.5 rounded text-text-muted hover:text-text-main" title="List"><ListOrdered className="h-3.5 w-3.5" /></button>
                  </div>
                  <textarea
                    id="message-box"
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      if (errors.body) setErrors((prev) => ({ ...prev, body: "" }));
                    }}
                    placeholder="Write your message..."
                    required
                    className="flex-1 w-full p-4 text-sm text-text-main font-medium bg-transparent placeholder-text-muted/30 focus:outline-none resize-none min-h-0"
                  />
                </div>
                {errors.body && <p className="text-xs text-err">{errors.body}</p>}
              </div>
            </div>

            {/* Right Column: Recipients & Delivery Settings */}
            <div className="space-y-5 flex flex-col justify-between">
              
              {/* Recipient Input Area: Toggle between File Upload and Manual Typing */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-text-muted/60">
                    Recipients
                  </label>
                  {/* Mode switch */}
                  <div className="flex items-center bg-bg-secondary p-0.5 rounded-lg border border-border-main text-[10px] font-extrabold select-none">
                    <button
                      type="button"
                      onClick={() => handleModeSwitch("upload")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        recipientMode === "upload"
                          ? "bg-bg-surface text-accent shadow-sm"
                          : "text-text-muted hover:text-text-main"
                      }`}
                    >
                      <Upload className="h-3 w-3" />
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeSwitch("manual")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        recipientMode === "manual"
                          ? "bg-bg-surface text-accent shadow-sm"
                          : "text-text-muted hover:text-text-main"
                      }`}
                    >
                      <Edit3 className="h-3 w-3" />
                      Type Emails
                    </button>
                  </div>
                </div>

                {recipientMode === "upload" ? (
                  !fileName ? (
                    <div
                      onClick={triggerUpload}
                      className={`border border-dashed border-border-main rounded-xl py-6 px-4 text-center cursor-pointer transition-colors bg-bg-surface flex flex-col items-center justify-center ${
                        errors.file ? "border-err bg-err/5" : "hover:border-text-muted/35 hover:bg-bg-elevated/30"
                      }`}
                    >
                      <Upload className="h-5.5 w-5.5 text-text-muted/60 mb-2 pointer-events-none stroke-[2.5]" />
                      <span className="text-xs font-extrabold text-text-main pointer-events-none">Drop CSV or TXT</span>
                      <span className="text-[10px] text-text-muted/45 mt-0.5 pointer-events-none">or Browse files</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="rounded-xl border border-border-main bg-bg-surface p-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="h-5 w-5 text-accent shrink-0 stroke-[2.5]" />
                          <div className="min-w-0">
                            <span className="text-sm font-black text-text-main block truncate max-w-[200px]">
                              {fileName}
                            </span>
                            <span className="text-[10px] text-accent font-extrabold block mt-0.5">
                              {isParsing ? "Parsing..." : `✓ ${emails.length} recipients detected`}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-xs font-black text-err hover:text-err/80 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>

                      {emails.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-bg-surface border border-border-main rounded-xl max-h-16 overflow-y-auto">
                          {emails.slice(0, 2).map((email) => (
                            <span
                              key={email}
                              className="inline-flex items-center bg-accent/10 border border-accent/25 px-2.5 py-0.5 rounded text-[10px] font-bold text-accent"
                            >
                              {email}
                            </span>
                          ))}
                          {emails.length > 2 && (
                            <span className="inline-flex items-center bg-accent/10 border border-accent/25 px-2.5 py-0.5 rounded text-[10px] font-black text-accent">
                              +{emails.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={manualEmails}
                      onChange={handleManualEmailsChange}
                      placeholder="Type or paste email addresses (separated by commas, spaces, or newlines)&#10;e.g. alex@reachinbox.com, user@example.com"
                      rows={3}
                      className={`w-full p-3 text-xs text-text-main font-medium bg-bg-surface border rounded-xl placeholder-text-muted/40 focus:outline-none focus:border-accent resize-none ${
                        errors.file ? "border-err" : "border-border-main"
                      }`}
                    />
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-text-muted/70 font-bold">
                        {emails.length > 0 ? (
                          <span className="text-accent font-black">✓ {emails.length} valid recipient{emails.length > 1 ? "s" : ""} detected</span>
                        ) : (
                          "Separate multiple recipients with commas or newlines"
                        )}
                      </span>
                      {manualEmails && (
                        <button
                          type="button"
                          onClick={() => {
                            setManualEmails("");
                            setEmails([]);
                          }}
                          className="text-[10px] font-black text-err hover:text-err/80 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {emails.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-bg-surface border border-border-main rounded-xl max-h-16 overflow-y-auto">
                        {emails.slice(0, 2).map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center bg-accent/10 border border-accent/25 px-2.5 py-0.5 rounded text-[10px] font-bold text-accent"
                          >
                            {email}
                          </span>
                        ))}
                        {emails.length > 2 && (
                          <span className="inline-flex items-center bg-accent/10 border border-accent/25 px-2.5 py-0.5 rounded text-[10px] font-black text-accent">
                            +{emails.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {errors.file && <p className="text-xs text-err">{errors.file}</p>}
              </div>

              {/* Delivery Settings */}
              <div className="border-t border-border-main pt-5 space-y-5">
                <span className="text-xs font-black uppercase tracking-wider text-text-muted/60 block">Delivery Parameters</span>
                
                {/* Start Time with Presets */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center gap-2">
                    <label htmlFor="time-picker" className="text-xs font-bold text-text-muted/70">
                      Start Time
                    </label>
                    <div className="flex gap-2 select-none">
                      <button
                        type="button"
                        onClick={handleTomorrow}
                        className="px-2.5 py-1 rounded border border-border-main bg-bg-surface text-[9px] font-black text-text-muted hover:text-text-main hover:border-text-muted/30 transition-colors cursor-pointer"
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={handle10AM}
                        className="px-2.5 py-1 rounded border border-border-main bg-bg-surface text-[9px] font-black text-text-muted hover:text-text-main hover:border-text-muted/30 transition-colors cursor-pointer"
                      >
                        10 AM
                      </button>
                      <button
                        type="button"
                        onClick={handle11AM}
                        className="px-2.5 py-1 rounded border border-border-main bg-bg-surface text-[9px] font-black text-text-muted hover:text-text-main hover:border-text-muted/30 transition-colors cursor-pointer"
                      >
                        11 AM
                      </button>
                    </div>
                  </div>
                  <DateTimePicker
                    value={startTime}
                    onChange={(val) => {
                      setStartTime(val);
                      if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: "" }));
                    }}
                    error={errors.startTime}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Delay select */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="delay-picker" className="text-xs font-bold text-text-muted/70">
                      Delay
                    </label>
                    <select
                      id="delay-picker"
                      value={delayMs}
                      onChange={(e) => setDelayMs(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border-main bg-bg-surface text-sm text-text-main font-bold focus:outline-none focus:border-accent cursor-pointer"
                    >
                      <option value="1000">1 sec</option>
                      <option value="2000">2 sec</option>
                      <option value="5000">5 sec</option>
                      <option value="10000">10 sec</option>
                    </select>
                  </div>

                  {/* Hourly Sending limits */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="limit-picker" className="text-xs font-bold text-text-muted/70">
                      Emails / Hour
                    </label>
                    <input
                      id="limit-picker"
                      type="number"
                      min={1}
                      value={hourlyLimit}
                      onChange={(e) => {
                        setHourlyLimit(e.target.value);
                        if (errors.hourlyLimit) setErrors((prev) => ({ ...prev, hourlyLimit: "" }));
                      }}
                      className={`w-full h-10 px-3.5 rounded-lg border border-border-main bg-bg-surface text-sm text-text-main font-bold focus:outline-none focus:border-accent ${
                        errors.hourlyLimit ? "border-err" : ""
                      }`}
                    />
                    {errors.hourlyLimit && <p className="text-xs text-err mt-0.5">{errors.hourlyLimit}</p>}
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Footer Actions */}
          <div className="border-t border-border-main px-6.5 py-4.5 bg-bg-secondary shrink-0 flex items-center justify-end gap-3 select-none">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-10 px-4.5 border border-border-main text-text-muted hover:bg-bg-elevated hover:text-text-main rounded-md text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="h-10 px-5.5 rounded-md text-xs"
            >
              {isSubmitting ? "Sending..." : "Schedule Email"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
