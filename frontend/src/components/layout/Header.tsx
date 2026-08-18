import { LogOut, Mail } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900 leading-tight">
              ReachInbox
            </p>
            <p className="text-xs text-gray-500 hidden sm:block">
              Email Scheduler
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">
                {user.name}
              </span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>

            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="hidden sm:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="sm:hidden p-2"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
