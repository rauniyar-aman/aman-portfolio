import PageHeader from "@/components/PageHeader";
import { achievements } from "@/lib/profile";

export default function AchievementsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <PageHeader
        eyebrow="Achievements"
        title="Milestones"
        description="A running record of things worth marking."
      />

      <ol className="border-l border-border">
        {achievements.map((achievement) => (
          <li key={achievement.title} className="relative pb-8 pl-8 last:pb-0">
            <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              {achievement.year}
            </span>
            <h3 className="mt-1 text-base font-semibold text-foreground">{achievement.title}</h3>
            {achievement.description && (
              <p className="mt-1 text-sm text-muted">{achievement.description}</p>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
