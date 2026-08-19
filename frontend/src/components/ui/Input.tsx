import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, labelClassName = "", id, className = "", ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full font-sans text-left">
        {label && (
          <label
            htmlFor={inputId}
            className={`text-xs font-bold text-text-muted uppercase tracking-wider select-none ${labelClassName}`}
          >
            {label}
            {props.required && <span className="text-err ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border border-border-main bg-bg-surface px-4 py-2.5 text-sm text-text-main font-semibold placeholder-text-muted/40 transition-all focus:bg-bg-elevated focus:border-accent focus:outline-none disabled:bg-bg-primary disabled:text-text-muted/30 ${
            error ? "border-err focus:border-err bg-err/5" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] font-bold text-err mt-0.5">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
