"use client";

import { ClipboardList, Coffee, LayoutDashboard, Settings, SmilePlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, manage: false },
  { href: "/dashboard/orders", label: "Orders", icon: ClipboardList, manage: false },
  { href: "/dashboard/menu", label: "Menu", icon: Coffee, manage: true },
  { href: "/dashboard/moods", label: "Mood rules", icon: SmilePlus, manage: true },
  { href: "/dashboard/settings", label: "Shop settings", icon: Settings, manage: true },
] as const;

export function DashboardNav({ canManage }: { canManage: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Dashboard">
      {LINKS.filter((l) => canManage || !l.manage).map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              active ? "bg-espresso text-foam" : "text-mocha hover:bg-sand"
            }`}
          >
            <Icon className="size-4.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
