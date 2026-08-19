import PageHeader from "@/components/PageHeader";
import { skills } from "@/lib/profile";

export default function SkillsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <PageHeader
        eyebrow="Skills"
        title="Tools of the trade"
        description="Languages, frameworks, and tools I use to build production software."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((group) => (
          <div key={group.category} className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-accent-text">
              {group.category}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground/80"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
