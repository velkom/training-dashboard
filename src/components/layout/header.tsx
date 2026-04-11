import Link from "next/link";

import { UserSwitcher } from "@/components/layout/user-switcher";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppHeader() {
  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Training Dashboard
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Dashboard
            </Link>
            <Link
              href="/history"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              History
            </Link>
            <Link
              href="/import"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Import
            </Link>
          </nav>
        </div>
        <UserSwitcher />
      </div>
    </header>
  );
}
