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
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  friend: {
    name: string;
    avatar?: string;
    status: "online" | "away" | "offline";
  };
  isConnected?: boolean;
  onSettings?: () => void;
  onClearMessages?: () => void;
}

const statusLabels = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

const statusColors = {
  online: "text-success",
  away: "text-secondary",
  offline: "text-muted-foreground",
};

export default function ChatHeader({ friend, isConnected = true, onSettings, onClearMessages }: ChatHeaderProps) {
  const hasMenuItems = !!(onSettings || onClearMessages);
  
  return (
    <header className="h-16 border-b border-primary/20 bg-sidebar/50 backdrop-blur-sm px-6 flex items-center justify-between gap-4 gradient-border-b relative">
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/30" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/30" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/30" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/30" />
      
      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
        <div className="relative">
          <UserAvatar name={friend.name} src={friend.avatar} size="md" status={friend.status} />
          {friend.status === "online" && (
            <div className="absolute inset-0 rounded-full neon-glow-cyan opacity-40 pointer-events-none" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base truncate uppercase tracking-wide text-primary" data-testid="text-friend-name" style={{ fontFamily: 'var(--font-display)' }}>
              {friend.name}
            </h2>
            
            {/* Connection Status Indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "w-2 h-2 rounded-full transition-colors shrink-0",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                )}
                data-testid="connection-status"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="glass-panel border-primary/30">
                <p className="text-xs uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                  {isConnected ? "Connected" : "Disconnected"}
                </p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-primary/10 text-primary shrink-0 border border-primary/30 neon-glow-cyan" data-testid="encryption-badge">
                  <Lock className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>E2E</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="glass-panel border-primary/30">
                <p className="text-xs uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>End-to-end encrypted with Signal Protocol</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className={`text-[10px] uppercase tracking-widest font-medium ${statusColors[friend.status]}`} style={{ fontFamily: 'var(--font-display)' }}>
            {friend.status === "online" && "● "}{statusLabels[friend.status]}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 relative z-10">
        {hasMenuItems && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" data-testid="button-menu" className="neon-glow-cyan">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-panel border-primary/30">
              {onClearMessages && (
                <DropdownMenuItem onClick={onClearMessages} data-testid="menu-item-clear" className="uppercase text-xs tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                  Clear messages
                </DropdownMenuItem>
              )}
              {onSettings && (
                <DropdownMenuItem onClick={onSettings} data-testid="menu-item-settings" className="uppercase text-xs tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
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
