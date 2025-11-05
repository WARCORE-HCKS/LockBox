import { useState, useEffect, useCallback } from "react";
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

const defaultLayout: Layout[] = [
  { i: "sidebar", x: 0, y: 0, w: 3, h: 12, minW: 2, minH: 6 },
  { i: "hudStats", x: 0, y: 12, w: 3, h: 4, minW: 2, minH: 3 },
  { i: "cyberMap", x: 0, y: 16, w: 3, h: 4, minW: 2, minH: 3 },
  { i: "chatMessages", x: 3, y: 0, w: 9, h: 18, minW: 4, minH: 8 },
  { i: "messageInput", x: 3, y: 18, w: 9, h: 2, minW: 4, minH: 2 },
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

  // Save layout to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
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
