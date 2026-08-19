import PageHeader from "@/components/PageHeader";
import { achievements, certifications } from "@/lib/profile";

export default function AchievementsPage() {
  return (
    <main className="w-full px-[1cm] py-20">
      <PageHeader
        eyebrow="Achievements"
        title="Milestones"
        description="A running record of things worth marking."
      />

      <ol className="max-w-2xl border-l border-border">
        {achievements.map((achievement) => (
          <li key={achievement.title} className="relative pb-8 pl-8 last:pb-0">
            <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="text-xs font-semibold uppercase tracking-widest text-accent-text">
              {achievement.year}
            </span>
            <h3 className="mt-1 text-base font-semibold text-foreground">{achievement.title}</h3>
            {achievement.description && (
              <p className="mt-1 text-sm text-muted">{achievement.description}</p>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-16">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-accent-text">
          Licenses &amp; Certifications
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {certifications.map((cert) => (
            <div
              key={cert.title}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <h3 className="text-sm font-semibold text-foreground">{cert.title}</h3>
              <p className="mt-1 text-sm text-muted">{cert.issuer}</p>
              <p className="mt-1 text-xs text-muted">{cert.date}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
