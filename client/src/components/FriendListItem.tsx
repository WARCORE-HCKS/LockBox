import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";

interface FriendListItemProps {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  lastMessage?: string;
  unreadCount?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export default function FriendListItem({
  name,
  avatar,
  status,
  lastMessage,
  unreadCount,
  isActive,
  onClick,
}: FriendListItemProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 h-auto py-3 px-4 rounded-md",
        isActive && "bg-sidebar-accent"
      )}
      onClick={onClick}
      data-testid={`friend-item-${name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <UserAvatar name={name} src={avatar} size="md" status={status} />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{name}</span>
          {unreadCount && unreadCount > 0 && (
            <span
              className="bg-primary text-primary-foreground text-xs font-medium rounded-full min-w-5 h-5 flex items-center justify-center px-1.5"
              data-testid={`unread-count-${name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {lastMessage && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMessage}</p>
        )}
      </div>
    </Button>
  );
}
