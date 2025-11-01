import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import UserAvatar from "./UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  friend: {
    name: string;
    avatar?: string;
    status: "online" | "away" | "offline";
  };
  onSettings?: () => void;
  onClearMessages?: () => void;
}

const statusLabels = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

export default function ChatHeader({ friend, onSettings, onClearMessages }: ChatHeaderProps) {
  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <UserAvatar name={friend.name} src={friend.avatar} size="md" status={friend.status} />
        <div>
          <h2 className="font-semibold text-base" data-testid="text-friend-name">
            {friend.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            {statusLabels[friend.status]}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-menu">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onClearMessages && (
              <DropdownMenuItem onClick={onClearMessages} data-testid="menu-item-clear">
                Clear messages
              </DropdownMenuItem>
            )}
            {onSettings && (
              <DropdownMenuItem onClick={onSettings} data-testid="menu-item-settings">
                Settings
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
