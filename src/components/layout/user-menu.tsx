"use client";

import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentProfile } from "@/lib/permissions/context";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu() {
  const profile = useCurrentProfile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="flex items-center gap-2 px-2" />}>
        <Avatar className="size-7">
          <AvatarFallback className="text-xs">{initials(profile.full_name)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:inline">{profile.full_name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="truncate">{profile.full_name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/team/me" />}>Mes coordonnées</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<form action={logoutAction} className="w-full" />}>
          <button type="submit" className="w-full text-left">
            Se déconnecter
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
