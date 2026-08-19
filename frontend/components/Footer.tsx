import Link from "next/link";
import { profile, social } from "@/lib/profile";
import { SocialIcon, MailIcon } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="w-full px-[1cm] py-10">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{profile.name}</p>
            <p className="mt-1 max-w-xs text-sm text-muted">{profile.tagline}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
              Legal
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/privacy" className="text-sm text-muted hover:text-accent-text">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted hover:text-accent-text">
                Terms of Service
              </Link>
              <Link href="/data-deletion" className="text-sm text-muted hover:text-accent-text">
                Data Deletion Instructions
              </Link>
            </div>
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
