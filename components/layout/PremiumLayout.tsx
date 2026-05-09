"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumSidebar } from "./PremiumSidebar";
import { PremiumHeader } from "./PremiumHeader";
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
  requireAuth = true 
}: PremiumLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (requireAuth) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [requireAuth]);

  const loadUserData = async () => {
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        
        setUser(userData);
      } else {
        // Redirect to login if not authenticated
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PremiumLoading />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      {showSidebar && user && (
        <PremiumSidebar 
          user={user}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      )}

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        showSidebar ? "lg:ml-72" : "ml-0"
      )}>
        {/* Header */}
        <PremiumHeader 
          user={user}
          title={title}
          subtitle={subtitle}
          showMobileMenu={showSidebar}
          onMobileMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isMobileMenuOpen={isSidebarOpen}
        />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
