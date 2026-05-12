const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function w(rel, code) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, code, 'utf8');
  console.log('✓', rel);
}

// ─── PremiumSidebar ────────────────────────────────────────────────────────────
w('components/layout/PremiumSidebar.tsx', `"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee, CheckSquare, BarChart3, Users, Settings, LogOut, X,
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
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 flex-shrink-0">
              <Coffee className="w-4 h-4 text-primary-foreground" />
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
`);

// ─── PremiumHeader ─────────────────────────────────────────────────────────────
w('components/layout/PremiumHeader.tsx', `"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumHeaderProps {
  user?: { id: string; name: string; email: string; role: string; avatar_url?: string } | null;
  title?: string;
  subtitle?: string;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function PremiumHeader({
  user,
  title,
  subtitle,
  showMobileMenu = true,
  onMobileMenuToggle,
}: PremiumHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6 transition-all duration-200",
        scrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-border/60 shadow-sm"
          : "bg-background border-b border-border/40"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {showMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="lg:hidden h-8 w-8 -ml-1"
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}
        <div className="min-w-0">
          {title && (
            <h1 className="text-sm font-semibold text-foreground truncate leading-tight">{title}</h1>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate leading-tight">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full ring-1 ring-background" />
        </Button>
        {user && (
          <div className="flex items-center gap-2 ml-1 pl-2 border-l border-border/50">
            <div className="w-7 h-7 rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-primary">{initials(user.name)}</span>
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-xs font-semibold text-foreground leading-none">{user.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize leading-tight">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
`);

// ─── MobileNav ─────────────────────────────────────────────────────────────────
w('components/layout/MobileNav.tsx', `"use client";

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
`);

// ─── PremiumLayout ─────────────────────────────────────────────────────────────
w('components/layout/PremiumLayout.tsx', `"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumSidebar } from "./PremiumSidebar";
import { PremiumHeader } from "./PremiumHeader";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";
import { PremiumLoading } from "@/components/common/PremiumLoading";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface PremiumLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showSidebar?: boolean;
  requireAuth?: boolean;
}

export function PremiumLayout({
  children,
  title,
  subtitle,
  showSidebar = true,
  requireAuth = true,
}: PremiumLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const sb = createClient();
        const { data: { user: au } } = await sb.auth.getUser();
        if (!au) { window.location.href = "/login"; return; }
        const { data } = await sb.from("users").select("*").eq("id", au.id).single();
        setUser(data as User);
      } catch {
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    })();
  }, [requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PremiumLoading />
      </div>
    );
  }

  if (requireAuth && !user) return null;

  return (
    <div className="min-h-screen bg-background">
      {showSidebar && user && (
        <PremiumSidebar
          user={user}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          showSidebar ? "lg:ml-[264px]" : "ml-0"
        )}
      >
        <PremiumHeader
          user={user}
          title={title}
          subtitle={subtitle}
          showMobileMenu={showSidebar}
          onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isMobileMenuOpen={sidebarOpen}
        />
        <main className="pb-20 lg:pb-0 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
      {showSidebar && <MobileNav />}
    </div>
  );
}
`);

console.log('Done! Layout components generated.');
