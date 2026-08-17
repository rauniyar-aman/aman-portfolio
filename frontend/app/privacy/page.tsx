import PageHeader from "@/components/PageHeader";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: [
      "Account information: name, email address, and password (encrypted) when you sign up, or basic profile information (name, email) if you sign in with Google or Facebook.",
      "CV content: any information you enter into the CV Maker, which may include personal details, contact information, passport details, education history, work experience, and skills.",
      "Usage data: basic technical information such as IP address and browser type, collected automatically for security and performance purposes.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    list: [
      "To create and manage your account",
      "To generate and export your CV documents (PDF/Word)",
      "To provide AI-assisted writing suggestions for CV content (via Google's Gemini API)",
      "To send account-related emails (email verification, password reset) via Resend",
      "To maintain the security and reliability of the service",
    ],
  },
  {
    title: "3. Third-Party Services",
    body: [
      "We use the following third-party services, each of which processes limited data as needed to provide their function:",
    ],
    list: [
      "Google (Sign-in and Gemini AI) — for authentication and AI-assisted content generation",
      "Meta/Facebook (Login) — for authentication, if you choose this sign-in method",
      "Resend — for sending transactional emails (OTP codes, password resets)",
      "Render, Neon, Cloudflare — infrastructure providers hosting our application, database, and website",
    ],
    after: ["We do not sell your personal information to third parties."],
  },
  {
    title: "4. Data Storage and Security",
    body: [
      "Your data is stored in a secure database and transmitted over encrypted (HTTPS) connections. Authentication tokens are stored in httpOnly cookies, which are not accessible to client-side scripts.",
    ],
  },
  {
    title: "5. Your Rights",
    body: [
      "You may request access to, correction of, or deletion of your personal data at any time by contacting us using the details below. You may also delete your account and associated CV data directly within the application, where available. See our Data Deletion Instructions page for details.",
    ],
  },
  {
    title: "6. Data Retention",
    body: [
      "We retain your account and CV data for as long as your account remains active, or as needed to provide the service. You may request deletion at any time.",
    ],
  },
  {
    title: "7. Children's Privacy",
    body: [
      "This service is not directed at children under 16, and we do not knowingly collect personal information from children.",
    ],
  },
  {
    title: "8. Changes to This Policy",
    body: [
      "We may update this policy from time to time. Continued use of the service after changes constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "9. Contact Us",
    body: [
      "If you have questions about this policy or your data, contact us at: amangupta00121212@gmail.com",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <PageHeader eyebrow="Legal" title="Privacy Policy" description="Last updated: August 2026" />

      <p className="text-base leading-relaxed text-foreground/80">
        This Privacy Policy explains how Aman Rauniyar (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;),
        through this website and the CV Maker tool, collects, uses, and protects your information.
      </p>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
            <div className="mt-3 space-y-4">
              {section.body?.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-foreground/80">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc space-y-2 pl-5">
                  {section.list.map((item) => (
                    <li key={item} className="text-base leading-relaxed text-foreground/80">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.after?.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-foreground/80">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
