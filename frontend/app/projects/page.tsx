import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/lib/profile";

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
      <p className="mt-2 text-sm text-gray-600">A selection of things I&apos;ve built.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </div>
    </main>
  );
}
