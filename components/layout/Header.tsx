"use client";

import { useShift } from "@/hooks/useShift";
import { useAuth } from "@/hooks/useAuth";
import { getGreeting, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Clock } from "lucide-react";

interface HeaderProps {
  showGreeting?: boolean;
}

export function Header({ showGreeting = true }: HeaderProps) {
  const { user } = useAuth();
  const { shift, label, timeRange, currentTime } = useShift();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {showGreeting && user && (
            <div>
              <h1 className="font-display text-lg font-semibold">
                {getGreeting()}, {user.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatDate(new Date())}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </Badge>
          
          <Badge className="bg-brand-gold/10 text-brand-gold-dark border-brand-gold/20">
            {label} • {timeRange}
          </Badge>

          {user && (
            <UserAvatar 
              name={user.name} 
              avatarUrl={user.avatar_url}
              className="h-9 w-9"
            />
          )}
        </div>
      </div>
    </header>
  );
}
