import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import FriendListItem from "@/components/FriendListItem";
import MessageBubble from "@/components/MessageBubble";
import MessageInput from "@/components/MessageInput";
import ChatHeader from "@/components/ChatHeader";
import UserAvatar from "@/components/UserAvatar";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import { encryptMessage, decryptMessage } from "@/lib/encryption";
import type { User, Message } from "@shared/schema";

interface DecryptedMessage extends Omit<Message, 'encryptedContent'> {
  content: string;
}

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [userStatuses, setUserStatuses] = useState<Map<string, "online" | "offline">>(new Map());

  // Fetch current user from auth
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Fetch all users (friends)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch encrypted messages for active friend
  const { data: chatMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", activeFriendId],
    enabled: !!activeFriendId,
  });

  // Decrypt and load messages when chat changes
  useEffect(() => {
    if (chatMessages) {
      const decryptedMessages = chatMessages.map(msg => ({
        ...msg,
        content: decryptMessage(msg.encryptedContent),
        createdAt: new Date(msg.createdAt!),
      }));
      setMessages(decryptedMessages);
    }
  }, [chatMessages]);

  // Socket.io for real-time messaging
  const handleMessageReceived = useCallback((message: Message) => {
    // Only add message if it's for the active chat
    if (
      activeFriendId &&
      ((message.senderId === activeFriendId && message.recipientId === currentUser?.id) ||
        (message.senderId === currentUser?.id && message.recipientId === activeFriendId))
    ) {
      const decryptedMessage: DecryptedMessage = {
        ...message,
        content: decryptMessage(message.encryptedContent),
        createdAt: new Date(message.createdAt!),
      };
      setMessages((prev) => [...prev, decryptedMessage]);
    }
  }, [activeFriendId, currentUser?.id]);

  const handleUserStatus = useCallback((data: { userId: string; status: string }) => {
    setUserStatuses((prev) => new Map(prev).set(data.userId, data.status as "online" | "offline"));
  }, []);

  const { sendMessage } = useSocket({
    userId: currentUser?.id,
    onMessageReceived: handleMessageReceived,
    onUserStatus: handleUserStatus,
  });

  const handleSendMessage = (content: string) => {
    if (activeFriendId && currentUser) {
      // Encrypt message before sending
      const encryptedContent = encryptMessage(content);
      sendMessage(activeFriendId, encryptedContent);
      
      // Optimistically add the decrypted message to UI
      const newMessage: DecryptedMessage = {
        id: String(Date.now()),
        content,
        senderId: currentUser.id,
        recipientId: activeFriendId,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const activeFriend = users.find((u) => u.id === activeFriendId);
  const filteredUsers = users.filter((u) =>
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMessageDisplay = (msg: DecryptedMessage, idx: number) => {
    const isOwn = msg.senderId === currentUser?.id;
    const prevMsg = idx > 0 ? messages[idx - 1] : null;
    const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
    
    const senderUser = isOwn 
      ? currentUser 
      : users.find((u) => u.id === msg.senderId);
    
    const senderName = isOwn 
      ? "You" 
      : senderUser 
        ? `${senderUser.firstName || ""} ${senderUser.lastName || ""}`.trim() || senderUser.email || "Unknown"
        : "Unknown";

    return {
      isOwn,
      showAvatar,
      sender: {
        name: senderName,
        avatar: senderUser?.profileImageUrl || undefined,
      },
    };
  };

  const getUserDisplayName = (user: User) => {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";
  };

  const getUserStatus = (userId: string): "online" | "away" | "offline" => {
    return userStatuses.get(userId) || "offline";
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          "w-80 border-r bg-sidebar flex flex-col transition-all duration-300",
          !sidebarOpen && "w-0 overflow-hidden lg:w-80"
        )}
      >
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <UserAvatar 
                name={getUserDisplayName(currentUser)} 
                src={currentUser.profileImageUrl || undefined} 
                size="md" 
                status="online" 
              />
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate" data-testid="text-current-user">
                  {getUserDisplayName(currentUser)}
                </h3>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-friends"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No other users yet. Invite friends to join!
              </div>
            ) : (
              filteredUsers.map((user) => (
                <FriendListItem
                  key={user.id}
                  id={user.id}
                  name={getUserDisplayName(user)}
                  avatar={user.profileImageUrl || undefined}
                  status={getUserStatus(user.id)}
                  isActive={user.id === activeFriendId}
                  onClick={() => setActiveFriendId(user.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col">
        {activeFriend ? (
          <>
            <div className="lg:hidden p-2 border-b flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-toggle-sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            <ChatHeader
              friend={{
                name: getUserDisplayName(activeFriend),
                avatar: activeFriend.profileImageUrl || undefined,
                status: getUserStatus(activeFriend.id),
              }}
              onVoiceCall={() => console.log("Voice call")}
              onVideoCall={() => console.log("Video call")}
              onSettings={() => console.log("Settings")}
            />
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-1">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const { isOwn, showAvatar, sender } = getMessageDisplay(msg, idx);
                    return (
                      <MessageBubble
                        key={msg.id}
                        id={msg.id}
                        content={msg.content}
                        sender={sender}
                        timestamp={msg.createdAt!}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                      />
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-lg">Select a friend to start chatting</p>
              {users.length === 0 && (
                <p className="text-sm">Invite friends to join SecureChat!</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
