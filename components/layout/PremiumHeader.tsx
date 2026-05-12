"use client";

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
