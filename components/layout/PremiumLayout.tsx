"use client";

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
