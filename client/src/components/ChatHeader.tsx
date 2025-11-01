import { Button } from "@/components/ui/button";
import { Lock, MoreVertical, Phone, Video } from "lucide-react";
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
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onSettings?: () => void;
}

export default function ChatHeader({ friend, onVoiceCall, onVideoCall, onSettings }: ChatHeaderProps) {
  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <UserAvatar name={friend.name} src={friend.avatar} size="md" status={friend.status} />
        <div>
          <h2 className="font-semibold text-base" data-testid="text-friend-name">
            {friend.name}
          </h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            <span>End-to-end encrypted</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={onVoiceCall}
          data-testid="button-voice-call"
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onVideoCall}
          data-testid="button-video-call"
        >
          <Video className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-menu">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSettings} data-testid="menu-item-settings">
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-item-clear">Clear messages</DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-item-block" className="text-destructive">
              Block user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
