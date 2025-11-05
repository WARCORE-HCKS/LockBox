import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

export default function HolographicOverlay() {
  const [glitchActive, setGlitchActive] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Random glitch effect every 5-15 seconds
    const triggerGlitch = () => {
      setGlitchActive(true);
      const glitchOffTimer = setTimeout(() => setGlitchActive(false), 200);
      timersRef.current.push(glitchOffTimer);
      
      const nextGlitch = Math.random() * 10000 + 5000;
      const nextGlitchTimer = setTimeout(triggerGlitch, nextGlitch);
      timersRef.current.push(nextGlitchTimer);
    };

    const initialTimer = setTimeout(triggerGlitch, Math.random() * 5000 + 2000);
    timersRef.current.push(initialTimer);

    return () => {
      // Clear all active timers on unmount
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Scanline overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.03) 2px, rgba(0, 255, 255, 0.03) 4px)",
          animation: "scanline-move 8s linear infinite",
        }}
      />

      {/* Holographic grid */}
      <div 
        className="absolute inset-0 opacity-3"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Random glitch effect */}
      {glitchActive && (
        <>
          <div 
            className={cn(
              "absolute inset-0 mix-blend-screen",
              "bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"
            )}
            style={{
              animation: "glitch-1 0.2s ease-in-out",
            }}
          />
          <div 
            className={cn(
              "absolute inset-0 mix-blend-screen",
              "bg-gradient-to-tl from-secondary/5 via-transparent to-primary/5"
            )}
            style={{
              animation: "glitch-2 0.2s ease-in-out",
            }}
          />
        </>
      )}

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, transparent 0%, rgba(10, 10, 15, 0.4) 100%)",
        }}
      />

      {/* Data streams (occasional) */}
      <div className="absolute top-0 left-[20%] w-px h-full opacity-20 animate-data-stream" 
        style={{ 
          background: "linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.5), transparent)",
          animationDelay: "0s",
          animationDuration: "3s"
        }} 
      />
      <div className="absolute top-0 left-[50%] w-px h-full opacity-15 animate-data-stream" 
        style={{ 
          background: "linear-gradient(to bottom, transparent, rgba(255, 0, 255, 0.4), transparent)",
          animationDelay: "1.5s",
          animationDuration: "4s"
        }} 
      />
      <div className="absolute top-0 left-[80%] w-px h-full opacity-10 animate-data-stream" 
        style={{ 
          background: "linear-gradient(to bottom, transparent, rgba(255, 0, 128, 0.3), transparent)",
          animationDelay: "2.5s",
          animationDuration: "3.5s"
        }} 
      />
    </div>
  );
}
