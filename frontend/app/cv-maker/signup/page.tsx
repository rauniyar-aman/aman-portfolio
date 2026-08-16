"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          username,
          email,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail ?? firstFieldError(data) ?? "Could not create your account.");
      }

      router.push(`/cv-maker/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-foreground">Create an account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-foreground/80">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-foreground/80">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground/80">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-foreground/80">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs font-medium text-accent hover:underline"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground/80">
                Confirm password
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-xs font-medium text-accent hover:underline"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent/90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/70">
          Already have an account?{" "}
          <Link href="/cv-maker/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
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
