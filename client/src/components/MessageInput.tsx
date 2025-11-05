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
    <div className="border-t border-primary/20 bg-sidebar/30 backdrop-blur-sm p-4 relative">
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/30" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/30" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/30" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/30" />
      
      <div className="flex items-end gap-2 relative z-10">
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 mb-px neon-glow-cyan"
              data-testid="button-emoji"
            >
              <Smile className="h-5 w-5 text-primary" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 glass-panel border-primary/30" align="start" data-testid="emoji-picker">
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                <div key={category}>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 sticky top-0 bg-popover/90 backdrop-blur-sm py-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {category}
                  </h4>
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-2xl hover-elevate active-elevate-2 rounded-sm p-1.5 transition-colors border border-transparent hover:border-primary/30"
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
            "border-primary/30 bg-background/50 backdrop-blur-sm rounded-sm transition-all",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:neon-glow-cyan",
            "placeholder:text-muted-foreground/40 placeholder:uppercase placeholder:text-xs placeholder:tracking-wide"
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
          rows={1}
          data-testid="input-message"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="shrink-0 mb-px bg-primary/20 hover:bg-primary/30 border border-primary/40 neon-glow-cyan text-primary hover:text-primary-foreground"
          data-testid="button-send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
