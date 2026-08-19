import PageHeader from "@/components/PageHeader";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/lib/profile";

export default function ProjectsPage() {
  return (
    <main className="w-full px-[1cm] py-20">
      <PageHeader
        eyebrow="Projects"
        title="Things I've built"
        description="A selection of projects — from production e-commerce platforms to internal tools."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </div>
    </main>
  );
}
