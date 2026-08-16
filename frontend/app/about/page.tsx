import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { SocialIcon } from "@/components/icons";
import { achievements, bio, profile, skills, social } from "@/lib/profile";

const totalTechnologies = skills.reduce((count, group) => count + group.items.length, 0);
const foundingYear = achievements[0]?.year;

const QUOTE =
  "I care about building things that are genuinely useful — not just technically impressive.";

const QUICK_FACTS = [
  { value: foundingYear, label: "Founded Blessing Technologies" },
  { value: `${totalTechnologies}+`, label: "Technologies across the stack" },
  { value: "2", label: "Roles — CEO & Senior Counsellor" },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-20">
      <PageHeader eyebrow="Get to know me" title="About Me" />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface">
            <Image
              src={profile.photo}
              alt={profile.name}
              fill
              sizes="320px"
              className="object-cover"
              priority
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-surface p-5 text-sm">
            <p className="flex items-center gap-2 text-foreground">
              <span>📍</span> {profile.location}
            </p>
            <p className="flex items-center gap-2 text-muted">
              <span className="h-2 w-2 rounded-full bg-accent" /> Currently building an AI CV
              generator
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {social.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:border-accent hover:text-accent"
              >
                <SocialIcon icon={link.icon} className="h-4 w-4" />
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="space-y-5">
            {bio.map((paragraph, index) => (
              <p key={index} className="text-base leading-relaxed text-foreground/80">
                {paragraph}
              </p>
            ))}
          </div>

          <blockquote className="mt-8 border-l-2 border-accent pl-5 text-lg font-medium italic text-foreground/90">
            &ldquo;{QUOTE}&rdquo;
          </blockquote>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {QUICK_FACTS.map((fact) => (
              <div key={fact.label} className="rounded-xl border border-border bg-surface p-5">
                <p className="text-2xl font-semibold text-foreground">{fact.value}</p>
                <p className="mt-1 text-xs text-muted">{fact.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/projects"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/90"
            >
              View Projects
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Contact Me
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
