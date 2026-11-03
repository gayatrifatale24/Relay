"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useLogout, useSession } from "@/features/auth/hooks/use-auth";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink",
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function UserMenu() {
  const { data: user } = useSession();
  const logout = useLogout();

  if (!user) {
    return (
      <div className="flex items-center gap-2.5 p-1.5">
        <Skeleton className="size-7 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-32" />
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu
      side="top"
      className="w-full"
      header={
        <p className="truncate text-xs text-faint" title={user.email}>
          Signed in as <span className="text-muted">{user.email}</span>
        </p>
      }
      items={[
        {
          label: logout.isPending ? "Signing out…" : "Sign out",
          icon: <LogOut />,
          onSelect: () => logout.mutate(),
        },
      ]}
      trigger={({ open, toggle, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors duration-150 hover:bg-hover",
            open && "bg-hover",
          )}
        >
          <Avatar name={user.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-ink">{user.name}</span>
            <span className="block truncate text-xs text-faint">{user.email}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-faint" />
        </button>
      )}
    />
  );
}
