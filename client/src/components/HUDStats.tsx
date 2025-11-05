import { useState, useEffect } from "react";
import { Wifi, Clock, Globe, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface HUDStatsProps {
  socketConnected: boolean;
}

export default function HUDStats({ socketConnected }: HUDStatsProps) {
  const [ipAddress, setIpAddress] = useState<string>("---.---.---.---");
  const [latency, setLatency] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [location, setLocation] = useState<string>("Unknown");

  // Fetch IP address and location
  useEffect(() => {
    fetch('/api/connection-info')
      .then(res => res.json())
      .then(data => {
        setIpAddress(data.ip || "---.---.---.---");
        setLocation(data.location || "Unknown");
      })
      .catch(() => {
        setIpAddress("---.---.---.---");
      });
  }, []);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate latency tracking (will be replaced with real WebSocket ping/pong)
  useEffect(() => {
    if (!socketConnected) {
      setLatency(0);
      return;
    }

    const interval = setInterval(() => {
      // Simulate latency between 15-45ms for demo
      setLatency(Math.floor(15 + Math.random() * 30));
    }, 2000);

    return () => clearInterval(interval);
  }, [socketConnected]);

  const getLatencyColor = () => {
    if (!socketConnected) return "text-destructive";
    if (latency < 30) return "text-success";
    if (latency < 60) return "text-primary";
    return "text-accent";
  };

  const getLatencyStatus = () => {
    if (!socketConnected) return "OFFLINE";
    if (latency < 30) return "OPTIMAL";
    if (latency < 60) return "GOOD";
    return "FAIR";
  };

  return (
    <div className="space-y-2">
      {/* System Status Header */}
      <div className="flex items-center justify-between">
        <h3 
          className="text-[10px] font-bold uppercase tracking-widest text-primary"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          SYSTEM STATUS
        </h3>
        <div className={cn(
          "w-2 h-2 rounded-full neon-pulse",
          socketConnected ? "bg-success" : "bg-destructive"
        )} />
      </div>

      {/* Stats Grid */}
      <div className="space-y-2.5">
        {/* IP Address */}
        <div className="flex items-start justify-between group">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/30 group-hover:border-primary/60 transition-colors">
              <Globe className="w-3 h-3 text-primary" />
            </div>
            <div>
              <div 
                className="text-[9px] uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                IP ADDRESS
              </div>
              <div 
                className="text-xs font-mono text-foreground"
                data-testid="hud-ip-address"
              >
                {ipAddress}
              </div>
            </div>
          </div>
        </div>

        {/* Latency */}
        <div className="flex items-start justify-between group">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/30 group-hover:border-primary/60 transition-colors">
              <Activity className="w-3 h-3 text-primary" />
            </div>
            <div>
              <div 
                className="text-[9px] uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                LATENCY
              </div>
              <div 
                className={cn("text-xs font-mono", getLatencyColor())}
                data-testid="hud-latency"
              >
                {socketConnected ? `${latency}ms` : "---ms"}
              </div>
            </div>
          </div>
          <span 
            className={cn(
              "text-[8px] uppercase px-1.5 py-0.5 rounded-sm border",
              getLatencyColor(),
              "border-current/30 bg-current/10"
            )}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {getLatencyStatus()}
          </span>
        </div>

        {/* Connection Status */}
        <div className="flex items-start justify-between group">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/30 group-hover:border-primary/60 transition-colors">
              <Wifi className="w-3 h-3 text-primary" />
            </div>
            <div>
              <div 
                className="text-[9px] uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                CONNECTION
              </div>
              <div className="text-xs text-foreground">
                {location}
              </div>
            </div>
          </div>
        </div>

        {/* Local Time */}
        <div className="flex items-start justify-between group">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/30 group-hover:border-primary/60 transition-colors">
              <Clock className="w-3 h-3 text-primary" />
            </div>
            <div>
              <div 
                className="text-[9px] uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                LOCAL TIME
              </div>
              <div 
                className="text-xs font-mono text-foreground tabular-nums"
                data-testid="hud-local-time"
              >
                {currentTime || "--:--:--"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Stream Effect */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mt-3 animate-pulse" />
    </div>
  );
}
