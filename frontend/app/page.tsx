import Link from "next/link";
import { profile, social } from "@/lib/profile";
import { SocialIcon } from "@/components/icons";
import Avatar from "@/components/Avatar";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center px-4 py-20">
      <Avatar
        name={profile.name}
        src={profile.photo}
        className="h-24 w-24 border-2 border-border text-lg"
      />

      <span className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-accent-soft px-3 py-1 text-xs font-medium text-accent-text">
        📍 {profile.location}
      </span>

      <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
        {profile.name}
      </h1>

      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{profile.title}</p>

      <p className="mt-6 text-xl font-medium tracking-tight text-accent-text">{profile.tagline}</p>

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

      <div className="mt-12 flex items-center gap-5">
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
    </main>
  );
}
