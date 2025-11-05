import { useState, useEffect } from "react";
import { Shield, Key, Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export default function SecurityMonitor() {
  const [threatLevel, setThreatLevel] = useState(1);
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  // Simulate threat level fluctuation for visual effect
  useEffect(() => {
    const interval = setInterval(() => {
      setThreatLevel(Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getThreatColor = () => {
    switch (threatLevel) {
      case 1: return "text-green-400";
      case 2: return "text-yellow-400";
      case 3: return "text-orange-400";
      default: return "text-green-400";
    }
  };

  const getThreatLabel = () => {
    switch (threatLevel) {
      case 1: return "Minimal";
      case 2: return "Low";
      case 3: return "Moderate";
      default: return "Minimal";
    }
  };

  const securityItems = [
    {
      icon: Shield,
      label: "E2E Encryption",
      status: "Active",
      statusColor: "text-green-400",
      online: true
    },
    {
      icon: Key,
      label: "Signal Keys",
      status: "Valid",
      statusColor: "text-green-400",
      online: true
    },
    {
      icon: Lock,
      label: "Session Lock",
      status: "Enabled",
      statusColor: "text-green-400",
      online: true
    },
  ];

  return (
    <div className="h-full flex flex-col p-3 gap-3 bg-background/5">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <Shield className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-primary/70 uppercase tracking-wider font-mono">
          Security Monitor
        </span>
      </div>

      {/* Threat Level Display */}
      <div className={cn(
        "relative p-3 rounded border",
        threatLevel === 1 && "border-green-500/30 bg-green-950/20",
        threatLevel === 2 && "border-yellow-500/30 bg-yellow-950/20",
        threatLevel === 3 && "border-orange-500/30 bg-orange-950/20"
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-mono">
            Threat Level
          </span>
          {threatLevel === 1 ? (
            <CheckCircle className={cn("h-4 w-4", getThreatColor())} />
          ) : (
            <AlertTriangle className={cn("h-4 w-4 animate-pulse", getThreatColor())} />
          )}
        </div>
        <div className={cn("text-2xl font-bold font-mono", getThreatColor())}>
          {getThreatLabel().toUpperCase()}
        </div>
        
        {/* Threat meter bars */}
        <div className="flex gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1 rounded-full transition-all duration-500",
                i < threatLevel
                  ? `bg-${getThreatColor().split('-')[1]}-400`
                  : "bg-gray-700"
              )}
              style={{
                backgroundColor: i < threatLevel ? 
                  (threatLevel === 1 ? 'rgb(74 222 128)' : 
                   threatLevel === 2 ? 'rgb(250 204 21)' : 
                   'rgb(251 146 60)') : 'rgb(55 65 81)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Security Systems */}
      <div className="flex-1 space-y-2">
        {securityItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-2 rounded",
                "border border-primary/20 bg-black/40",
                "hover:border-primary/40 transition-all duration-300",
                "group"
              )}
              data-testid={`security-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn(
                  "h-3 w-3",
                  item.statusColor,
                  item.online && "animate-pulse"
                )} />
                <span className="text-xs font-mono">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-mono uppercase tracking-wide",
                  item.statusColor
                )}>
                  {item.status}
                </span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  item.online ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" : "bg-gray-600",
                  item.online && "animate-pulse"
                )} />
              </div>
            </div>
          );
        })}
      </div>

      {/* User session info */}
      {user && (
        <div className="p-2 rounded border border-primary/20 bg-black/40">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-mono mb-1">
            Authenticated As
          </div>
          <div className="text-xs font-mono text-primary truncate">
            {user.email}
          </div>
        </div>
      )}

      {/* Scanning animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan-horizontal" style={{ animationDuration: '3s' }} />
      </div>
    </div>
  );
}
