import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 max-w-sm select-none font-sans">
        {toasts.map((toast) => {
          let prefix = "●";
          let dotColor = "text-accent-sub";
          if (toast.type === "success") {
            prefix = "✓";
            dotColor = "text-accent";
          } else if (toast.type === "error") {
            prefix = "!";
            dotColor = "text-err";
          }

          return (
            <div
              key={toast.id}
              role="status"
              className="animate-slide-in rounded-lg px-4 py-3 text-[11px] font-black border border-border-main bg-bg-elevated text-text-main shadow-lg"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black ${dotColor}`}>{prefix}</span>
                  <span>{toast.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="text-text-muted hover:text-text-main shrink-0 font-extrabold text-sm border-0 bg-transparent cursor-pointer"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
