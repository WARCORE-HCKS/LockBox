import { Settings, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { PanelVisibility } from "@/hooks/useLayoutManager";

interface LayoutSettingsProps {
  panelVisibility: PanelVisibility;
  onToggleVisibility: (panelId: keyof PanelVisibility) => void;
  onResetLayout: () => void;
}

export default function LayoutSettings({
  panelVisibility,
  onToggleVisibility,
  onResetLayout,
}: LayoutSettingsProps) {
  const panelLabels: Record<keyof PanelVisibility, string> = {
    sidebar: "Friends & Chatrooms",
    hudStats: "HUD Telemetry",
    cyberMap: "Cyber Map",
    chatMessages: "Chat Messages",
    messageInput: "Message Input",
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="neon-glow-cyan"
          data-testid="button-layout-settings"
        >
          <Settings className="h-5 w-5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-primary/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary uppercase tracking-wide font-display flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Layout Settings
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
            Customize your workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Panel Visibility Controls */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-secondary mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Panel Visibility
            </h4>
            <div className="space-y-3">
              {Object.entries(panelLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Label 
                    htmlFor={`panel-${key}`}
                    className="text-sm flex items-center gap-2 cursor-pointer"
                  >
                    {panelVisibility[key as keyof PanelVisibility] ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    {label}
                  </Label>
                  <Switch
                    id={`panel-${key}`}
                    checked={panelVisibility[key as keyof PanelVisibility]}
                    onCheckedChange={() => onToggleVisibility(key as keyof PanelVisibility)}
                    data-testid={`switch-panel-${key}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-primary/20" />

          {/* Reset Layout */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-secondary mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Reset
            </h4>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={onResetLayout}
              data-testid="button-reset-layout"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default Layout
            </Button>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
              Restore all panels to default positions and sizes
            </p>
          </div>

          {/* Instructions */}
          <div className="relative p-3 rounded-sm border border-primary/20 bg-primary/5">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/40" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/40" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/40" />
            
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              How to Customize
            </h5>
            <ul className="text-[10px] text-muted-foreground space-y-1 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              <li>• Drag panel headers to move</li>
              <li>• Drag corners to resize</li>
              <li>• Click minimize/close buttons</li>
              <li>• Toggle visibility here</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
