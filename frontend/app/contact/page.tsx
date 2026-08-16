import PageHeader from "@/components/PageHeader";
import { profile, social } from "@/lib/profile";
import { SocialIcon, MailIcon } from "@/components/icons";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        description="Feel free to reach out — I'm happy to talk about work, projects, or anything else."
      />

      <div className="max-w-sm space-y-3">
        <a
          href={`mailto:${profile.email}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-accent-text hover:text-accent-text"
        >
          <MailIcon className="h-5 w-5 shrink-0" />
          {profile.email}
        </a>

        {social.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-accent-text hover:text-accent-text"
          >
            <SocialIcon icon={link.icon} className="h-5 w-5 shrink-0" />
            {link.label}
          </a>
        ))}
      </div>
    </main>
  );
}
