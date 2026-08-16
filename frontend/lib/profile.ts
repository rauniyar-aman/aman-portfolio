// Single source of truth for the portfolio's content. Every page pulls from
// here — update this file to change site content.

export const profile = {
  name: "Aman Rauniyar",
  title: "CEO, Blessing Technologies & Senior Education Counsellor at The Blessing Study Abroad Pvt. Ltd.",
  location: "Kathmandu, Nepal",
  tagline: "Building Technology • Guiding Futures",
  intro:
    "Building intelligent, production-grade web platforms while helping students navigate their path to studying abroad.",
  email: "amangupta00121212@gmail.com",
  photo: "/aman.jpg",
};

export const bio = [
  "I'm Aman Rauniyar, a full-stack developer and entrepreneur based in Kathmandu, Nepal. By day, I lead Blessing Technologies as CEO and serve as a Senior Education Counsellor at The Blessing Study Abroad Pvt. Ltd., where I help students turn their international education goals into reality.",
  "Outside of that, I build full-stack web applications — from e-commerce platforms with real payment gateway integrations to AI-powered internal tools — combining clean architecture with practical, real-world problem solving. I work across the stack with React, Next.js, Django, and Node.js, and I'm currently building an AI-powered CV generation tool to help streamline hiring workflows at my own company.",
  "I care about building things that are genuinely useful — not just technically impressive — and I'm always looking for the next problem worth solving.",
];

export type SocialIcon = "github" | "linkedin" | "instagram";

export const social: { label: string; href: string; icon: SocialIcon }[] = [
  { label: "GitHub", href: "https://github.com/rauniyar-aman", icon: "github" },
  { label: "LinkedIn", href: "https://linkedin.com/in/rauniyaraman", icon: "linkedin" },
  { label: "Instagram", href: "https://instagram.com/aman.0", icon: "instagram" },
];

export interface Project {
  title: string;
  description: string;
  tech: string[];
  githubUrl?: string;
  liveUrl?: string;
}

export const projects: Project[] = [
  {
    title: "PharmaX — Online Pharmacy Platform",
    description:
      "A full-stack e-commerce platform for ordering medicines online — prescription uploads, real-time order tracking, and live Nepali payment gateway integrations (eSewa & Khalti), with a complete admin panel for inventory, orders, and prescription verification.",
    tech: [
      "React 19",
      "Vite",
      "Tailwind CSS",
      "Node.js",
      "Express.js",
      "PostgreSQL",
      "Prisma",
      "JWT",
      "Multer",
      "Nodemailer",
    ],
    githubUrl: "https://github.com/rauniyar-aman/PharmaX_Dev",
  },
];

export const skills: { category: string; items: string[] }[] = [
  {
    category: "Languages",
    items: ["JavaScript", "TypeScript", "Java", "Python", "C", "PHP"],
  },
  {
    category: "Frameworks",
    items: [
      "React",
      "Next.js",
      "Express.js",
      "Django",
      "Django REST Framework",
      "Spring",
      "Tailwind CSS",
    ],
  },
  {
    category: "Databases",
    items: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"],
  },
  {
    category: "Tools",
    items: [
      "Git",
      "GitHub",
      "Cloudflare",
      "Docker",
      "Prisma",
      "Vite",
      "VS Code",
      "Postman",
      "Railway/Render",
      "Figma",
    ],
  },
];

export interface Achievement {
  title: string;
  year: string;
  description?: string;
}

export const achievements: Achievement[] = [
  {
    title: "Founded Blessing Technologies",
    year: "2026",
  },
];
