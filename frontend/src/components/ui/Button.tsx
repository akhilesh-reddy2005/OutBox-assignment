import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const variants = {
  primary:
    "bg-accent text-white dark:text-[#0B0F14] hover:opacity-95 transition-opacity focus-visible:ring-2 focus-visible:ring-accent/40",
  secondary:
    "bg-bg-surface border border-border-main text-text-main hover:bg-bg-elevated hover:border-text-muted/30 transition-all focus-visible:ring-2 focus-visible:ring-text-muted/20",
  ghost:
    "bg-transparent text-text-muted hover:bg-bg-surface hover:text-text-main transition-colors focus-visible:ring-2 focus-visible:ring-offset-1",
  danger:
    "bg-err text-white dark:text-[#0B0F14] hover:opacity-95 transition-opacity focus-visible:ring-2 focus-visible:ring-err/40",
};

const sizes = {
  sm: "px-3.5 py-2 text-xs font-bold rounded-md",
  md: "px-4.5 py-2.5 text-sm font-extrabold rounded-lg",
  lg: "px-5.5 py-3 text-base font-extrabold rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 font-bold tracking-tight focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 select-none cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="h-4.5 w-4.5 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
