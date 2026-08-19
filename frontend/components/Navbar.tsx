import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/session";
import { profile } from "@/lib/profile";
import { decodeJwtPayload } from "@/lib/jwt";
import NavMenu from "@/components/NavMenu";

export default async function Navbar() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const isAuthenticated = Boolean(accessToken);
  const username = accessToken
    ? decodeJwtPayload<{ username?: string }>(accessToken)?.username
    : undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <nav className="relative flex w-full items-center justify-between px-[1cm] py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-mark.png" alt={profile.name} width={34} height={34} className="h-8 w-8" priority />
          <span className="text-base font-bold tracking-tight text-foreground">
            {profile.name.split(" ")[0]}.
          </span>
        </Link>

        <NavMenu isAuthenticated={isAuthenticated} username={username} />
      </nav>
    </header>
  );
}
