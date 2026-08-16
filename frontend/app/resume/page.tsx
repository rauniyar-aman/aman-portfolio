import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export default function ResumePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <PageHeader eyebrow="Resume" title="No PDF here — I built the generator instead" />

      <p className="max-w-xl text-base leading-relaxed text-foreground/80">
        Rather than hand you a static file that goes stale, I built an AI-powered CV generator —
        the same tool you can use to create your own. Use it to generate an up-to-date resume for
        me, or build one for yourself.
      </p>

      <Link
        href="/cv-maker"
        className="mt-8 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/90"
      >
        Open CV Maker →
      </Link>
    </main>
  );
}
