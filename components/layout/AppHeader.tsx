"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Coffee, Sunrise, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

interface AppHeaderProps {
  user?: {
    name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
    shift?: string;
  };
  title?: string;
  subtitle?: string;
}

export function AppHeader({ user, title, subtitle }: AppHeaderProps) {
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Berhasil logout");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Gagal logout");
    }
  };

  const getShiftIcon = (shift?: string) => {
    switch (shift) {
      case "opening": return <Sunrise className="w-4 h-4 text-yellow-500" />;
      case "middle": return <Sun className="w-4 h-4 text-blue-500" />;
      case "closing": return <Moon className="w-4 h-4 text-indigo-500" />;
      default: return <Coffee className="w-4 h-4 text-gray-500" />;
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - Title */}
          <div className="flex items-center">
            <Coffee className="w-8 h-8 text-amber-600 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {title || "CafeOps"}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right Section - User Menu */}
          <div className="flex items-center space-x-4">
            {/* Shift Badge */}
            {user?.shift && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                {getShiftIcon(user.shift)}
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {user.shift} Shift
                </span>
              </div>
            )}

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar_url} alt={user?.name} />
                    <AvatarFallback className="bg-amber-100 text-amber-800 font-semibold">
                      {getInitials(user?.name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <div className="flex items-center pt-1">
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full capitalize">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
