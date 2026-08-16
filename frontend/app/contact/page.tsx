import { profile } from "@/lib/profile";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">Contact</h1>
      <p className="mt-2 text-sm text-gray-600">
        Feel free to reach out — I&apos;m happy to talk about work, projects, or anything else.
      </p>

      <div className="mt-8 space-y-3">
        <a
          href={`mailto:${profile.email}`}
          className="block text-sm font-medium text-gray-900 hover:underline"
        >
          {profile.email}
        </a>

        {profile.social.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-medium text-gray-900 hover:underline"
          >
            {link.label}
          </a>
        ))}
      </div>
    </main>
  );
}
