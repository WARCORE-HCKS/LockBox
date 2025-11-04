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
        <UserAvatar name={sender.name} src={sender.avatar} size="sm" />
      )}
      {!showAvatar && !isOwn && <div className="w-8" />}

      <div className={cn("flex flex-col gap-1 max-w-[70%]", isOwn && "items-end")}>
        {showAvatar && !isOwn && (
          <div className="flex items-center gap-2 px-1 mb-0.5">
            <span className="text-sm font-semibold text-foreground" data-testid="text-sender-name">
              {sender.name}
            </span>
            {isOwner && (
              <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500" data-testid="icon-chatroom-owner" />
            )}
          </div>
        )}
        <div className="relative">
          <div
            className={cn(
              "py-2.5 px-4 break-words shadow-sm",
              isOwn
                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                : "bg-card text-card-foreground border border-card-border rounded-2xl rounded-tl-sm"
            )}
          >
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap" data-testid="text-message-content">
              {content}
            </p>
          </div>
          {isOwn && onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm"
              onClick={() => onDelete(id)}
              data-testid={`button-delete-message-${id}`}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground px-2 opacity-70" data-testid="text-timestamp">
          {format(timestamp, "h:mm a")}
        </span>
      </div>
    </div>
  );
}
