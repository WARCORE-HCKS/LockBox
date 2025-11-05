import { useState, useEffect } from "react";
import { Activity, MessageSquare, UserPlus, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface ActivityItem {
  id: string;
  icon: any;
  message: string;
  timestamp: Date;
  type: "message" | "security" | "user" | "system";
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  // Initialize with some activities
  useEffect(() => {
    const initialActivities: ActivityItem[] = [
      {
        id: "1",
        icon: Shield,
        message: "E2E encryption initialized",
        timestamp: new Date(Date.now() - 5000),
        type: "security"
      },
      {
        id: "2",
        icon: Lock,
        message: "Signal Protocol keys generated",
        timestamp: new Date(Date.now() - 3000),
        type: "security"
      },
      {
        id: "3",
        icon: UserPlus,
        message: "Session authenticated",
        timestamp: new Date(Date.now() - 1000),
        type: "user"
      },
    ];
    setActivities(initialActivities);
  }, []);

  // Add new activity when user data loads
  useEffect(() => {
    if (user) {
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        icon: Activity,
        message: `Connected as ${user.email}`,
        timestamp: new Date(),
        type: "system"
      };
      setActivities(prev => [newActivity, ...prev].slice(0, 10));
    }
  }, [user]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "security": return "text-green-400";
      case "message": return "text-cyan-400";
      case "user": return "text-purple-400";
      case "system": return "text-yellow-400";
      default: return "text-primary";
    }
  };

  const getTimestamp = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="h-full flex flex-col p-3 gap-2 bg-background/5">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <Activity className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-primary/70 uppercase tracking-wider font-mono">
          Activity Feed
        </span>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto space-y-2 pr-1 scrollbar-cyber">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className={cn(
                  "relative p-2 rounded border border-primary/20 bg-black/40",
                  "hover:border-primary/40 transition-all duration-300",
                  "group animate-in fade-in slide-in-from-right-2"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`activity-${activity.id}`}
              >
                <div className="flex items-start gap-2">
                  {/* Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                    "bg-black/60 border border-primary/30",
                    "group-hover:scale-110 transition-transform duration-300"
                  )}>
                    <Icon className={cn("h-3 w-3", getTypeColor(activity.type))} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-foreground/90 truncate">
                      {activity.message}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {getTimestamp(activity.timestamp)}
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className={cn(
                    "flex-shrink-0 w-1.5 h-1.5 rounded-full",
                    getTypeColor(activity.type).replace('text-', 'bg-'),
                    "animate-pulse"
                  )} />
                </div>

                {/* Scan line effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            );
          })}

          {activities.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Activity className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground font-mono">
                No recent activity
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scanning animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan-horizontal" style={{ animationDuration: '4s' }} />
      </div>
    </div>
  );
}
