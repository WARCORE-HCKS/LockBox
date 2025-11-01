import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "away" | "offline";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const statusDotSize = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

export default function UserAvatar({ src, name, size = "md", status, className }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(sizeClasses[size])}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      {status && status !== "offline" && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            statusDotSize[size],
            status === "online" && "bg-status-online",
            status === "away" && "bg-status-away"
          )}
          data-testid={`status-${status}`}
        />
      )}
    </div>
  );
}
