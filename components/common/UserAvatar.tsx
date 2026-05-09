"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
}

export function UserAvatar({ name, avatarUrl, className }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl} alt={name} />
      <AvatarFallback className="bg-brand-navy text-white text-xs font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
