import Link from "next/link";

export const runtime = "edge";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="text-muted">This page could not be found.</p>
      <Link href="/" className="text-accent-text hover:underline">
        Back to home
      </Link>
    </div>
  );
}
