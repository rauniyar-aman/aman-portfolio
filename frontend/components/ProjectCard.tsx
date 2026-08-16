import type { Project } from "@/lib/profile";
import { GitHubIcon } from "@/components/icons";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/50">
      <h3 className="text-base font-semibold text-foreground">{project.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{project.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {project.tech.map((tech) => (
          <span
            key={tech}
            className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent"
          >
            {tech}
          </span>
        ))}
      </div>

      {(project.githubUrl || project.liveUrl) && (
        <div className="mt-5 flex gap-5 border-t border-border pt-4 text-sm">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-medium text-foreground hover:text-accent"
            >
              <GitHubIcon className="h-4 w-4" />
              GitHub
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-accent"
            >
              Live demo →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
