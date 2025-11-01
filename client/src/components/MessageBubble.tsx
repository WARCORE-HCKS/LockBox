import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
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
  onDelete?: (messageId: string) => void;
}

export default function MessageBubble({
  id,
  content,
  sender,
  timestamp,
  isOwn = false,
  showAvatar = true,
  onDelete,
}: MessageBubbleProps) {
  return (
    <div
      className={cn("flex gap-3 mb-2 group", isOwn && "flex-row-reverse")}
      data-testid={`message-${isOwn ? "own" : "other"}`}
    >
      {showAvatar && !isOwn && (
        <UserAvatar name={sender.name} src={sender.avatar} size="sm" />
      )}
      {!showAvatar && !isOwn && <div className="w-8" />}

      <div className={cn("flex flex-col gap-1 max-w-[65%]", isOwn && "items-end")}>
        {showAvatar && !isOwn && (
          <span className="text-xs font-semibold px-1" data-testid="text-sender-name">
            {sender.name}
          </span>
        )}
        <div className="relative">
          <div
            className={cn(
              "py-3 px-4 rounded-md break-words",
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-card text-card-foreground border border-card-border"
            )}
          >
            <p className="text-[15px] leading-relaxed" data-testid="text-message-content">
              {content}
            </p>
          </div>
          {isOwn && onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm",
                isOwn && "hover:bg-destructive hover:text-destructive-foreground"
              )}
              onClick={() => onDelete(id)}
              data-testid={`button-delete-message-${id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground px-1" data-testid="text-timestamp">
          {format(timestamp, "h:mm a")}
        </span>
      </div>
    </div>
  );
}
