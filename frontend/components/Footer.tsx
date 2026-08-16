import Link from "next/link";
import { profile, social } from "@/lib/profile";
import { SocialIcon, MailIcon } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{profile.name}</p>
            <p className="mt-1 max-w-xs text-sm text-muted">{profile.tagline}</p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center gap-2 text-sm text-muted hover:text-accent-text"
            >
              <MailIcon className="h-4 w-4" />
              {profile.email}
            </a>
            <div className="flex items-center gap-4">
              {social.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="text-muted hover:text-accent-text"
                >
                  <SocialIcon icon={link.icon} className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
          <Link href="/cv-maker" className="hover:text-accent-text">
            Built with the CV Maker tool →
          </Link>
        </div>
      </div>
    </footer>
  );
}
