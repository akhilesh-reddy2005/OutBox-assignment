import { Mail } from "lucide-react";
import { GoogleLoginButton } from "../components/auth/GoogleLoginButton";
import { useSearchParams } from "react-router-dom";

export function Login() {
  const [searchParams] = useSearchParams();
  const authError = searchParams.get("error");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-200">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ReachInbox</h1>
          <p className="mt-2 text-sm text-gray-500">
            Schedule and manage your email campaigns
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to access your email dashboard
          </p>

          {authError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Google authentication failed. Please try again.
            </div>
          )}

          <GoogleLoginButton />

          <p className="mt-6 text-center text-xs text-gray-400">
            By continuing, you agree to our terms of service
          </p>
        </div>
      </div>
    </div>
  );
}
