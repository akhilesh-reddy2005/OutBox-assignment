import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { GoogleLoginButton } from "../components/auth/GoogleLoginButton";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!email) {
      nextErrors.email = "Email ID is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!password) {
      nextErrors.password = "Password is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      await login(email, password);
      showToast("Signed in successfully", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Invalid email or password",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary font-sans antialiased text-text-main p-4">
      <div className="w-full max-w-[420px] bg-bg-surface border border-border-main p-9 rounded-2xl shadow-xl space-y-6">
        
        {/* Brand logo at the top */}
        <div className="flex flex-col items-center gap-2 select-none">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-bg-elevated border border-border-main">
            <span className="text-xs font-black text-accent tracking-tighter">R</span>
          </div>
          <span className="text-[11px] font-black tracking-wider text-text-muted uppercase">
            ReachInbox
          </span>
        </div>

        <div className="space-y-1.5 select-none text-center">
          <h2 className="text-lg font-black tracking-tight text-text-main">Welcome back</h2>
          <p className="text-xs text-text-muted font-bold">
            Sign in to your command center workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <Input
            id="login-email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            placeholder="e.g. pilot@domain.com"
            error={errors.email}
            required
          />

          {/* Password input */}
          <div className="relative">
            <Input
              id="login-password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="••••••••"
              error={errors.password}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[32px] text-text-muted/65 hover:text-text-main cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>

          {/* Forget link placeholder */}
          <div className="flex justify-end select-none">
            <button
              type="button"
              className="text-[10px] font-black text-accent hover:opacity-80 tracking-wider uppercase bg-transparent border-0 cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full h-11 text-xs rounded-lg mt-1 font-black"
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1.5 items-center select-none">
          <div className="flex-grow border-t border-border-main"></div>
          <span className="flex-shrink mx-4 text-[10px] font-black text-text-muted/40 uppercase tracking-widest">
            OR
          </span>
          <div className="flex-grow border-t border-border-main"></div>
        </div>

        {/* Google OAuth Login */}
        <div className="flex justify-center select-none">
          <GoogleLoginButton />
        </div>

        {/* Navigation link footer */}
        <div className="text-center select-none pt-1">
          <span className="text-xs text-text-muted font-bold">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-accent hover:opacity-85 font-black underline ml-0.5"
            >
              Create account
            </Link>
          </span>
        </div>

      </div>
    </div>
  );
}
