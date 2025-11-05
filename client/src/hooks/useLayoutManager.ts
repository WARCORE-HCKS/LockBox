import { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "react-grid-layout";

export interface PanelVisibility {
  sidebar: boolean;
  hudStats: boolean;
  cyberMap: boolean;
  chatMessages: boolean;
  messageInput: boolean;
  cyberNotes: boolean;
  userIntel: boolean;
  securityMonitor: boolean;
  systemDiagnostics: boolean;
  activityFeed: boolean;
}

export interface PanelMinimized {
  sidebar: boolean;
  hudStats: boolean;
  cyberMap: boolean;
  cyberNotes: boolean;
  userIntel: boolean;
  securityMonitor: boolean;
  systemDiagnostics: boolean;
  activityFeed: boolean;
}

const STORAGE_KEY = "lockbox-layout";
const VISIBILITY_KEY = "lockbox-panel-visibility";
const MINIMIZED_KEY = "lockbox-panel-minimized";
const SAVE_DEBOUNCE_MS = 500; // Throttle persistence

const defaultLayout: Layout[] = [
  { i: "sidebar", x: 0, y: 0, w: 2, h: 12, minW: 1, maxW: 6, minH: 4 },
  { i: "hudStats", x: 0, y: 12, w: 2, h: 4, minW: 1, maxW: 4, minH: 2 },
  { i: "cyberMap", x: 0, y: 16, w: 2, h: 5, minW: 1, maxW: 4, minH: 2 },
  { i: "chatMessages", x: 2, y: 0, w: 7, h: 18, minW: 3, maxW: 12, minH: 6 },
  { i: "messageInput", x: 2, y: 18, w: 7, h: 3, minW: 3, maxW: 12, minH: 1 },
  { i: "cyberNotes", x: 9, y: 0, w: 3, h: 7, minW: 1, maxW: 6, minH: 3 },
  { i: "userIntel", x: 9, y: 7, w: 3, h: 5, minW: 1, maxW: 4, minH: 3 },
  { i: "securityMonitor", x: 9, y: 12, w: 3, h: 6, minW: 1, maxW: 4, minH: 3 },
  { i: "systemDiagnostics", x: 0, y: 21, w: 2, h: 5, minW: 1, maxW: 4, minH: 3 },
  { i: "activityFeed", x: 9, y: 18, w: 3, h: 8, minW: 1, maxW: 4, minH: 3 },
];

const defaultVisibility: PanelVisibility = {
  sidebar: true,
  hudStats: true,
  cyberMap: true,
  chatMessages: true,
  messageInput: true,
  cyberNotes: true,
  userIntel: true,
  securityMonitor: true,
  systemDiagnostics: true,
  activityFeed: true,
};

const defaultMinimized: PanelMinimized = {
  sidebar: false,
  hudStats: false,
  cyberMap: false,
  cyberNotes: false,
  userIntel: false,
  securityMonitor: false,
  systemDiagnostics: false,
  activityFeed: false,
};

export function useLayoutManager() {
  const [layout, setLayout] = useState<Layout[]>(() => {
    if (typeof window === "undefined") return defaultLayout;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const savedLayout = JSON.parse(saved);
      // Merge with defaults to ensure new panels are included
      const savedIds = new Set(savedLayout.map((item: Layout) => item.i));
      const newPanels = defaultLayout.filter(item => !savedIds.has(item.i));
      return [...savedLayout, ...newPanels];
    }
    return defaultLayout;
  });

  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>(() => {
    if (typeof window === "undefined") return defaultVisibility;
    const saved = localStorage.getItem(VISIBILITY_KEY);
    if (saved) {
      // Merge saved with defaults to include new panels
      const savedVisibility = JSON.parse(saved);
      return { ...defaultVisibility, ...savedVisibility };
    }
    return defaultVisibility;
  });

  const [panelMinimized, setPanelMinimized] = useState<PanelMinimized>(() => {
    if (typeof window === "undefined") return defaultMinimized;
    const saved = localStorage.getItem(MINIMIZED_KEY);
    if (saved) {
      // Merge saved with defaults to include new panels
      const savedMinimized = JSON.parse(saved);
      return { ...defaultMinimized, ...savedMinimized };
    }
    return defaultMinimized;
  });

  // Throttled save to localStorage using useRef for debounce timer
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Save layout to localStorage with 500ms debounce
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    }, SAVE_DEBOUNCE_MS);

    return () => {
      // Flush pending save before cleanup to prevent data loss on fast reloads
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      }
    };
  }, [layout]);

  // Save visibility to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(panelVisibility));
  }, [panelVisibility]);

  // Save minimized state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(MINIMIZED_KEY, JSON.stringify(panelMinimized));
  }, [panelMinimized]);

  const onLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
  }, []);

  const togglePanelVisibility = useCallback((panelId: keyof PanelVisibility) => {
    setPanelVisibility((prev) => ({
      ...prev,
      [panelId]: !prev[panelId],
    }));
  }, []);

  const togglePanelMinimized = useCallback((panelId: keyof PanelMinimized) => {
    setPanelMinimized((prev) => ({
      ...prev,
      [panelId]: !prev[panelId],
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(defaultLayout);
    setPanelVisibility(defaultVisibility);
    setPanelMinimized(defaultMinimized);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VISIBILITY_KEY);
    localStorage.removeItem(MINIMIZED_KEY);
  }, []);

  return {
    layout,
    panelVisibility,
    panelMinimized,
    onLayoutChange,
    togglePanelVisibility,
    togglePanelMinimized,
    resetLayout,
  };
}
