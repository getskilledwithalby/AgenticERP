"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Landmark,
  BarChart3,
  ArrowLeftRight,
  Paperclip,
  Settings,
  Receipt,
} from "lucide-react";

const navItems = [
  {
    label: "Oversikt",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Kontoplan",
    href: "/dashboard/accounts",
    icon: BookOpen,
  },
  {
    label: "Huvudbok",
    href: "/dashboard/ledger",
    icon: Landmark,
  },
  {
    label: "Verifikationer",
    href: "/dashboard/journal-entries",
    icon: FileText,
  },
  {
    label: "Rapporter",
    href: "/dashboard/reports/income-statement",
    icon: BarChart3,
    children: [
      { label: "Resultatrakning", href: "/dashboard/reports/income-statement" },
      { label: "Balansrakning", href: "/dashboard/reports/balance-sheet" },
      { label: "Momsrapport", href: "/dashboard/reports/vat" },
    ],
  },
  {
    label: "Bank",
    href: "/dashboard/bank",
    icon: ArrowLeftRight,
  },
  {
    label: "Dokument",
    href: "/dashboard/documents",
    icon: Paperclip,
  },
  {
    label: "Installningar",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      <div className="flex items-center gap-2 px-3 py-4 mb-2">
        <Receipt className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg tracking-tight">AgenticERP</span>
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          item.children?.some((child) => pathname === child.href);

        return (
          <div key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>

            {item.children && isActive && (
              <div className="ml-7 mt-1 flex flex-col gap-1">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      pathname === child.href
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
