import Link from "next/link";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/session";
import { profile } from "@/lib/profile";
import Avatar from "@/components/Avatar";
import NavMenu from "@/components/NavMenu";

export default async function Navbar() {
  const cookieStore = await cookies();
  const isAuthenticated = Boolean(cookieStore.get(ACCESS_COOKIE)?.value);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <nav className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <Avatar name={profile.name} src={profile.photo} className="h-8 w-8 text-xs" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {profile.name.split(" ")[0]}.
          </span>
        </Link>

        <NavMenu isAuthenticated={isAuthenticated} />
      </nav>
    </header>
  );
}
