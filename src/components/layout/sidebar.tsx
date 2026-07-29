"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/permissions/context";
import { ADMIN_NAV, PRIMARY_NAV } from "@/components/layout/nav-items";
import { Separator } from "@/components/ui/separator";
import { TedxLogo } from "@/components/shared/tedx-logo";

export function Sidebar() {
  const pathname = usePathname();
  const { can } = usePermissions();

  const visiblePrimary = PRIMARY_NAV.filter((item) => can(item.module, item.action));
  const visibleAdmin = ADMIN_NAV.filter((item) => can(item.module, item.action));

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <TedxLogo className="h-6 w-auto" priority />
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {visiblePrimary.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "border-primary bg-muted text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}

        {visibleAdmin.length > 0 ? (
          <>
            <Separator className="my-3" />
            <span className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase">Administration</span>
            {visibleAdmin.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-muted text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        ) : null}
      </nav>
    </aside>
  );
}
