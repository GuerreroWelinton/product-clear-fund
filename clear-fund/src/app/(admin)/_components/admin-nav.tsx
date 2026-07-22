"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { SignOutButton } from "@/modules/auth/ui/sign-out-button";

interface AdminNavProps {
  isSuperAdmin: boolean;
  userName: string;
}

const LINKS = [
  { href: "/dashboard", label: "Dashboard", superAdminOnly: false },
  { href: "/users", label: "Usuarios", superAdminOnly: true },
];

export function AdminNav({ isSuperAdmin, userName }: AdminNavProps) {
  const pathname = usePathname();
  const links = LINKS.filter((link) => !link.superAdminOnly || isSuperAdmin);

  return (
    <header className="bg-card/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-medium">Clear Fund</span>
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/50",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {userName}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
