"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/modules/auth/ui/sign-out-button";

interface AdminNavProps {
  isSuperAdmin: boolean;
  userName: string;
}

const LINKS = [
  { href: "/dashboard", label: "Dashboard", superAdminOnly: false },
  { href: "/users", label: "Usuarios", superAdminOnly: true },
  { href: "/cash-funds", label: "Cajas", superAdminOnly: false },
];

export function AdminNav({ isSuperAdmin, userName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const links = LINKS.filter((link) => !link.superAdminOnly || isSuperAdmin);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="bg-card/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-medium">Clear Fund</span>
          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  isActive(link.href)
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 sm:flex">
          <span className="text-muted-foreground text-sm">{userName}</span>
          <SignOutButton />
        </div>

        {/* Mobile hamburger menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Abrir menú"
            render={
              <Button
                variant="outline"
                size="icon"
                className="rounded-full sm:hidden"
              />
            }
          >
            <MenuIcon className="size-5" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="text-muted-foreground truncate px-1.5 py-1 text-xs font-medium">
              {userName}
            </div>
            <DropdownMenuSeparator />
            {links.map((link) => (
              <DropdownMenuItem
                key={link.href}
                render={<Link href={link.href} />}
                className={cn(
                  isActive(link.href) &&
                    "bg-secondary text-secondary-foreground",
                )}
              >
                {link.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
