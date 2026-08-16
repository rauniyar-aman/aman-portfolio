import Link from "next/link";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/session";
import { profile } from "@/lib/profile";
import NavMenu from "@/components/NavMenu";

export default async function Navbar() {
  const cookieStore = await cookies();
  const isAuthenticated = Boolean(cookieStore.get(ACCESS_COOKIE)?.value);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <nav className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          {profile.name}
        </Link>

        <NavMenu isAuthenticated={isAuthenticated} />
      </nav>
    </header>
  );
}
