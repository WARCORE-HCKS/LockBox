import { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "react-grid-layout";

export interface PanelVisibility {
  sidebar: boolean;
  hudStats: boolean;
  cyberMap: boolean;
  chatMessages: boolean;
  messageInput: boolean;
}

export interface PanelMinimized {
  sidebar: boolean;
  hudStats: boolean;
  cyberMap: boolean;
}

const STORAGE_KEY = "lockbox-layout";
const VISIBILITY_KEY = "lockbox-panel-visibility";
const MINIMIZED_KEY = "lockbox-panel-minimized";
const SAVE_DEBOUNCE_MS = 500; // Throttle persistence

const defaultLayout: Layout[] = [
  { i: "sidebar", x: 0, y: 0, w: 3, h: 12, minW: 3, minH: 8 },
  { i: "hudStats", x: 0, y: 12, w: 3, h: 5, minW: 3, minH: 4 },
  { i: "cyberMap", x: 0, y: 17, w: 3, h: 5, minW: 3, minH: 4 },
  { i: "chatMessages", x: 3, y: 0, w: 9, h: 20, minW: 6, minH: 10 },
  { i: "messageInput", x: 3, y: 20, w: 9, h: 2, minW: 6, minH: 2 },
];

const defaultVisibility: PanelVisibility = {
  sidebar: true,
  hudStats: true,
  cyberMap: true,
  chatMessages: true,
  messageInput: true,
};

const defaultMinimized: PanelMinimized = {
  sidebar: false,
  hudStats: false,
  cyberMap: false,
};

export function useLayoutManager() {
  const [layout, setLayout] = useState<Layout[]>(() => {
    if (typeof window === "undefined") return defaultLayout;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultLayout;
  });

  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>(() => {
    if (typeof window === "undefined") return defaultVisibility;
    const saved = localStorage.getItem(VISIBILITY_KEY);
    return saved ? JSON.parse(saved) : defaultVisibility;
  });

  const [panelMinimized, setPanelMinimized] = useState<PanelMinimized>(() => {
    if (typeof window === "undefined") return defaultMinimized;
    const saved = localStorage.getItem(MINIMIZED_KEY);
    return saved ? JSON.parse(saved) : defaultMinimized;
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
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
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
