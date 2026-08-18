import { useCallback, useRef, useState, type FormEvent } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import { parseEmailFile } from "../../utils/csvParser";
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
  date.setMinutes(date.getMinutes() + 5);
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
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [delayMs, setDelayMs] = useState("2000");
  const [hourlyLimit, setHourlyLimit] = useState("50");
  const [emails, setEmails] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = useCallback(() => {
    setSubject("");
    setBody("");
    setStartTime(defaultStartTime());
    setDelayMs("2000");
    setHourlyLimit("50");
    setEmails([]);
    setFileName(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [".csv", ".txt"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!validTypes.includes(ext)) {
      setErrors((prev) => ({
        ...prev,
        file: "Please upload a .csv or .txt file.",
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
          file: "No valid email addresses found in the file.",
        }));
        return;
      }

      setEmails(parsed);
      setFileName(file.name);
    } catch {
      setErrors((prev) => ({
        ...prev,
        file: "Failed to read the file. Please try again.",
      }));
    } finally {
      setIsParsing(false);
    }
  };

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!subject.trim()) newErrors.subject = "Subject is required.";
    if (!body.trim()) newErrors.body = "Body is required.";
    if (emails.length === 0)
      newErrors.file = "Please upload a file with valid email addresses.";
    if (!startTime) newErrors.startTime = "Start time is required.";
    else if (new Date(startTime).getTime() <= Date.now()) {
      newErrors.startTime = "Start time must be in the future.";
    }

    const delay = Number(delayMs);
    if (Number.isNaN(delay) || delay < 0) {
      newErrors.delayMs = "Delay must be a valid number.";
    }

    const limit = Number(hourlyLimit);
    if (Number.isNaN(limit) || limit <= 0) {
      newErrors.hourlyLimit = "Hourly limit must be greater than 0.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
      resetForm();
    } catch {
      // Error handled by parent via toast
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Compose New Email" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Welcome Email"
          required
          error={errors.subject}
        />

        <Textarea
          label="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your email content here..."
          required
          error={errors.body}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Recipient List
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div
            className={`relative rounded-lg border-2 border-dashed transition-colors ${
              errors.file
                ? "border-red-300 bg-red-50/50"
                : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload CSV or text file"
            />
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center pointer-events-none">
              {isParsing ? (
                <p className="text-sm text-gray-500">Parsing file...</p>
              ) : fileName ? (
                <>
                  <FileText className="h-8 w-8 text-indigo-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">{fileName}</p>
                  <p className="text-sm text-indigo-600 mt-1">
                    {emails.length} email address{emails.length !== 1 ? "es" : ""}{" "}
                    detected
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    Upload CSV or TXT file
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    One email address per line or comma-separated
                  </p>
                </>
              )}
            </div>
          </div>
          {errors.file && (
            <p className="text-xs text-red-600">{errors.file}</p>
          )}
        </div>

        {emails.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Detected addresses
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {emails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-700"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={`Remove ${email}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Start Time"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            error={errors.startTime}
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="delay-ms"
              className="text-sm font-medium text-gray-700"
            >
              Delay between emails
            </label>
            <select
              id="delay-ms"
              value={delayMs}
              onChange={(e) => setDelayMs(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="1000">1000 ms</option>
              <option value="2000">2000 ms</option>
              <option value="5000">5000 ms</option>
            </select>
            {errors.delayMs && (
              <p className="text-xs text-red-600">{errors.delayMs}</p>
            )}
          </div>

          <Input
            label="Emails per hour"
            type="number"
            min={1}
            value={hourlyLimit}
            onChange={(e) => setHourlyLimit(e.target.value)}
            error={errors.hourlyLimit}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
