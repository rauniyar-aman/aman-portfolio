import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { profile, projects } from "@/lib/profile";

export default function HomePage() {
  const previewProjects = projects.slice(0, 3);

  return (
    <main className="mx-auto max-w-4xl px-4">
      <section className="py-20 sm:py-28">
        <p className="text-sm font-medium text-gray-500">Hi, I&apos;m</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          {profile.name}
        </h1>
        <p className="mt-2 text-lg text-gray-600">{profile.title}</p>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-600">{profile.bio}</p>

        <div className="mt-8 flex gap-4">
          <Link
            href="/projects"
            className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            View projects
          </Link>
          <Link
            href="/contact"
            className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Get in touch
          </Link>
        </div>
      </section>

      {previewProjects.length > 0 && (
        <section className="pb-24">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Selected projects</h2>
            <Link href="/projects" className="text-sm text-gray-600 hover:text-gray-900">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewProjects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
