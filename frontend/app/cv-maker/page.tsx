import Link from "next/link";

const FEATURES = [
  {
    title: "Structured editor",
    description: "Fill in personal info, experience, education, and skills in one clean form.",
  },
  {
    title: "AI-assisted writing",
    description: "Enhance your summary and role descriptions with a single click.",
  },
  {
    title: "Export anywhere",
    description: "Download your finished CV as a polished PDF or an editable Word document.",
  },
];

export default function CvMakerLandingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
        CV Maker
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600">
        Build a clean, professional CV in minutes. Fill in your details, let AI sharpen your
        summary and experience descriptions, then export straight to PDF or Word.
      </p>

      <Link
        href="/cv-maker/login"
        className="mt-8 inline-block rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        Log in
      </Link>

      <div className="mt-16 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
