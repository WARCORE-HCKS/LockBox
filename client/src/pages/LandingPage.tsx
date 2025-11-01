import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Shield, Users } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LockIcon from "@/components/LockIcon";

export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="mx-auto w-fit">
              <LockIcon className="h-40 w-auto mx-auto text-foreground" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold">LockBox</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto italic">
              Lock the gate, avoid the fate
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Private, encrypted messaging for you and your friends. Your conversations stay between you.
            </p>
          </div>

          <div className="flex justify-center">
            <Button size="lg" onClick={handleLogin} className="text-lg h-12 px-8" data-testid="button-login">
              Get Started
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardHeader>
                <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit mb-2">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">End-to-End Encrypted</CardTitle>
                <CardDescription>
                  Your messages are encrypted and only you and your friends can read them
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit mb-2">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Real-Time Messaging</CardTitle>
                <CardDescription>
                  Instant delivery of messages with typing indicators and read receipts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit mb-2">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Private Groups</CardTitle>
                <CardDescription>
                  Create secure spaces for you and your closest friends to connect
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
