import { Zap, Shield, MessageSquare, Users, Settings, LogOut, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QuickCommandProps {
  onNewChatroom?: () => void;
  onSecurityScan?: () => void;
}

export default function QuickCommand({ onNewChatroom, onSecurityScan }: QuickCommandProps) {
  const { toast } = useToast();

  const commands = [
    {
      icon: MessageSquare,
      label: "New Chat",
      action: () => {
        if (onNewChatroom) onNewChatroom();
        else toast({ title: "Quick Action", description: "Create new chatroom" });
      },
      color: "text-primary",
      glow: "neon-glow-cyan",
    },
    {
      icon: Shield,
      label: "Security Scan",
      action: () => {
        if (onSecurityScan) onSecurityScan();
        else toast({ title: "Security Scan", description: "Running system diagnostics..." });
      },
      color: "text-secondary",
      glow: "neon-glow-magenta",
    },
    {
      icon: Users,
      label: "Find Users",
      action: () => toast({ title: "User Search", description: "Searching network..." }),
      color: "text-primary",
      glow: "neon-glow-cyan",
    },
    {
      icon: Lock,
      label: "Lock Session",
      action: () => toast({ title: "Session Lock", description: "Session secured" }),
      color: "text-destructive",
      glow: "neon-glow-pink",
    },
    {
      icon: Unlock,
      label: "Unlock",
      action: () => toast({ title: "Session Unlock", description: "Session unlocked" }),
      color: "text-accent",
      glow: "neon-glow-cyan",
    },
    {
      icon: Settings,
      label: "Settings",
      action: () => toast({ title: "Settings", description: "Opening control panel..." }),
      color: "text-muted-foreground",
      glow: "neon-glow-cyan",
    },
  ];

  return (
    <div className="h-full w-full overflow-auto p-4 relative">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }} />
      </div>

      {/* Title */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-primary animate-energy-pulse" />
          <h3 
            className="text-sm font-bold uppercase tracking-widest text-primary"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Quick Commands
          </h3>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
          Execute rapid actions
        </p>
      </div>

      {/* Command Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3">
        {commands.map((command, index) => (
          <div key={index} className="group relative">
            {/* Expanding Corner Brackets */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/30 group-hover:w-3 group-hover:h-3 group-hover:border-primary transition-all duration-200 pointer-events-none z-10" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/30 group-hover:w-3 group-hover:h-3 group-hover:border-primary transition-all duration-200 pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/30 group-hover:w-3 group-hover:h-3 group-hover:border-primary transition-all duration-200 pointer-events-none z-10" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/30 group-hover:w-3 group-hover:h-3 group-hover:border-primary transition-all duration-200 pointer-events-none z-10" />

            <Button
              variant="ghost"
              onClick={command.action}
              data-testid={`button-quick-${command.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                "relative w-full h-auto p-4 rounded-sm border border-primary/20 bg-sidebar/50 backdrop-blur-sm",
                "hover-elevate active-elevate-2",
                "flex flex-col items-center justify-center gap-2",
                command.glow
              )}
            >
              {/* Icon */}
              <div className={cn(
                "relative p-2 rounded-sm border border-primary/20 bg-background/50",
                "group-hover:border-primary transition-all duration-200"
              )}>
                <command.icon className={cn("h-5 w-5", command.color, "group-hover:animate-energy-pulse")} />
                
                {/* Icon Glow */}
                <div className={cn(
                  "absolute inset-0 rounded-sm opacity-0 group-hover:opacity-50 blur-md transition-opacity",
                  command.color.replace('text-', 'bg-')
                )} />
              </div>

              {/* Label */}
              <span 
                className={cn(
                  "text-[10px] uppercase tracking-widest font-bold",
                  command.color,
                  "group-hover:text-primary transition-colors"
                )}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {command.label}
              </span>

              {/* Energy Pulse Effect */}
              <div className={cn(
                "absolute inset-0 rounded-sm border-2 border-primary/0",
                "group-hover:border-primary/30 group-hover:animate-energy-pulse pointer-events-none"
              )} />
            </Button>
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="relative z-10 mt-6 p-3 rounded-sm border border-primary/20 bg-sidebar/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
              System Ready
            </span>
          </div>
          <span className="text-[9px] text-primary uppercase tracking-widest font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {commands.length} Commands
          </span>
        </div>
      </div>

      {/* Scanning Line Animation */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan-horizontal pointer-events-none" />
    </div>
  );
}
