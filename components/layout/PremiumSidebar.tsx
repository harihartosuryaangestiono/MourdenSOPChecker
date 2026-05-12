"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, BarChart3, Users, Settings, LogOut, X,
  TrendingUp, FileText, Bell, ChevronLeft, ChevronRight,
  History, LayoutDashboard, ClipboardList, UserCog, Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PremiumSidebarProps {
  user?: { id: string; name: string; email: string; role: string; avatar_url?: string };
  isOpen?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export function PremiumSidebar({ user, isOpen = true, onToggle }: PremiumSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      setIsLoggingOut(false);
    }
  };

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const getNavItems = (): NavItem[] => {
    const isAdm = user?.role === "admin" || user?.role === "owner";
    const basePath = isAdm ? "/" + (user?.role ?? "admin") : "/staff";
    const items: NavItem[] = [
      { title: isAdm ? "Dashboard" : "Home", href: basePath, icon: LayoutDashboard }
    ];
    if (isAdm) {
      items.push(
        { title: "Monitor", href: "/admin/monitor", icon: BarChart3 },
        { title: "SOP Tasks", href: "/admin/sop", icon: ClipboardList },
        { title: "Analytics", href: "/owner/analytics", icon: TrendingUp },
        { title: "Staff", href: "/admin/staff", icon: Users },
        { title: "Reports", href: "/admin/reports", icon: FileText }
      );
    } else {
      items.push(
        { title: "My Tasks", href: "/staff/tasks", icon: CheckSquare, badge: "Today" },
        { title: "History", href: "/staff/history", icon: History },
        { title: "Profile", href: "/staff/profile", icon: UserCog }
      );
    }
    items.push({ title: "Settings", href: "/settings", icon: Settings });
    return items;
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: isCollapsed ? 64 : 264 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className={cn(
          "fixed left-0 top-0 h-full z-50 flex flex-col overflow-hidden",
          "bg-card border-r border-border/50",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between h-14 px-3 border-b border-border/40 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
              <Image src="/logo.png" alt="Mourden" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0"
                >
                  <p className="text-sm font-bold tracking-tight text-foreground leading-none">MourdenOps</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Café Operations</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          <div className="flex items-center flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={onToggle} className="lg:hidden h-7 w-7">
              <X className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex h-7 w-7"
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {!isCollapsed && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-3 py-3 border-b border-border/40 flex-shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{initials(user.name)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate leading-none">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{user.role}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {getNavItems().map((item) => {
            const active = pathname === item.href || (item.href.length > 1 && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors duration-150 group cursor-pointer",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", active && "text-primary")} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 min-w-0 flex items-center justify-between"
                      >
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="sidebar-pill"
                      className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 z-50 pointer-events-none">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-popover border border-border text-popover-foreground text-xs font-medium px-2 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                        {item.title}
                      </div>
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border/40 space-y-1 flex-shrink-0">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-primary/[0.05] border border-primary/10 mb-1">
                  <div className="relative">
                    <Bell className="w-3.5 h-3.5 text-primary" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-destructive rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">3 updates</p>
                    <p className="text-[10px] text-muted-foreground">Pending reviews</p>
                  </div>
                  <Sparkles className="w-3 h-3 text-primary/50" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium",
              "text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-[18px] h-[18px]" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
