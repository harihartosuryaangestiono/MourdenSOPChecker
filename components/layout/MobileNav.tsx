"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, History, User, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const staffNavItems = [
  { href: "/staff/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/staff/history", label: "History", icon: History },
  { href: "/staff/profile", label: "Profile", icon: User },
];

const adminNavItems = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/monitor", label: "Monitor", icon: BarChart3 },
  { href: "/admin/sop", label: "SOP", icon: ClipboardList },
  { href: "/admin/staff", label: "Staff", icon: Settings },
];

const ownerNavItems = [
  { href: "/owner", label: "Overview", icon: Home },
  { href: "/admin/monitor", label: "Monitor", icon: BarChart3 },
  { href: "/admin/sop", label: "SOP", icon: ClipboardList },
  { href: "/admin/staff", label: "Staff", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isStaff, isAdmin, isOwner } = useAuth();

  const navItems = isStaff ? staffNavItems : isOwner ? ownerNavItems : isAdmin ? adminNavItems : staffNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive 
                  ? "text-brand-gold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
