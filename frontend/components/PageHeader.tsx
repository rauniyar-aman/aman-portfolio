export default function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-12">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-text">
        {eyebrow}
      </span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {description && <p className="mt-3 max-w-xl text-base text-muted">{description}</p>}
    </div>
  );
}
