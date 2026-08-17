"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
    FB?: {
      init: (config: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: { accessToken: string };
          status?: string;
        }) => void,
        options?: { scope: string }
      ) => void;
    };
  }
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        fill="#1877F2"
      />
      <path
        d="M16.671 15.543l.532-3.47h-3.328v-2.25c0-.949.465-1.874 1.956-1.874h1.513V4.996s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.643H7.078v3.47h3.047v8.385a12.11 12.11 0 003.75 0v-8.385h2.796z"
        fill="#fff"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [isFacebookReady, setIsFacebookReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const next = searchParams.get("next") ?? "/cv-maker/dashboard";

  async function completeSocialLogin(access: string, refresh: string) {
    const sessionRes = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access, refresh }),
    });

    if (!sessionRes.ok) {
      throw new Error("Could not start session. Please try again.");
    }

    router.push(next);
    router.refresh();
  }

  async function handleGoogleCredential(idToken: string) {
    setSocialError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail ?? "Google sign-in failed.");
      }
      await completeSocialLogin(data.access, data.refresh);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  }

  async function handleFacebookAccessToken(accessToken: string) {
    setSocialError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/facebook/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.detail ?? "Facebook sign-in failed.");
      }
      await completeSocialLogin(data.access, data.refresh);
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : "Facebook sign-in failed.");
    }
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function initGoogleButton() {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          void handleGoogleCredential(response.credential);
        },
      });
      const width = Math.round(googleButtonRef.current.offsetWidth) || 296;
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width,
        text: "continue_with",
        logo_alignment: "center",
      });
    }

    if (window.google) {
      initGoogleButton();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogleButton();
        }
      }, 200);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFacebookLogin() {
    if (!window.FB) return;
    setSocialError(null);
    window.FB.login(
      (response) => {
        if (response.authResponse?.accessToken) {
          void handleFacebookAccessToken(response.authResponse.accessToken);
        } else {
          setSocialError("Facebook sign-in was cancelled.");
        }
      },
      { scope: "email" }
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const tokenRes = await fetch(`${API_URL}/api/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!tokenRes.ok) {
        throw new Error("Invalid username or password.");
      }

      const { access, refresh } = await tokenRes.json();
      await completeSocialLogin(access, refresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {GOOGLE_CLIENT_ID && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />}
      {FACEBOOK_APP_ID && (
        <Script
          src="https://connect.facebook.net/en_US/sdk.js"
          strategy="afterInteractive"
          onLoad={() => {
            window.FB?.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: "v19.0" });
            setIsFacebookReady(true);
          }}
        />
      )}

      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-foreground">Log in</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-foreground/80">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent-text focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground/80">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:border-accent-text focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-foreground/50 hover:text-foreground/80"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-10-8-10-8a18.6 18.6 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 10 8 10 8a18.55 18.55 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
                    <path d="M1 1l22 22" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}

          <div className="flex items-center justify-between text-sm">
            <Link href="/cv-maker/signup" className="font-medium text-accent-text hover:underline">
              Sign up
            </Link>
            <Link href="/cv-maker/forgot-password" className="font-medium text-accent-text hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent-hover disabled:opacity-50"
          >
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        {(GOOGLE_CLIENT_ID || FACEBOOK_APP_ID) && (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wide text-foreground/50">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-3">
              {GOOGLE_CLIENT_ID && <div ref={googleButtonRef} className="flex justify-center" />}

              {FACEBOOK_APP_ID && (
                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  disabled={!isFacebookReady}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface disabled:opacity-50"
                >
                  <FacebookIcon className="h-5 w-5 shrink-0" />
                  Continue with Facebook
                </button>
              )}
            </div>

            {socialError && <p className="mt-3 text-sm text-red-700 dark:text-red-400">{socialError}</p>}
          </>
        )}
      </div>
    </div>
  );
}
