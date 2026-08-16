import Image from "next/image";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Avatar({
  name,
  src,
  className = "",
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  if (src) {
    return (
      <span className={`relative block overflow-hidden rounded-full ${className}`}>
        <Image src={src} alt={name} fill sizes="200px" className="object-cover" />
      </span>
    );
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full bg-accent font-semibold text-accent-ink ${className}`}
    >
      {initials(name)}
    </span>
  );
}
