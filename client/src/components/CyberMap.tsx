import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function CyberMap() {
  const [activeNodes, setActiveNodes] = useState<number[]>([]);

  // Animate threat nodes
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNodes(Array.from({ length: 3 }, () => Math.floor(Math.random() * 8)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Threat locations (relative positions on the world map)
  const threatNodes = [
    { x: 20, y: 15, region: "NA" },  // North America
    { x: 50, y: 12, region: "EU" },  // Europe
    { x: 75, y: 20, region: "AS" },  // Asia
    { x: 85, y: 35, region: "AU" },  // Australia
    { x: 30, y: 32, region: "SA" },  // South America
    { x: 55, y: 25, region: "AF" },  // Africa
    { x: 90, y: 17, region: "EA" },  // East Asia
    { x: 15, y: 10, region: "NA2" }, // North America 2
  ];

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 
          className="text-[10px] font-bold uppercase tracking-widest text-primary"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          GLOBAL SECURITY MAP
        </h3>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[8px] uppercase text-success" style={{ fontFamily: 'var(--font-display)' }}>
            ACTIVE
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full aspect-[2/1] bg-background/50 rounded-sm border border-primary/10 overflow-hidden">
        {/* Grid Background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '10px 10px'
          }}
        />

        {/* Continents (simplified shapes) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet">
          {/* North America */}
          <path
            d="M 10,10 Q 15,7 22,9 L 28,11 Q 30,14 28,17 L 22,19 Q 15,19 12,16 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.3"
            className="animate-pulse"
            style={{ animationDuration: '4s' }}
          />
          
          {/* Europe */}
          <path
            d="M 45,9 Q 50,7 55,9 L 58,11 Q 58,14 55,15 L 48,16 Q 44,14 45,11 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.3"
            className="animate-pulse"
            style={{ animationDuration: '5s', animationDelay: '1s' }}
          />
          
          {/* Asia */}
          <path
            d="M 65,12 Q 75,10 85,12 L 92,17 Q 90,22 85,24 L 75,25 Q 68,22 65,19 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.3"
            className="animate-pulse"
            style={{ animationDuration: '6s', animationDelay: '0.5s' }}
          />
          
          {/* South America */}
          <path
            d="M 22,27 Q 28,26 32,27 L 35,32 Q 33,37 28,39 L 24,37 Q 20,34 22,30 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.3"
            className="animate-pulse"
            style={{ animationDuration: '5.5s', animationDelay: '1.5s' }}
          />
          
          {/* Africa */}
          <path
            d="M 48,21 Q 55,20 60,22 L 62,30 Q 58,34 52,35 L 46,32 Q 44,27 48,24 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.3"
            className="animate-pulse"
            style={{ animationDuration: '4.5s', animationDelay: '2s' }}
          />
          
          {/* Australia */}
          <path
            d="M 78,34 Q 85,33 90,35 L 92,39 Q 88,41 82,41 L 76,39 Q 74,36 78,35 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.3"
            className="animate-pulse"
            style={{ animationDuration: '5s', animationDelay: '2.5s' }}
          />
        </svg>

        {/* Threat/Activity Nodes */}
        {threatNodes.map((node, index) => (
          <div
            key={index}
            className={cn(
              "absolute w-2 h-2 -translate-x-1 -translate-y-1 transition-all duration-500",
              activeNodes.includes(index) ? "opacity-100 scale-125" : "opacity-60 scale-100"
            )}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            {/* Outer pulse ring */}
            <div className={cn(
              "absolute inset-0 rounded-full border-2",
              activeNodes.includes(index) 
                ? "border-accent animate-ping" 
                : "border-primary/40"
            )} />
            
            {/* Inner dot */}
            <div className={cn(
              "absolute inset-0 rounded-full",
              activeNodes.includes(index)
                ? "bg-accent shadow-[0_0_8px_currentColor]"
                : "bg-primary/60"
            )} />
            
            {/* Connection lines (when active) */}
            {activeNodes.includes(index) && index < threatNodes.length - 1 && (
              <svg 
                className="absolute top-0 left-0 w-screen h-screen pointer-events-none"
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                <line
                  x1="0"
                  y1="0"
                  x2={`${(threatNodes[index + 1].x - node.x) * 3}px`}
                  y2={`${(threatNodes[index + 1].y - node.y) * 3}px`}
                  stroke="hsl(var(--accent))"
                  strokeWidth="0.5"
                  opacity="0.4"
                  className="animate-pulse"
                />
              </svg>
            )}
          </div>
        ))}

        {/* Scanning Line Effect */}
        <div 
          className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-primary to-transparent opacity-50 animate-scan-horizontal"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2 text-[8px] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            <span className="text-muted-foreground">Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-muted-foreground">Activity</span>
          </div>
        </div>
        <span className="text-muted-foreground tabular-nums">{activeNodes.length}/8</span>
      </div>
    </div>
  );
}
