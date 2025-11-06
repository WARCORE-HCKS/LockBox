import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "lockbox-cyber-notes";

export default function CyberNotes() {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setNotes(saved);
    }
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, notes);
      setIsSaving(true);
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 500);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [notes]);

  return (
    <div className="h-full flex flex-col p-3 gap-2 bg-background/5">
      {/* Header with status */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <FileText className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-primary/70 uppercase tracking-wider font-mono">
            Encrypted Notes
          </span>
        </div>
        <div className={cn(
          "flex items-center gap-1 transition-all duration-300",
          isSaving && "text-primary"
        )}>
          <Save className={cn("h-3 w-3", isSaving && "animate-pulse")} />
          <span className="font-mono">
            {isSaving ? "Saving..." : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ""}
          </span>
        </div>
      </div>

      {/* Notes textarea with cyber styling */}
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="// Enter encrypted notes here...\n// All data is stored locally"
        className={cn(
          "flex-1 resize-none font-mono text-xs",
          "bg-muted/30 dark:bg-black/40 border-primary/30",
          "text-foreground placeholder:text-muted-foreground",
          "focus-visible:border-primary focus-visible:ring-primary/20",
          "focus-visible:shadow-[0_0_15px_rgba(0,255,255,0.3)]",
          "transition-all duration-300"
        )}
        data-testid="textarea-cyber-notes"
      />

      {/* Glowing scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-scan-line" />
      </div>
    </div>
  );
}
