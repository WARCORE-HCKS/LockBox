import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar?: string } | null>(null);

  const handleLogin = (username: string, password: string) => {
    console.log("Login:", username, password);
    setCurrentUser({
      id: "current-user",
      name: username,
    });
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    console.log("Logout");
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!isAuthenticated || !currentUser ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <ChatPage currentUser={currentUser} onLogout={handleLogout} />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
