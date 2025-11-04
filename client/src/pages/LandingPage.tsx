import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Key, Github, Zap, Globe, Database, CheckCircle2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 scanline-overlay pointer-events-none" />
      
      {/* Particle System */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle absolute w-1 h-1 bg-primary rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Hexagonal Pattern Overlay */}
      <div className="absolute inset-0 hexagon-pattern opacity-5 pointer-events-none" />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto">
          {/* Logo with Advanced Effects */}
          <div className="relative w-fit mx-auto mb-8">
            {/* Rotating Energy Rings */}
            <div className="absolute inset-0 -m-12">
              <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-spin-slow" />
              <div className="absolute inset-4 border-2 border-secondary/20 rounded-full animate-spin-reverse" />
              <div className="absolute inset-8 border border-primary/40 rounded-full animate-pulse-slow" />
            </div>
            
            {/* Holographic Glow */}
            <div className="absolute inset-0 -m-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-3xl animate-pulse-glow" />
            
            {/* Logo Container */}
            <div className="relative logo-glitch-container p-8">
              <Lock className="h-32 w-32 text-primary drop-shadow-neon" />
              
              {/* Glitch Layers */}
              <Lock className="glitch-layer-1 absolute top-8 left-8 h-32 w-32 text-secondary opacity-70" />
              <Lock className="glitch-layer-2 absolute top-8 left-8 h-32 w-32 text-primary opacity-50" />
            </div>
          </div>

          {/* Title with Holographic Effect */}
          <h1 className="text-7xl md:text-9xl font-bold text-center mb-6 holographic-text uppercase tracking-wider font-display">
            LOCKBOX
          </h1>

          {/* Tagline */}
          <p className="text-2xl md:text-3xl text-center text-primary mb-4 animate-pulse-text font-display tracking-wide">
            LOCK THE GATE • AVOID THE FATE
          </p>

          {/* Subtitle with Data Stream Effect */}
          <div className="relative max-w-3xl mx-auto mb-12">
            <p className="text-lg md:text-xl text-center text-muted-foreground leading-relaxed">
              Military-grade encrypted messaging platform powered by{" "}
              <span className="text-primary font-semibold animate-pulse-text">Signal Protocol</span>.
              Your conversations are protected by quantum-resistant cryptography.
            </p>
            <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
          </div>

          {/* CTA Buttons with Advanced Effects */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              onClick={handleLogin}
              className="group relative text-lg h-14 px-12 overflow-hidden energy-button uppercase tracking-wider font-display"
              data-testid="button-login"
            >
              {/* Energy Pulse Effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              {/* Glow Trail */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl bg-primary/50 transition-opacity duration-500" />
              
              <span className="relative flex items-center gap-2">
                <Zap className="h-5 w-5" />
                INITIALIZE SECURE SESSION
              </span>
            </Button>

            <a
              href="https://github.com/yourusername/lockbox"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Button
                variant="outline"
                size="lg"
                className="text-lg h-14 px-8 border-2 hover-elevate active-elevate-2 uppercase tracking-wide font-display"
                data-testid="button-github"
              >
                <Github className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                OPEN SOURCE
              </Button>
            </a>
          </div>

          {/* Encryption Standards Showcase */}
          <div className="relative mb-16">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl blur-2xl" />
            
            <div className="relative border border-primary/30 rounded-2xl p-8 bg-background/50 backdrop-blur-sm corner-brackets">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />

              <h2 className="text-3xl font-bold text-center mb-8 text-primary uppercase tracking-wide font-display flex items-center justify-center gap-3">
                <Shield className="h-8 w-8 animate-pulse" />
                ENCRYPTION STANDARDS
              </h2>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Signal Protocol */}
                <div className="group relative border border-primary/20 rounded-xl p-6 bg-card/50 hover-elevate active-elevate-2 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Lock className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold font-display">SIGNAL PROTOCOL</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Industry-leading E2E encryption protocol used by WhatsApp, Signal, and Google Messages
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">X3DH Key Exchange</Badge>
                      <Badge variant="secondary" className="text-xs">Double Ratchet</Badge>
                    </div>
                  </div>
                </div>

                {/* Perfect Forward Secrecy */}
                <div className="group relative border border-primary/20 rounded-xl p-6 bg-card/50 hover-elevate active-elevate-2 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Key className="h-6 w-6 text-secondary" />
                      </div>
                      <h3 className="text-xl font-bold font-display">PERFECT FORWARD SECRECY</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Unique session keys ensure past communications remain secure even if keys are compromised
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">Session Keys</Badge>
                      <Badge variant="secondary" className="text-xs">Future Proof</Badge>
                    </div>
                  </div>
                </div>

                {/* End-to-End Encryption */}
                <div className="group relative border border-primary/20 rounded-xl p-6 bg-card/50 hover-elevate active-elevate-2 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Database className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold font-display">ZERO KNOWLEDGE</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Messages encrypted on device. Server cannot read your conversations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">Client-Side</Badge>
                      <Badge variant="secondary" className="text-xs">IndexedDB Storage</Badge>
                    </div>
                  </div>
                </div>

                {/* Authenticated Encryption */}
                <div className="group relative border border-primary/20 rounded-xl p-6 bg-card/50 hover-elevate active-elevate-2 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-secondary" />
                      </div>
                      <h3 className="text-xl font-bold font-display">AUTHENTICATED ENCRYPTION</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      AES-GCM with PBKDF2 ensures message integrity and authenticity
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">AES-256-GCM</Badge>
                      <Badge variant="secondary" className="text-xs">PBKDF2</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Stream Animation */}
              <div className="relative h-12 overflow-hidden rounded-lg bg-background/30 border border-primary/20">
                <div className="absolute inset-0 flex items-center justify-center gap-1 data-stream">
                  <span className="text-xs text-primary/60 font-mono">01001100</span>
                  <span className="text-xs text-secondary/60 font-mono">01001111</span>
                  <span className="text-xs text-primary/60 font-mono">01000011</span>
                  <span className="text-xs text-secondary/60 font-mono">01001011</span>
                  <span className="text-xs text-primary/60 font-mono animate-pulse">▮</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {/* Real-Time Communication */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
              <div className="relative border border-primary/30 rounded-xl p-6 bg-card hover-elevate active-elevate-2 h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <div className="relative p-4 bg-primary/10 rounded-full">
                      <Zap className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold uppercase font-display">REAL-TIME</h3>
                  <p className="text-sm text-muted-foreground">
                    WebSocket-powered instant messaging with sub-millisecond latency
                  </p>
                </div>
              </div>
            </div>

            {/* Multi-Room Support */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
              <div className="relative border border-primary/30 rounded-xl p-6 bg-card hover-elevate active-elevate-2 h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full" />
                    <div className="relative p-4 bg-secondary/10 rounded-full">
                      <Globe className="h-8 w-8 text-secondary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold uppercase font-display">MULTI-ROOM</h3>
                  <p className="text-sm text-muted-foreground">
                    Create up to 3 secure chatrooms with persistent encrypted history
                  </p>
                </div>
              </div>
            </div>

            {/* Open Source */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
              <div className="relative border border-primary/30 rounded-xl p-6 bg-card hover-elevate active-elevate-2 h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <div className="relative p-4 bg-primary/10 rounded-full">
                      <Github className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold uppercase font-display">OPEN SOURCE</h3>
                  <p className="text-sm text-muted-foreground">
                    Fully transparent codebase. Audit the security yourself
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary" />
              <span className="uppercase tracking-widest font-display">Quantum-Resistant Cryptography</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary" />
            </div>
            <p className="text-xs text-muted-foreground/60">
              Built with React • TypeScript • Signal Protocol • PostgreSQL • Socket.io
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
