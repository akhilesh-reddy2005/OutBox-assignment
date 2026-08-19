import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { GoogleLoginButton } from "../components/auth/GoogleLoginButton";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../services/api";

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) {
      nextErrors.name = "Full Name is required";
    }
    if (!email) {
      nextErrors.email = "Email ID is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // Trim name and lowercase email before sending, matching backend validation
      await register(name.trim(), email.trim().toLowerCase(), password);
      showToast("Account created successfully", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
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
          <h2 className="text-lg font-black tracking-tight text-text-main">Create your account</h2>
          <p className="text-xs text-text-muted font-bold">
            Register a new command center workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name input */}
          <Input
            id="register-name"
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="e.g. pilot officer"
            error={errors.name}
            required
          />

          {/* Email input */}
          <Input
            id="register-email"
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
              id="register-password"
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

          {/* Confirm Password input */}
          <div className="relative">
            <Input
              id="register-confirm-password"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword)
                  setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              placeholder="••••••••"
              error={errors.confirmPassword}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-[32px] text-text-muted/65 hover:text-text-main cursor-pointer"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full h-11 text-xs rounded-lg mt-2 font-black"
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
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
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-accent hover:opacity-85 font-black underline ml-0.5"
            >
              Sign in
            </Link>
          </span>
        </div>

      </div>
    </div>
  );
}
