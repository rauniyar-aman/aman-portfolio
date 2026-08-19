"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import { MenuIcon, CloseIcon } from "@/components/icons";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/skills", label: "Skills" },
  { href: "/achievements", label: "Achievements" },
  { href: "/blog", label: "Blog" },
  { href: "/resume", label: "Resume" },
  { href: "/cv-maker", label: "CV Maker" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavMenu({
  isAuthenticated,
  username,
}: {
  isAuthenticated: boolean;
  username?: string;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="hidden items-center gap-1 lg:flex">
        {NAV_LINKS.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3 py-2 text-sm font-semibold tracking-tight transition-colors ${
                active ? "text-accent-text" : "text-muted hover:text-foreground"
              }`}
            >
              {link.label}
              {active && (
                <span className="absolute inset-x-3 -bottom-[1px] h-[3px] rounded-full bg-accent" />
              )}
            </Link>
          );
        })}

        {isAuthenticated && (
          <div className="ml-2 flex items-center gap-3 border-l border-border pl-3">
            {username && (
              <Link href="/cv-maker/dashboard" className="text-sm text-muted hover:text-foreground">
                {username}
              </Link>
            )}
            <LogoutButton />
          </div>
        )}

        <div className="ml-3 flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/contact"
            className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
          >
            Contact Me
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-1 lg:hidden">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-md p-2 text-foreground"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-background shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-5xl flex-col px-4 py-3">
            {[...NAV_LINKS, { href: "/contact", label: "Contact" }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`rounded-md px-2 py-2.5 text-sm font-semibold ${
                  isActive(pathname, link.href) ? "text-accent-text" : "text-foreground/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <div className="mt-1 flex items-center justify-between border-t border-border px-2 pt-3">
                {username && (
                  <Link
                    href="/cv-maker/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-sm text-muted hover:text-foreground"
                  >
                    {username}
                  </Link>
                )}
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
