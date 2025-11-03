import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    return savedTheme || "light";
  });

  // Fetch user data to get theme preference
  const { data: user } = useQuery<{ themePreference?: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Update theme from user preference when user data loads
  useEffect(() => {
    if (user?.themePreference) {
      const userTheme = user.themePreference as Theme;
      if (userTheme !== theme) {
        setTheme(userTheme);
        localStorage.setItem("theme", userTheme);
      }
    }
  }, [user?.themePreference]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Mutation to update theme in database
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: Theme) => {
      const response = await fetch("/api/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ theme: newTheme }),
      });
      if (!response.ok) throw new Error("Failed to update theme");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Save to database if user is authenticated
    if (user) {
      updateThemeMutation.mutate(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
