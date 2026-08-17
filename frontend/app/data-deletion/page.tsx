import PageHeader from "@/components/PageHeader";

export default function DataDeletionPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <PageHeader
        eyebrow="Legal"
        title="Data Deletion Instructions"
        description="Last updated: August 2026"
      />

      <p className="text-base leading-relaxed text-foreground/80">
        You can request deletion of your personal data and account information from our CV Maker
        service at any time.
      </p>

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="text-xl font-semibold text-foreground">How to Delete Your Data</h2>

          <div className="mt-4 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Option 1 — Delete via your account
              </h3>
              <p className="mt-2 text-base leading-relaxed text-foreground/80">
                If your account includes a delete option in Settings, you can remove your saved CVs
                and account data directly within the application.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-foreground">
                Option 2 — Request deletion by email
              </h3>
              <p className="mt-2 text-base leading-relaxed text-foreground/80">
                Send an email to amangupta00121212@gmail.com with the subject line &ldquo;Data
                Deletion Request,&rdquo; including the email address associated with your account. We
                will process your request and permanently delete your account data, including any
                saved CVs, personal details, and login information, within 30 days.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">If You Signed In With Facebook</h2>
          <p className="mt-3 text-base leading-relaxed text-foreground/80">
            If you used &ldquo;Continue with Facebook&rdquo; to create your account, deleting your
            data through either option above will remove all information associated with your
            account on our service, including any data originally obtained through Facebook Login.
            This does not affect your Facebook account itself — to manage what our app can access on
            Facebook, you can also go to your Facebook Settings → Apps and Websites, find this app,
            and remove it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">What Gets Deleted</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li className="text-base leading-relaxed text-foreground/80">
              Your account (email, username, password hash)
            </li>
            <li className="text-base leading-relaxed text-foreground/80">
              All CVs and their content (personal details, education, work history, etc.)
            </li>
            <li className="text-base leading-relaxed text-foreground/80">
              Any stored OTP verification records
            </li>
          </ul>
          <p className="mt-4 text-base leading-relaxed text-foreground/80">
            Deletion is permanent and cannot be undone.
          </p>
        </section>
      </div>
    </main>
  );
}
