import { useState } from "react";
import { X, Minimize2, Maximize2, Move, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DraggablePanelProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onLock?: () => void;
  isMinimized?: boolean;
  isLocked?: boolean;
  className?: string;
  headerClassName?: string;
  showCloseButton?: boolean;
  showMinimizeButton?: boolean;
  showLockButton?: boolean;
}

export default function DraggablePanel({
  title,
  children,
  onClose,
  onMinimize,
  onLock,
  isMinimized = false,
  isLocked = false,
  className,
  headerClassName,
  showCloseButton = true,
  showMinimizeButton = true,
  showLockButton = true,
}: DraggablePanelProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar/95 backdrop-blur-sm border rounded-sm relative overflow-hidden transition-all duration-300",
        isLocked ? "border-secondary/50 shadow-lg shadow-secondary/20" : "border-primary/20",
        isMinimized ? "h-auto" : "h-full",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Corner Brackets - Glow when locked */}
      <div className={cn(
        "absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-all duration-200",
        isLocked 
          ? "border-secondary w-4 h-4 shadow-[0_0_8px_rgba(255,0,255,0.6)]" 
          : isHovered ? "border-primary w-4 h-4" : "border-primary/40"
      )} />
      <div className={cn(
        "absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-all duration-200",
        isLocked 
          ? "border-secondary w-4 h-4 shadow-[0_0_8px_rgba(255,0,255,0.6)]" 
          : isHovered ? "border-primary w-4 h-4" : "border-primary/40"
      )} />
      <div className={cn(
        "absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-all duration-200",
        isLocked 
          ? "border-secondary w-4 h-4 shadow-[0_0_8px_rgba(255,0,255,0.6)]" 
          : isHovered ? "border-primary w-4 h-4" : "border-primary/40"
      )} />
      <div className={cn(
        "absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-all duration-200",
        isLocked 
          ? "border-secondary w-4 h-4 shadow-[0_0_8px_rgba(255,0,255,0.6)]" 
          : isHovered ? "border-primary w-4 h-4" : "border-primary/40"
      )} />

      {/* Panel Header */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2 border-b relative z-10 bg-sidebar/50 backdrop-blur-sm",
        isLocked ? "border-secondary/30 cursor-not-allowed" : "border-primary/20 cursor-move",
        headerClassName
      )}>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Lock className="h-3 w-3 text-secondary animate-pulse" />
          ) : (
            <Move className="h-3 w-3 text-primary opacity-60" />
          )}
          <h3 
            className={cn(
              "text-xs font-bold uppercase tracking-widest",
              isLocked ? "text-secondary" : "text-primary"
            )}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h3>
          {isLocked && (
            <span className="text-[8px] uppercase tracking-widest text-secondary/60 ml-1" style={{ fontFamily: 'var(--font-display)' }}>
              LOCKED
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 cursor-default">
          {showLockButton && onLock && (
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-6 w-6 cursor-pointer transition-colors",
                isLocked ? "hover:bg-secondary/10 neon-glow-magenta" : "hover:bg-primary/10"
              )}
              onClick={onLock}
              data-testid={`button-lock-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {isLocked ? (
                <Lock className="h-3 w-3 text-secondary" />
              ) : (
                <Unlock className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          )}
          {showMinimizeButton && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-primary/10 cursor-pointer"
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
              className="h-6 w-6 hover:bg-destructive/10 cursor-pointer"
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
          <div className="h-full w-full" style={{ transformOrigin: 'top left' }}>
            {children}
          </div>
        </div>
      )}

      {/* Holographic Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none animate-pulse-glow" />
    </div>
  );
}
