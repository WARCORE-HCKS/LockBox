import { Button } from "@/components/ui/button";
import { MoreVertical, Lock } from "lucide-react";
import UserAvatar from "./UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const hasMenuItems = !!(onSettings || onClearMessages);
  
  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <UserAvatar name={friend.name} src={friend.avatar} size="md" status={friend.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base truncate" data-testid="text-friend-name">
              {friend.name}
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0" data-testid="encryption-badge">
                  <Lock className="h-3 w-3" />
                  <span className="text-[10px] font-medium uppercase tracking-wide">E2E</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">End-to-end encrypted with Signal Protocol</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground">
            {statusLabels[friend.status]}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {hasMenuItems && (
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
        )}
      </div>
    </header>
  );
}
