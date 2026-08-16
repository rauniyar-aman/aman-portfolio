"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";

const RESEND_COOLDOWN_SECONDS = 60;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/password-reset/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail ?? firstFieldError(data) ?? "Could not reset password.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    setResendMessage(null);
    setIsResending(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/signup/resend-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "password_reset" }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail ?? "Could not resend code.");
      }

      setResendMessage("A new code has been sent.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsResending(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-foreground">Password reset</h1>
          <p className="mb-6 text-sm text-foreground/70">
            Your password has been reset. You can now log in with your new password.
          </p>
          <Link
            href="/cv-maker/login"
            className="inline-block w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent/90"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-foreground">Reset password</h1>
        <p className="mb-6 text-sm text-foreground/70">
          Enter the code sent to <span className="font-medium">{email || "your email"}</span> and choose a new
          password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-medium text-foreground/80">
              Verification code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-center text-lg tracking-[0.5em] text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-foreground/80">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {resendMessage && <p className="text-sm text-foreground/70">{resendMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent/90 disabled:opacity-50"
          >
            {isSubmitting ? "Resetting…" : "Reset password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/70">
          Didn&apos;t get a code?{" "}
          {cooldown > 0 ? (
            <span>Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-medium text-accent hover:underline disabled:opacity-50"
            >
              {isResending ? "Sending…" : "Resend code"}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

function firstFieldError(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  for (const value of Object.values(data as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return null;
}
