"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Coffee, 
  Sunrise, 
  Sun, 
  Moon, 
  Settings, 
  LogOut, 
  User, 
  Bell,
  Menu,
  X
} from "lucide-react";
import { getGreeting, getCurrentShift, getShiftLabel, getShiftTimeRange } from "@/lib/utils";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "./ThemeToggle";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  shift_preference?: string;
}

interface PremiumHeaderProps {
  user: User | null;
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
  showMobileMenu = false,
  onMobileMenuToggle,
  isMobileMenuOpen = false
}: PremiumHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const currentShift = getCurrentShift();
  const shiftIcon = {
    opening: <Sunrise className="w-4 h-4" />,
    middle: <Sun className="w-4 h-4" />,
    closing: <Moon className="w-4 h-4" />
  }[currentShift];

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

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            {showMobileMenu && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileMenuToggle}
                className="lg:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            )}

            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 text-white shadow-lg">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                {title && (
                  <h1 className="text-xl font-bold text-gradient-primary">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Shift Badge */}
            <Badge 
              variant="secondary" 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border-primary/20"
            >
              {shiftIcon}
              <span className="text-sm font-medium">
                {getShiftLabel(currentShift)}
              </span>
            </Badge>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar_url} alt={user?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                      {user?.name ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 card-premium border-0 shadow-xl"
              >
                <div className="px-4 py-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar_url} alt={user?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                      <div className="mt-1">
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", getRoleColor(user?.role || ""))}
                        >
                          {user?.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {shiftIcon}
                    <span>{getShiftLabel(currentShift)}</span>
                    <span>•</span>
                    <span>{getShiftTimeRange(currentShift)}</span>
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-border/50" />

                <DropdownMenuItem className="cursor-pointer">
                  <User className="w-4 h-4 mr-3 text-muted-foreground" />
                  Profile
                </DropdownMenuItem>
                
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                  Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border/50" />

                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
