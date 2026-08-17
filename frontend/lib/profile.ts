// Single source of truth for the portfolio's content. Every page pulls from
// here — update this file to change site content.

export const profile = {
  name: "Aman Rauniyar",
  title: "CEO, Blessing Technologies & MD/Senior Counsellor at The Blessing Edu",
  location: "Kathmandu, Nepal",
  tagline: "Building Technology • Guiding Futures",
  intro:
    "Building intelligent, production-grade web platforms while guiding students through their journey to study abroad.",
  email: "amangupta00121212@gmail.com",
  photo: "/aman.jpg",
};

export const bio = [
  "I'm Aman Rauniyar, based in Kathmandu, Nepal, working at the intersection of technology and international education. I'm the CEO of Blessing Technologies and the Managing Director & Senior Counsellor at The Blessing Edu, where I'm a British Council Certified UK Education Consultant. Over 5+ years, I've personally guided thousands of students through their journey to study abroad — from course and university selection to visa applications and beyond.",
  "Outside of that, I build full-stack web applications — from e-commerce platforms with real payment gateway integrations to AI-powered internal tools — combining clean architecture with practical, real-world problem solving. I work across the stack with React, Next.js, Django, and Node.js, and I built this site's own AI-powered CV generation tool to help streamline hiring workflows at my own company.",
  "I care about building things that are genuinely useful — not just technically impressive — and I'm always looking for the next problem worth solving.",
];

export type SocialIcon = "github" | "linkedin" | "instagram" | "facebook";

export const social: { label: string; href: string; icon: SocialIcon }[] = [
  { label: "GitHub", href: "https://github.com/rauniyar-aman", icon: "github" },
  { label: "LinkedIn", href: "https://linkedin.com/in/rauniyaraman", icon: "linkedin" },
  { label: "Instagram", href: "https://instagram.com/__aman.0__", icon: "instagram" },
  { label: "Facebook", href: "https://www.facebook.com/aman.rauniyar0", icon: "facebook" },
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
    title: "AI CV Maker",
    description:
      "An AI-assisted CV builder — fill in a structured editor, let Gemini sharpen your summary and experience bullets, then export straight to PDF or Word. Full account system with email/password signup and OTP verification, password reset, and Google & Facebook social login.",
    tech: [
      "Next.js 15",
      "React 19",
      "Tailwind CSS",
      "Django REST Framework",
      "Simple JWT",
      "Gemini API",
      "WeasyPrint",
      "python-docx",
      "Google Identity Services",
      "Facebook SDK",
    ],
    githubUrl: "https://github.com/rauniyar-aman/aman-portfolio",
    liveUrl: "/cv-maker",
  },
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
  {
    category: "Counselling & Leadership",
    items: [
      "Leadership",
      "Team Management",
      "Team Leadership",
      "Career Counselling",
      "Strategic Planning",
      "Business Development",
      "Partnership Development",
      "University Relationship Management",
      "Partner Relationship Management",
      "Educational Consulting",
      "Volunteer Management",
      "Microsoft Office",
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

export interface Certification {
  title: string;
  issuer: string;
  date: string;
}

export const certifications: Certification[] = [
  { title: "UK Agent and Counsellor Training", issuer: "British Council", date: "Feb 2025" },
  { title: "United Kingdom Counsellor Course", issuer: "TrainHub", date: "Feb 2026" },
  { title: "Australia Counsellor Course", issuer: "TrainHub", date: "Feb 2026" },
  { title: "Canada Counsellor Course", issuer: "TrainHub", date: "Feb 2026" },
  { title: "United States Counsellor Course", issuer: "TrainHub", date: "Mar 2026" },
  {
    title: "Ethical Business Practices in International Student Recruitment",
    issuer: "TrainHub",
    date: "Mar 2026",
  },
  {
    title: "A Trained NT Education Agent",
    issuer: "Northern Territory Government",
    date: "Mar 2026",
  },
  { title: "Germany Counsellor Course", issuer: "TrainHub", date: "Jul 2026" },
  { title: "Ireland Counsellor Course", issuer: "TrainHub", date: "Jul 2026" },
  {
    title: "ECANZ Provisional Licensed Education Counsellor Certification",
    issuer: "ECANZ",
    date: "Jul 2026",
  },
];
