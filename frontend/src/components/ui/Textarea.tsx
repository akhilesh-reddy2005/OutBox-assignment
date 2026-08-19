import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full font-sans text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-bold text-text-muted uppercase tracking-wider select-none"
          >
            {label}
            {props.required && <span className="text-err ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-lg border border-border-main bg-bg-surface px-4 py-2.5 text-sm text-text-main font-semibold placeholder-text-muted/40 transition-all focus:bg-bg-elevated focus:border-accent focus:outline-none disabled:bg-bg-primary resize-y min-h-[140px] ${
            error ? "border-err focus:border-err bg-err/5" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] font-bold text-err mt-0.5">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
