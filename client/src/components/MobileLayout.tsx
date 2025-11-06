import { useState, useMemo } from "react";
import { MessageCircle, Users, User, Settings, ArrowLeft, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ThemeToggle from "@/components/ThemeToggle";
import UserAvatar from "@/components/UserAvatar";
import MessageBubble from "@/components/MessageBubble";
import MessageInput from "@/components/MessageInput";
import CyberNotes from "@/components/CyberNotes";
import UserIntel from "@/components/UserIntel";
import FloatingParticles from "@/components/FloatingParticles";
import HolographicOverlay from "@/components/HolographicOverlay";
import { cn } from "@/lib/utils";
import type { User as UserType, Message, ChatroomMessage, Chatroom } from "@shared/schema";
import LockIcon from "@/components/LockIcon";

type MobileView = "chats" | "contacts" | "notes" | "stats" | "profile" | "chat";

interface DecryptedMessage extends Omit<Message, 'encryptedContent'> {
  content: string;
}

interface DecryptedChatroomMessage extends Omit<ChatroomMessage, 'encryptedContent'> {
  content: string;
}

interface MobileLayoutProps {
  currentUser: UserType;
  users: UserType[];
  chatrooms: Chatroom[];
  messages: DecryptedMessage[];
  chatroomMessages: DecryptedChatroomMessage[];
  activeFriendId: string | null;
  activeChatroomId: string | null;
  isChatroomActive: boolean;
  userStatuses: Map<string, "online" | "offline">;
  onSelectFriend: (friendId: string) => void;
  onSelectChatroom: (chatroomId: string) => void;
  onSendMessage: (content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onLogout: () => void;
  getUserDisplayName: (user: UserType) => string;
  getUserStatus: (userId: string) => "online" | "offline";
}

export default function MobileLayout({
  currentUser,
  users,
  chatrooms,
  messages,
  chatroomMessages,
  activeFriendId,
  activeChatroomId,
  isChatroomActive,
  userStatuses,
  onSelectFriend,
  onSelectChatroom,
  onSendMessage,
  onDeleteMessage,
  onLogout,
  getUserDisplayName,
  getUserStatus,
}: MobileLayoutProps) {
  const [view, setView] = useState<MobileView>("chats");

  // Generate particle positions once to avoid re-randomization on every render
  const particles = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 4,
    }));
  }, []);

  const activeFriend = users.find(u => u.id === activeFriendId);
  const activeChatroom = chatrooms.find(c => c.id === activeChatroomId);
  
  // Filter messages for the active conversation
  const displayMessages = isChatroomActive 
    ? chatroomMessages 
    : activeFriendId 
      ? messages.filter(m => 
          (m.senderId === currentUser.id && m.recipientId === activeFriendId) ||
          (m.senderId === activeFriendId && m.recipientId === currentUser.id)
        )
      : messages;

  // Get last message for each conversation
  const getLastMessage = (userId: string): string => {
    const userMessages = messages.filter(
      m => m.senderId === userId || m.recipientId === userId
    ).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    return userMessages[0]?.content || "No messages yet";
  };

  const getChatroomLastMessage = (chatroomId: string): string => {
    const roomMessages = chatroomMessages
      .filter(m => m.chatroomId === chatroomId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    return roomMessages[0]?.content || "No messages yet";
  };

  // Show chat view when friend or chatroom is selected
  if ((activeFriend || activeChatroom) && (view === "chat" || view === "chats")) {
    const activeView = view === "chats" ? view : "chat";
    
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (isChatroomActive) {
                onSelectChatroom("");
              } else {
                onSelectFriend("");
              }
              setView("chats");
            }}
            data-testid="button-back-to-chats"
            className="hover-elevate active-elevate-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {activeFriend && (
            <>
              <UserAvatar 
                name={getUserDisplayName(activeFriend)}
                size="sm"
                status={getUserStatus(activeFriend.id)}
                src={activeFriend.profileImageUrl || undefined}
              />
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-base truncate" style={{ fontFamily: 'var(--font-display)' }}>
                  {getUserDisplayName(activeFriend)}
                </h2>
                <p className="text-xs text-muted-foreground capitalize">
                  {getUserStatus(activeFriend.id)}
                </p>
              </div>
            </>
          )}
          
          {activeChatroom && (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center neon-glow-cyan">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-base truncate" style={{ fontFamily: 'var(--font-display)' }}>
                  {activeChatroom.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Group Chat
                </p>
              </div>
            </>
          )}

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-primary/10 border border-primary/30">
            <LockIcon className="h-3 w-3 text-primary" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>E2E</span>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1 py-4">
            {displayMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 neon-glow-cyan">
                  <LockIcon className="h-10 w-10 text-primary" />
                </div>
                <p className="text-sm font-bold text-primary uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  E2E Encrypted
                </p>
                <p className="text-xs text-muted-foreground">Send your first secure message</p>
              </div>
            ) : (
              displayMessages.map((msg, idx) => {
                const isOwn = msg.senderId === currentUser.id;
                const showAvatar = idx === displayMessages.length - 1 || 
                  displayMessages[idx + 1]?.senderId !== msg.senderId;
                const sender = users.find(u => u.id === msg.senderId);
                
                return (
                  <MessageBubble
                    key={msg.id}
                    id={msg.id}
                    content={msg.content}
                    sender={{
                      name: sender ? getUserDisplayName(sender) : "Unknown",
                      avatar: sender?.profileImageUrl || undefined
                    }}
                    timestamp={msg.createdAt!}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    onDelete={onDeleteMessage}
                  />
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t bg-card/50 backdrop-blur-sm p-3">
          <MessageInput onSend={onSendMessage} />
        </div>
      </div>
    );
  }

  // Main mobile navigation view
  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      {/* Floating Particles Effect */}
      <FloatingParticles />
      
      {/* Holographic Overlay Effect */}
      <HolographicOverlay />
      
      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 z-0" />
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 scanline-overlay pointer-events-none z-0" />
      
      {/* Particle System */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle absolute w-1 h-1 bg-primary rounded-full opacity-40"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Hexagonal Pattern Overlay */}
      <div className="absolute inset-0 hexagon-pattern opacity-5 pointer-events-none z-0" />

      {/* Header with Holographic Logo */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* Holographic Logo with Effects */}
          <div className="relative w-fit">
            {/* Rotating Energy Rings */}
            <div className="absolute inset-0 -m-1">
              <div className="absolute inset-0 border border-primary/30 rounded-full animate-spin-slow" />
              <div className="absolute inset-0.5 border border-secondary/20 rounded-full animate-spin-reverse" />
            </div>
            
            {/* Holographic Glow */}
            <div className="absolute inset-0 -m-2 rounded-full bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20 blur-md animate-pulse-glow" />
            
            {/* Glitch Layers */}
            <div className="absolute inset-0 glitch-layer-1">
              <LockIcon className="h-6 w-6 text-primary opacity-30" />
            </div>
            <div className="absolute inset-0 glitch-layer-2">
              <LockIcon className="h-6 w-6 text-secondary opacity-20" />
            </div>
            
            {/* Main Logo */}
            <div className="relative">
              <LockIcon className="h-6 w-6 text-primary neon-glow-cyan" />
            </div>
          </div>
          
          <h1 className="text-xl font-bold holographic-text" style={{ fontFamily: 'var(--font-display)' }}>
            LockBox
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {view === "chats" && (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Chatrooms
              </h2>
              {chatrooms.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No chatrooms yet</p>
              ) : (
                chatrooms.map(chatroom => (
                  <button
                    key={chatroom.id}
                    onClick={() => {
                      onSelectChatroom(chatroom.id);
                      setView("chat");
                    }}
                    data-testid={`chatroom-${chatroom.id}`}
                    className="w-full flex items-center gap-3 p-3 rounded-md hover-elevate active-elevate-2 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center neon-glow-cyan">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-display)' }}>
                        {chatroom.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {getChatroomLastMessage(chatroom.id)}
                      </p>
                    </div>
                  </button>
                ))
              )}

              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 mt-6" style={{ fontFamily: 'var(--font-display)' }}>
                Direct Messages
              </h2>
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No contacts yet</p>
              ) : (
                users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectFriend(user.id);
                      setView("chat");
                    }}
                    data-testid={`friend-${user.id}`}
                    className="w-full flex items-center gap-3 p-3 rounded-md hover-elevate active-elevate-2 text-left"
                  >
                    <UserAvatar
                      name={getUserDisplayName(user)}
                      size="md"
                      status={getUserStatus(user.id)}
                      src={user.profileImageUrl || undefined}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-display)' }}>
                        {getUserDisplayName(user)}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {getLastMessage(user.id)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {view === "contacts" && (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                All Contacts
              </h2>
              {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No contacts yet</p>
                </div>
              ) : (
                users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectFriend(user.id);
                      setView("chat");
                    }}
                    data-testid={`contact-${user.id}`}
                    className="w-full flex items-center gap-3 p-3 rounded-md hover-elevate active-elevate-2 text-left"
                  >
                    <UserAvatar
                      name={getUserDisplayName(user)}
                      size="md"
                      status={getUserStatus(user.id)}
                      src={user.profileImageUrl || undefined}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-display)' }}>
                        {getUserDisplayName(user)}
                      </h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {getUserStatus(user.id)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {view === "notes" && (
          <div className="h-full p-4 relative z-10">
            <CyberNotes />
          </div>
        )}

        {view === "stats" && (
          <div className="h-full p-4 relative z-10">
            <UserIntel />
          </div>
        )}

        {view === "profile" && (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <div className="flex flex-col items-center pt-8">
                <UserAvatar
                  name={getUserDisplayName(currentUser)}
                  size="lg"
                  status="online"
                  src={currentUser.profileImageUrl || undefined}
                />
                <h2 className="mt-4 text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {getUserDisplayName(currentUser)}
                </h2>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              </div>

              <div className="space-y-2 pt-4">
                <div className="glass-panel p-4 corner-brackets">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Security Status
                  </h3>
                  <div className="flex items-center gap-2 text-primary">
                    <LockIcon className="h-5 w-5 neon-glow-cyan" />
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>End-to-End Encryption</p>
                      <p className="text-xs text-muted-foreground">Signal Protocol Active</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="w-full hover-elevate active-elevate-2"
                  data-testid="button-logout-mobile"
                >
                  Logout
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="relative z-10 border-t bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-around p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("chats")}
            data-testid="tab-chats"
            className={cn(
              "flex-col h-auto py-2 px-2 hover-elevate",
              view === "chats" && "text-primary toggle-elevate toggle-elevated"
            )}
          >
            <MessageCircle className="h-4 w-4 mb-0.5" />
            <span className="text-[9px] font-medium uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Chats
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("contacts")}
            data-testid="tab-contacts"
            className={cn(
              "flex-col h-auto py-2 px-2 hover-elevate",
              view === "contacts" && "text-primary toggle-elevate toggle-elevated"
            )}
          >
            <Users className="h-4 w-4 mb-0.5" />
            <span className="text-[9px] font-medium uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Contacts
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("notes")}
            data-testid="tab-notes"
            className={cn(
              "flex-col h-auto py-2 px-2 hover-elevate",
              view === "notes" && "text-primary toggle-elevate toggle-elevated"
            )}
          >
            <FileText className="h-4 w-4 mb-0.5" />
            <span className="text-[9px] font-medium uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Notes
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("stats")}
            data-testid="tab-stats"
            className={cn(
              "flex-col h-auto py-2 px-2 hover-elevate",
              view === "stats" && "text-primary toggle-elevate toggle-elevated"
            )}
          >
            <BarChart3 className="h-4 w-4 mb-0.5" />
            <span className="text-[9px] font-medium uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Stats
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("profile")}
            data-testid="tab-profile"
            className={cn(
              "flex-col h-auto py-2 px-2 hover-elevate",
              view === "profile" && "text-primary toggle-elevate toggle-elevated"
            )}
          >
            <User className="h-4 w-4 mb-0.5" />
            <span className="text-[9px] font-medium uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Profile
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
