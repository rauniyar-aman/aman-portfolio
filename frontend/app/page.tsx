import Link from "next/link";
import { profile, social, bio, projects, certifications } from "@/lib/profile";
import { SocialIcon } from "@/components/icons";
import Avatar from "@/components/Avatar";
import ProjectCard from "@/components/ProjectCard";

const [firstName, ...restName] = profile.name.split(" ");
const lastName = restName.join(" ");

const HIGHLIGHTS = [
  { value: "5+", label: "Years of experience" },
  { value: "1000s", label: "Students guided abroad" },
  { value: "2", label: "Companies led" },
  { value: `${certifications.length}+`, label: "Professional certifications" },
];

export default function HomePage() {
  return (
    <main className="w-full">
      <section className="px-[1cm] pb-16 pt-16 sm:pb-24 sm:pt-24">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:gap-16">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-accent-soft px-3 py-1 text-xs font-medium text-accent-text">
                📍 {profile.location}
              </span>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-accent-soft px-3 py-1 text-xs font-medium text-accent-text">
                🎓 British Council Certified UK Education Consultant
              </span>
            </div>

            <h1 className="mt-8 text-6xl font-black leading-[0.95] tracking-tighter text-foreground sm:text-7xl lg:text-8xl">
              {firstName}
              <br />
              <span className="text-muted">{lastName}</span>
            </h1>

            <p className="mt-6 text-2xl font-medium tracking-tight sm:text-3xl">
              <span className="text-accent-text">Building Technology</span>
              <span className="mx-2 text-border">/</span>
              <span className="text-foreground">Guiding Futures</span>
            </p>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{profile.title}</p>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80">
              {profile.intro}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/projects"
                className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
              >
                View Projects
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent-text hover:text-accent-text"
              >
                Contact Me
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-5">
              {social.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="text-muted transition-colors hover:text-accent-text"
                >
                  <SocialIcon icon={link.icon} className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>

          <div className="hidden shrink-0 lg:block">
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-accent-soft blur-3xl" />
              <Avatar
                name={profile.name}
                src={profile.photo}
                className="relative h-40 w-40 border-4 border-accent text-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="grid grid-cols-2 gap-8 px-[1cm] py-10 sm:grid-cols-4">
          {HIGHLIGHTS.map((item) => (
            <div key={item.label}>
              <p className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-[1cm] py-20 sm:py-28">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent-text">
          What I Do
        </span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Two crafts, one focus
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent-text">
              Technology
            </span>
            <h3 className="mt-3 text-xl font-semibold text-foreground">
              CEO, Blessing Technologies
            </h3>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">{bio[1]}</p>
            <Link
              href="/projects"
              className="mt-5 inline-block text-sm font-semibold text-accent-text hover:text-foreground"
            >
              See my work →
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-surface p-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent-text">
              Education
            </span>
            <h3 className="mt-3 text-xl font-semibold text-foreground">
              MD &amp; Senior Counsellor, The Blessing Edu
            </h3>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">{bio[0]}</p>
            <Link
              href="/about"
              className="mt-5 inline-block text-sm font-semibold text-accent-text hover:text-foreground"
            >
              Learn more →
            </Link>
          </div>
        </div>
      </section>

      <section className="px-[1cm] py-20 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-accent-text">
              Featured Work
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Recent builds
            </h2>
          </div>
          <Link
            href="/projects"
            className="text-sm font-semibold text-accent-text hover:text-foreground"
          >
            View all projects →
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {projects.slice(0, 2).map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </section>

      <section className="bg-accent">
        <div className="flex flex-col items-start gap-6 px-[1cm] py-16 sm:flex-row sm:items-center sm:justify-between sm:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-accent-ink sm:text-4xl">
            Let&apos;s build something.
          </h2>
          <Link
            href="/contact"
            className="rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
          >
            Contact Me →
          </Link>
        </div>
      </section>
    </main>
  );
}
