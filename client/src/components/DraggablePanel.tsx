import { useState } from "react";
import { X, Minimize2, Maximize2, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DraggablePanelProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  className?: string;
  headerClassName?: string;
  showCloseButton?: boolean;
  showMinimizeButton?: boolean;
}

export default function DraggablePanel({
  title,
  children,
  onClose,
  onMinimize,
  isMinimized = false,
  className,
  headerClassName,
  showCloseButton = true,
  showMinimizeButton = true,
}: DraggablePanelProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-sidebar/95 backdrop-blur-sm border border-primary/20 rounded-sm relative overflow-hidden",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Corner Brackets */}
      <div className={cn(
        "absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-all duration-200",
        isHovered ? "border-primary w-4 h-4" : "border-primary/40"
      )} />
      <div className={cn(
        "absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-all duration-200",
        isHovered ? "border-primary w-4 h-4" : "border-primary/40"
      )} />
      <div className={cn(
        "absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-all duration-200",
        isHovered ? "border-primary w-4 h-4" : "border-primary/40"
      )} />
      <div className={cn(
        "absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-all duration-200",
        isHovered ? "border-primary w-4 h-4" : "border-primary/40"
      )} />

      {/* Panel Header */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2 border-b border-primary/20 relative z-10 bg-sidebar/50 backdrop-blur-sm",
        headerClassName
      )}>
        <div className="flex items-center gap-2 cursor-move">
          <Move className="h-3 w-3 text-primary opacity-60" />
          <h3 
            className="text-xs font-bold uppercase tracking-widest text-primary"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {showMinimizeButton && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-primary/10"
              onClick={onMinimize}
              data-testid={`button-minimize-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {isMinimized ? (
                <Maximize2 className="h-3 w-3 text-primary" />
              ) : (
                <Minimize2 className="h-3 w-3 text-primary" />
              )}
            </Button>
          )}
          {showCloseButton && onClose && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-destructive/10"
              onClick={onClose}
              data-testid={`button-close-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <X className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      {/* Panel Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden relative z-10">
          {children}
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="flex-1 flex items-center justify-center py-8 relative z-10">
          <p className="text-xs text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            Minimized
          </p>
        </div>
      )}

      {/* Holographic Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none animate-pulse-glow" />
    </div>
  );
}
