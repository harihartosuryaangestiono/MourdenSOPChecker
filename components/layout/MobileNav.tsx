"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Home, ClipboardList, History, User, BarChart3, Users, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

const staffNav = [
  { href: "/staff/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/staff/history", label: "History", icon: History },
  { href: "/staff", label: "Home", icon: Home },
  { href: "/staff/profile", label: "Profile", icon: User },
];

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/monitor", label: "Monitor", icon: BarChart3 },
  { href: "/admin/sop", label: "SOP", icon: ClipboardList },
  { href: "/admin/staff", label: "Staff", icon: Users },
];

const ownerNav = [
  { href: "/owner", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/monitor", label: "Monitor", icon: BarChart3 },
  { href: "/admin/sop", label: "SOP", icon: ClipboardList },
  { href: "/admin/staff", label: "Staff", icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isStaff, isAdmin, isOwner } = useAuth();
  const nav = isStaff ? staffNav : isOwner ? ownerNav : isAdmin ? adminNav : staffNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href.length > 1 && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 min-w-0"
              >
                <motion.div whileTap={{ scale: 0.82 }} className="flex flex-col items-center gap-1">
                  {active && (
                    <motion.div
                      layoutId="mobile-pill"
                      className="absolute top-1 w-10 h-10 rounded-full bg-primary/10"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "w-5 h-5 relative z-10 transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium relative z-10 transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
