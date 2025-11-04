import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import { format } from "date-fns";
import { Trash2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  id: string;
  content: string;
  sender: {
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  isOwn?: boolean;
  showAvatar?: boolean;
  isOwner?: boolean;
  onDelete?: (messageId: string) => void;
}

export default function MessageBubble({
  id,
  content,
  sender,
  timestamp,
  isOwn = false,
  showAvatar = true,
  isOwner = false,
  onDelete,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-3 group",
        isOwn ? "flex-row-reverse mb-2" : "mb-3",
        showAvatar && !isOwn && "mt-4"
      )}
      data-testid={`message-${isOwn ? "own" : "other"}`}
    >
      {showAvatar && !isOwn && (
        <div className="relative">
          <UserAvatar name={sender.name} src={sender.avatar} size="sm" />
          <div className="absolute inset-0 rounded-full neon-glow-cyan opacity-30 pointer-events-none" />
        </div>
      )}
      {!showAvatar && !isOwn && <div className="w-8" />}

      <div className={cn("flex flex-col gap-1 max-w-[70%]", isOwn && "items-end")}>
        {showAvatar && !isOwn && (
          <div className="flex items-center gap-2 px-1 mb-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary" data-testid="text-sender-name" style={{ fontFamily: 'var(--font-display)' }}>
              {sender.name}
            </span>
            {isOwner && (
              <Crown className="h-3.5 w-3.5 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" data-testid="icon-chatroom-owner" />
            )}
          </div>
        )}
        <div className="relative">
          <div
            className={cn(
              "py-2.5 px-4 break-words message-bubble-cut relative",
              isOwn
                ? "bg-gradient-to-br from-[#1a0f1a] to-[#150a15] border border-secondary/30 neon-glow-magenta"
                : "bg-gradient-to-br from-[#0f1a1a] to-[#0a1515] border border-primary/30 neon-glow-cyan"
            )}
          >
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground relative z-10" data-testid="text-message-content">
              {content}
            </p>
            <div className={cn(
              "absolute inset-0 opacity-5 pointer-events-none message-bubble-cut",
              isOwn ? "bg-secondary" : "bg-primary"
            )} />
          </div>
          {isOwn && onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 border border-destructive/40 neon-glow-pink backdrop-blur-sm"
              onClick={() => onDelete(id)}
              data-testid={`button-delete-message-${id}`}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
        <span 
          className="text-[10px] text-muted-foreground px-2 opacity-60 uppercase tracking-widest" 
          data-testid="text-timestamp"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {format(timestamp, "HH:mm")}
        </span>
      </div>
    </div>
  );
}
