import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0"
          onClick={() => console.log("Emoji picker clicked")}
          data-testid="button-emoji"
        >
          <Smile className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0"
          onClick={() => console.log("Attachment clicked")}
          data-testid="button-attachment"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("resize-none min-h-[44px] max-h-[120px] text-[15px]")}
          rows={1}
          data-testid="input-message"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="shrink-0"
          data-testid="button-send"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
