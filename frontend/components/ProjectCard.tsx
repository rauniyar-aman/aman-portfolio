import type { Project } from "@/lib/profile";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">{project.title}</h3>
      <p className="mt-2 text-sm text-gray-600">{project.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.tech.map((tech) => (
          <span
            key={tech}
            className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
          >
            {tech}
          </span>
        ))}
      </div>

      {(project.githubUrl || project.liveUrl) && (
        <div className="mt-4 flex gap-4 text-sm">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-900 hover:underline"
            >
              GitHub
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-900 hover:underline"
            >
              Live demo
            </a>
          )}
        </div>
      )}
    </div>
  );
}
