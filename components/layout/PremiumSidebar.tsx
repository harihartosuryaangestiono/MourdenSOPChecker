"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coffee, 
  Home, 
  CheckSquare, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  FileText,
  Camera,
  Bell,
  ChevronLeft,
  ChevronRight,
  History
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PremiumSidebarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
  isOpen?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
}

export function PremiumSidebar({ user, isOpen = true, onToggle }: PremiumSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "staff":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getNavItems = (): NavItem[] => {
    const isOwnerOrAdmin = user?.role === "admin" || user?.role === "owner";
    const basePath = isOwnerOrAdmin ? `/${user.role}` : "/staff";
    
    const baseItems: NavItem[] = [
      {
        title: isOwnerOrAdmin ? "Dashboard" : "Home",
        href: basePath,
        icon: Home,
        description: "Overview and analytics"
      }
    ];

    if (isOwnerOrAdmin) {
      baseItems.push(
        {
          title: "Monitor Tasks",
          href: "/admin/monitor",
          icon: BarChart3,
          description: "Monitor daily execution",
        },
        {
          title: "Manage SOP",
          href: "/admin/sop",
          icon: CheckSquare,
          description: "Manage templates & tasks",
        },
        {
          title: "Analytics",
          href: "/owner/analytics",
          icon: TrendingUp,
          description: "Performance metrics"
        },
        {
          title: "Staff",
          href: "/admin/staff",
          icon: Users,
          description: "Team management"
        },
        {
          title: "Reports",
          href: "/admin/reports",
          icon: FileText,
          description: "Generate reports"
        }
      );
    } else {
      // Staff specific nav items
      baseItems.push(
        {
          title: "Tasks",
          href: "/staff/tasks",
          icon: CheckSquare,
          description: "Manage SOP tasks",
          badge: "Today"
        },
        {
          title: "History",
          href: "/staff/history",
          icon: History,
          description: "Task history",
        },
        {
          title: "Profile",
          href: "/staff/profile",
          icon: Users,
          description: "User profile",
        }
      );
    }

    baseItems.push(
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Account preferences"
      }
    );

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-card/80 backdrop-blur-xl border-r border-border/50 z-50 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-72",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 text-white shadow-lg">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gradient-primary">CafeOps</h1>
                  <p className="text-xs text-muted-foreground">Operations Platform</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              {/* Mobile Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
              
              {/* Collapse Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* User Profile */}
          {!isCollapsed && user && (
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {getInitials(user.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs", getRoleColor(user.role))}
                  >
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "nav-item group relative",
                    isActive && "active",
                    isCollapsed && "justify-center px-2"
                  )}>
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.title}
                        {item.description && (
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-border/50 space-y-2">
            {!isCollapsed && (
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl">
                <Bell className="w-4 h-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">Notifications</p>
                  <p className="text-xs text-muted-foreground">3 new updates</p>
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
                isCollapsed && "justify-center px-2"
              )}
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && (
                <span className="ml-3">
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
