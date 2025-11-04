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
    { x: 20, y: 30, region: "NA" },  // North America
    { x: 50, y: 25, region: "EU" },  // Europe
    { x: 75, y: 40, region: "AS" },  // Asia
    { x: 85, y: 70, region: "AU" },  // Australia
    { x: 30, y: 65, region: "SA" },  // South America
    { x: 55, y: 50, region: "AF" },  // Africa
    { x: 90, y: 35, region: "EA" },  // East Asia
    { x: 15, y: 20, region: "NA2" }, // North America 2
  ];

  return (
    <div className="p-3 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-sm corner-brackets">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
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
      <div className="relative w-full h-32 bg-background/50 rounded-sm border border-primary/10 overflow-hidden">
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
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* North America */}
          <path
            d="M 10,20 Q 15,15 22,18 L 28,22 Q 30,28 28,35 L 22,38 Q 15,38 12,32 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.3"
            className="animate-pulse"
            style={{ animationDuration: '4s' }}
          />
          
          {/* Europe */}
          <path
            d="M 45,18 Q 50,15 55,18 L 58,22 Q 58,28 55,30 L 48,32 Q 44,28 45,22 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.3"
            className="animate-pulse"
            style={{ animationDuration: '5s', animationDelay: '1s' }}
          />
          
          {/* Asia */}
          <path
            d="M 65,25 Q 75,20 85,25 L 92,35 Q 90,45 85,48 L 75,50 Q 68,45 65,38 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.3"
            className="animate-pulse"
            style={{ animationDuration: '6s', animationDelay: '0.5s' }}
          />
          
          {/* South America */}
          <path
            d="M 22,55 Q 28,52 32,55 L 35,65 Q 33,75 28,78 L 24,75 Q 20,68 22,60 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.3"
            className="animate-pulse"
            style={{ animationDuration: '5.5s', animationDelay: '1.5s' }}
          />
          
          {/* Africa */}
          <path
            d="M 48,42 Q 55,40 60,45 L 62,60 Q 58,68 52,70 L 46,65 Q 44,55 48,48 Z"
            fill="hsl(var(--primary) / 0.08)"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.3"
            className="animate-pulse"
            style={{ animationDuration: '4.5s', animationDelay: '2s' }}
          />
          
          {/* Australia */}
          <path
            d="M 78,68 Q 85,66 90,70 L 92,78 Q 88,82 82,82 L 76,78 Q 74,72 78,70 Z"
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
