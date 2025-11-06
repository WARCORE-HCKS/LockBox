import { useState, useEffect } from "react";
import { Cpu, HardDrive, Wifi, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SystemDiagnostics() {
  const [cpuUsage, setCpuUsage] = useState(45);
  const [memoryUsage, setMemoryUsage] = useState(68);
  const [networkLoad, setNetworkLoad] = useState(32);

  // Simulate fluctuating metrics for visual effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 40) + 30); // 30-70%
      setMemoryUsage(Math.floor(Math.random() * 30) + 50); // 50-80%
      setNetworkLoad(Math.floor(Math.random() * 50) + 20); // 20-70%
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getUsageColor = (usage: number) => {
    if (usage < 50) return "text-green-400";
    if (usage < 75) return "text-yellow-400";
    return "text-orange-400";
  };

  const metrics = [
    {
      icon: Cpu,
      label: "CPU Load",
      value: cpuUsage,
      unit: "%",
      color: getUsageColor(cpuUsage),
      bgColor: "from-cyan-500/20 to-cyan-600/10"
    },
    {
      icon: HardDrive,
      label: "Memory",
      value: memoryUsage,
      unit: "%",
      color: getUsageColor(memoryUsage),
      bgColor: "from-purple-500/20 to-purple-600/10"
    },
    {
      icon: Wifi,
      label: "Network",
      value: networkLoad,
      unit: "%",
      color: getUsageColor(networkLoad),
      bgColor: "from-green-500/20 to-green-600/10"
    },
  ];

  return (
    <div className="h-full flex flex-col p-3 gap-3 bg-background/5">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <Zap className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-primary/70 uppercase tracking-wider font-mono">
          System Diagnostics
        </span>
      </div>

      {/* Metrics */}
      <div className="flex-1 space-y-3">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="relative p-2 rounded border border-primary/20 bg-muted/30 dark:bg-black/40 overflow-hidden group"
              data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {/* Background gradient */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r opacity-30",
                metric.bgColor
              )} />

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3 w-3", metric.color)} />
                    <span className="text-xs font-mono">{metric.label}</span>
                  </div>
                  <span className={cn("text-lg font-bold font-mono", metric.color)}>
                    {metric.value}{metric.unit}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      metric.value < 50 && "bg-gradient-to-r from-green-500 to-green-400",
                      metric.value >= 50 && metric.value < 75 && "bg-gradient-to-r from-yellow-500 to-yellow-400",
                      metric.value >= 75 && "bg-gradient-to-r from-orange-500 to-orange-400"
                    )}
                    style={{
                      width: `${metric.value}%`,
                      boxShadow: metric.value > 50 ? 
                        `0 0 10px ${metric.value >= 75 ? 'rgba(251, 146, 60, 0.6)' : 'rgba(250, 204, 21, 0.6)'}` :
                        '0 0 10px rgba(74, 222, 128, 0.6)'
                    }}
                  />
                  
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
                </div>

                {/* Grid marks */}
                <div className="flex justify-between mt-1 text-[8px] text-muted-foreground font-mono">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* System status */}
      <div className="p-2 rounded border border-green-500/30 bg-green-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-green-400 uppercase tracking-wide font-mono">
            System Status
          </span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
            <span className="text-xs font-mono text-green-300">Optimal</span>
          </div>
        </div>
      </div>

      {/* Animated scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan-horizontal" style={{ animationDuration: '3s' }} />
      </div>
    </div>
  );
}
