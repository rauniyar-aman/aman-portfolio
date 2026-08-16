import PageHeader from "@/components/PageHeader";
import { bio, profile } from "@/lib/profile";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <PageHeader eyebrow="About" title="A bit about me" description={profile.title} />

      <div className="space-y-5">
        {bio.map((paragraph, index) => (
          <p key={index} className="text-base leading-relaxed text-foreground/80">
            {paragraph}
          </p>
        ))}
      </div>
    </main>
  );
}
