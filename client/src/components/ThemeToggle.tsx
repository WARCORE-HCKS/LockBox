import { Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
      className={cn(
        "relative group h-12 w-12 rounded-sm overflow-visible",
        "transition-all duration-500 ease-out",
        "hover:scale-110 active:scale-95"
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Outer rotating ring */}
      <div className={cn(
        "absolute inset-0 rounded-sm transition-all duration-700",
        "before:absolute before:inset-[-4px] before:rounded-sm",
        "before:bg-gradient-to-r before:from-primary before:via-secondary before:to-accent",
        "before:opacity-0 before:blur-sm",
        "group-hover:before:opacity-100 group-hover:before:animate-spin-slow",
        "after:absolute after:inset-0 after:rounded-sm after:bg-background"
      )} />

      {/* Animated orbital rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Outer orbit */}
        <div className={cn(
          "absolute w-14 h-14 rounded-full border-2 transition-all duration-700",
          isDark 
            ? "border-primary/30 group-hover:border-primary/60 animate-pulse" 
            : "border-accent/30 group-hover:border-accent/60 animate-pulse",
          "group-hover:scale-110"
        )} style={{ animationDuration: '3s' }} />
        
        {/* Middle orbit */}
        <div className={cn(
          "absolute w-10 h-10 rounded-full border-2 transition-all duration-500",
          isDark 
            ? "border-secondary/40 group-hover:border-secondary/70" 
            : "border-primary/40 group-hover:border-primary/70",
          "group-hover:scale-105 animate-spin-reverse"
        )} style={{ animationDuration: '4s' }} />
      </div>

      {/* Glow background */}
      <div className={cn(
        "absolute inset-0 rounded-sm transition-all duration-500",
        isDark 
          ? "bg-gradient-to-br from-primary/10 via-background to-secondary/10" 
          : "bg-gradient-to-br from-accent/10 via-background to-primary/10",
        "group-hover:from-primary/20 group-hover:to-secondary/20"
      )} />

      {/* Neon glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-sm opacity-0 transition-all duration-500",
        "group-hover:opacity-100",
        isDark 
          ? "shadow-[0_0_20px_rgba(0,255,255,0.3),0_0_40px_rgba(255,0,255,0.2)]"
          : "shadow-[0_0_20px_rgba(255,0,128,0.3),0_0_40px_rgba(0,255,255,0.2)]"
      )} />

      {/* Corner brackets */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-left */}
        <div className={cn(
          "absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 transition-all duration-300",
          isDark ? "border-primary" : "border-accent",
          "group-hover:w-3 group-hover:h-3 opacity-60 group-hover:opacity-100"
        )} />
        {/* Top-right */}
        <div className={cn(
          "absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 transition-all duration-300",
          isDark ? "border-primary" : "border-accent",
          "group-hover:w-3 group-hover:h-3 opacity-60 group-hover:opacity-100"
        )} />
        {/* Bottom-left */}
        <div className={cn(
          "absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 transition-all duration-300",
          isDark ? "border-secondary" : "border-primary",
          "group-hover:w-3 group-hover:h-3 opacity-60 group-hover:opacity-100"
        )} />
        {/* Bottom-right */}
        <div className={cn(
          "absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 transition-all duration-300",
          isDark ? "border-secondary" : "border-primary",
          "group-hover:w-3 group-hover:h-3 opacity-60 group-hover:opacity-100"
        )} />
      </div>

      {/* Particle effects */}
      <div className="absolute inset-0 overflow-hidden rounded-sm pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-100",
              "transition-all duration-1000",
              isDark ? "bg-primary" : "bg-accent",
              "group-hover:animate-particle-float"
            )}
            style={{
              left: `${20 + i * 12}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${2 + i * 0.3}s`
            }}
          />
        ))}
      </div>

      {/* Main icon container */}
      <div className={cn(
        "relative z-10 flex items-center justify-center h-full transition-all duration-700",
        "group-hover:scale-110"
      )}>
        {/* Icon rotation and glow */}
        <div className={cn(
          "relative transition-all duration-700",
          isDark ? "rotate-0" : "rotate-180"
        )}>
          {/* Icon glow */}
          <div className={cn(
            "absolute inset-0 blur-md transition-all duration-500 opacity-0 group-hover:opacity-100",
            isDark 
              ? "bg-gradient-to-br from-primary via-secondary to-transparent" 
              : "bg-gradient-to-br from-accent via-primary to-transparent"
          )} />
          
          {/* Main icon */}
          <div className="relative">
            {isDark ? (
              <Moon className={cn(
                "h-5 w-5 transition-all duration-500",
                "text-primary group-hover:text-primary drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]",
                "group-hover:drop-shadow-[0_0_12px_rgba(0,255,255,1)]"
              )} />
            ) : (
              <Sun className={cn(
                "h-5 w-5 transition-all duration-500",
                "text-accent group-hover:text-accent drop-shadow-[0_0_8px_rgba(255,0,128,0.8)]",
                "group-hover:drop-shadow-[0_0_12px_rgba(255,0,128,1)]"
              )} />
            )}
          </div>
        </div>

        {/* Sparkle accent */}
        <Sparkles className={cn(
          "absolute -top-1 -right-1 h-3 w-3 transition-all duration-500",
          "opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100",
          isDark ? "text-secondary" : "text-primary",
          "animate-pulse"
        )} style={{ animationDuration: '2s' }} />
      </div>

      {/* Scan line effect */}
      <div className={cn(
        "absolute inset-0 overflow-hidden rounded-sm pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-500"
      )}>
        <div className={cn(
          "absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent",
          "animate-scan-line"
        )} />
      </div>
    </button>
  );
}
