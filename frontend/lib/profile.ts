// Single source of truth for the portfolio's personal details. Edit these
// values to personalize the site — every page pulls from here.

export const profile = {
  name: "Your Name",
  title: "Software Engineer",
  bio: "I build clean, reliable web applications end to end — from backend APIs to polished frontends. I care about simple solutions and code that's easy to reason about.",
  email: "you@example.com",
  social: [
    { label: "GitHub", href: "https://github.com/your-username" },
    { label: "LinkedIn", href: "https://linkedin.com/in/your-username" },
    { label: "Twitter", href: "https://twitter.com/your-username" },
  ],
};

export interface Project {
  title: string;
  description: string;
  tech: string[];
  githubUrl?: string;
  liveUrl?: string;
}

export const projects: Project[] = [
  {
    title: "CV Maker",
    description:
      "An AI-assisted CV builder with a Django REST backend and Next.js frontend, supporting PDF/Word export.",
    tech: ["Next.js", "TypeScript", "Django REST Framework", "Tailwind CSS"],
    githubUrl: "https://github.com/your-username/aman-portfolio",
  },
];
