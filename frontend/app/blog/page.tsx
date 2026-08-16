import PageHeader from "@/components/PageHeader";

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <PageHeader eyebrow="Blog" title="Writing" />

      <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">Posts coming soon</p>
        <p className="mt-1 text-sm text-muted">
          I&apos;m working on some writing about building products and shipping software. Check
          back soon.
        </p>
      </div>
    </main>
  );
}
