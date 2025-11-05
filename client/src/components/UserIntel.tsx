import { useQuery } from "@tanstack/react-query";
import { Activity, MessageSquare, Shield, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, ChatroomMessage } from "@shared/schema";

export default function UserIntel() {
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const { data: chatroomMessages } = useQuery<ChatroomMessage[]>({
    queryKey: ["/api/chatroom-messages"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Calculate stats
  const totalMessagesSent = (messages?.filter(m => m.senderId === user?.id) || []).length +
    (chatroomMessages?.filter(m => m.senderId === user?.id) || []).length;
  const totalUsers = users?.length || 0;
  const encryptionStrength = "AES-256-GCM + Signal";

  const stats = [
    {
      icon: MessageSquare,
      label: "Messages Sent",
      value: totalMessagesSent.toString(),
      color: "text-cyan-400",
      glow: "shadow-[0_0_10px_rgba(34,211,238,0.5)]"
    },
    {
      icon: Users,
      label: "Network Size",
      value: totalUsers.toString(),
      color: "text-purple-400",
      glow: "shadow-[0_0_10px_rgba(192,132,252,0.5)]"
    },
    {
      icon: Shield,
      label: "Security Level",
      value: "Maximum",
      color: "text-green-400",
      glow: "shadow-[0_0_10px_rgba(74,222,128,0.5)]"
    },
    {
      icon: Activity,
      label: "Status",
      value: "Active",
      color: "text-primary",
      glow: "shadow-[0_0_10px_rgba(0,255,255,0.5)]"
    },
  ];

  return (
    <div className="h-full flex flex-col p-3 gap-3 bg-background/5">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs">
        <Zap className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-primary/70 uppercase tracking-wider font-mono">
          User Intelligence
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={cn(
                "relative p-2 rounded border border-primary/20",
                "bg-black/40 backdrop-blur-sm",
                "hover:border-primary/40 transition-all duration-300",
                "group"
              )}
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {/* Icon */}
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full mb-2",
                "bg-black/60 border border-primary/30",
                stat.glow,
                "group-hover:scale-110 transition-transform duration-300"
              )}>
                <Icon className={cn("h-3 w-3", stat.color)} />
              </div>

              {/* Value */}
              <div className={cn(
                "text-lg font-bold font-mono mb-1",
                stat.color,
                "group-hover:animate-pulse"
              )}>
                {stat.value}
              </div>

              {/* Label */}
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-mono">
                {stat.label}
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Encryption status */}
      <div className="p-2 rounded border border-green-500/30 bg-green-950/20">
        <div className="text-[10px] text-green-400 uppercase tracking-wide font-mono mb-1">
          Encryption Protocol
        </div>
        <div className="text-xs font-mono text-green-300">
          {encryptionStrength}
        </div>
      </div>

      {/* Animated background effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scan-horizontal" />
      </div>
    </div>
  );
}
