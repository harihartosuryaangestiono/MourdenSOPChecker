import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ name, avatarUrl, className, size = "md" }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizes = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("rounded-full object-cover ring-1 ring-border/50", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
