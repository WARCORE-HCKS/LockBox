import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const EMOJI_CATEGORIES = {
  "Smileys": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳"],
  "Gestures": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏"],
  "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
  "Reactions": ["🔥", "⭐", "✨", "💫", "💥", "💯", "✅", "❌", "⚠️", "❗", "❓", "💬", "💭", "🎉", "🎊", "🎈"],
};

export default function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

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

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setEmojiOpen(false);
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 mb-px"
              data-testid="button-emoji"
            >
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start" data-testid="emoji-picker">
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hidden">
              {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 sticky top-0 bg-popover py-1">
                    {category}
                  </h4>
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-2xl hover-elevate active-elevate-2 rounded-md p-1.5 transition-colors"
                        data-testid={`emoji-${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "resize-none min-h-[44px] max-h-[120px] text-[15px]",
            "border-input bg-card rounded-xl transition-shadow",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
          )}
          rows={1}
          data-testid="input-message"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="shrink-0 mb-px"
          data-testid="button-send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
