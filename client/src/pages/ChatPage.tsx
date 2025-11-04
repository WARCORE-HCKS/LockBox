import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, LogOut, Menu, Users, Shield, User as UserIcon, ChevronDown, ChevronUp, Plus, MessageCircle, Lock as LockIconLucide } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FriendListItem from "@/components/FriendListItem";
import MessageBubble from "@/components/MessageBubble";
import MessageInput from "@/components/MessageInput";
import ChatHeader from "@/components/ChatHeader";
import UserAvatar from "@/components/UserAvatar";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import { useSignalKeyInit } from "@/hooks/useSignalKeyInit";
import { encryptMessage, decryptMessage, encryptPrivateMessage, decryptPrivateMessage } from "@/lib/encryption";
import { sentMessageCache } from "@/lib/sentMessageCache";
import type { User, Message, ChatroomMessage, Chatroom } from "@shared/schema";
import LockIcon from "@/components/LockIcon";

interface DecryptedMessage extends Omit<Message, 'encryptedContent'> {
  content: string;
}

interface DecryptedChatroomMessage extends Omit<ChatroomMessage, 'encryptedContent'> {
  content: string;
}

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  const [activeChatroomId, setActiveChatroomId] = useState<string | null>(null);
  const [isChatroomActive, setIsChatroomActive] = useState(false);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [chatroomMessages, setChatroomMessages] = useState<DecryptedChatroomMessage[]>([]);
  const [userStatuses, setUserStatuses] = useState<Map<string, "online" | "offline">>(new Map());
  const [chatroomsExpanded, setChatroomsExpanded] = useState(true);
  const [usersExpanded, setUsersExpanded] = useState(true);
  const [createChatroomDialogOpen, setCreateChatroomDialogOpen] = useState(false);
  
  const { toast } = useToast();

  // Initialize Signal Protocol E2E encryption keys automatically
  const { isInitialized: signalKeysInitialized, error: signalKeyError } = useSignalKeyInit();

  // Show error if Signal key initialization fails
  useEffect(() => {
    if (signalKeyError) {
      toast({
        title: "Encryption Setup Failed",
        description: "Failed to initialize end-to-end encryption. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [signalKeyError, toast]);

  // Form schema for create chatroom
  const createChatroomSchema = z.object({
    name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
    description: z.string().max(200, "Description must be 200 characters or less").optional(),
  });

  type CreateChatroomForm = z.infer<typeof createChatroomSchema>;

  const createChatroomForm = useForm<CreateChatroomForm>({
    resolver: zodResolver(createChatroomSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch current user from auth
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Fetch all users (friends)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch all chatrooms
  const { data: chatrooms = [] } = useQuery<Chatroom[]>({
    queryKey: ["/api/chatrooms"],
  });

  // Fetch encrypted messages for active friend
  const { data: chatMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", activeFriendId],
    enabled: !!activeFriendId && !isChatroomActive,
  });

  // Fetch encrypted chatroom messages
  const { data: chatroomMessagesData = [] } = useQuery<ChatroomMessage[]>({
    queryKey: ["/api/chatroom/messages", activeChatroomId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeChatroomId) {
        params.append("chatroomId", activeChatroomId);
      }
      const response = await fetch(`/api/chatroom/messages?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch chatroom messages");
      return response.json();
    },
    enabled: isChatroomActive && !!activeChatroomId,
  });

  // Fetch user's chatrooms to check count
  const { data: userChatrooms = [] } = useQuery<Chatroom[]>({
    queryKey: ["/api/my-chatrooms"],
  });

  // Create chatroom mutation
  const createChatroomMutation = useMutation({
    mutationFn: async (data: CreateChatroomForm) => {
      return await apiRequest("POST", "/api/my-chatrooms", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatrooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-chatrooms"] });
      toast({
        title: "Success",
        description: "Chatroom created successfully",
      });
      setCreateChatroomDialogOpen(false);
      createChatroomForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create chatroom",
        variant: "destructive",
      });
    },
  });

  const handleCreateChatroom = (data: CreateChatroomForm) => {
    // Check if user has reached max chatrooms
    if (userChatrooms.length >= 3) {
      toast({
        title: "Limit reached",
        description: "You can only create up to 3 chatrooms",
        variant: "destructive",
      });
      return;
    }
    createChatroomMutation.mutate(data);
  };

  // Decrypt and load messages when chat changes (Signal Protocol for private messages)
  useEffect(() => {
    if (chatMessages && !isChatroomActive && activeFriendId) {
      const currentFriendId = activeFriendId; // Capture for async closure
      
      const decryptMessages = async () => {
        const decryptedMessages: DecryptedMessage[] = [];
        
        for (const msg of chatMessages) {
          try {
            let content: string;
            
            // Check if this is a message we sent
            if (msg.senderId === currentUser?.id) {
              // Try to get from local cache first
              const cached = await sentMessageCache.getSentMessage(msg.id);
              if (cached) {
                content = cached;
              } else {
                // Fallback: we can't decrypt our own sent messages with Signal Protocol
                content = "[Your message - plaintext not cached]";
              }
            } else {
              // Message from the other person - decrypt using Signal Protocol
              const senderUserId = msg.senderId;
              content = await decryptPrivateMessage(senderUserId, msg.encryptedContent);
            }
            
            decryptedMessages.push({
              ...msg,
              content,
              createdAt: new Date(msg.createdAt!),
            });
          } catch (error) {
            console.error("Failed to decrypt message:", error);
            // Fallback to showing error message
            decryptedMessages.push({
              ...msg,
              content: "[Unable to decrypt - encryption error]",
              createdAt: new Date(msg.createdAt!),
            });
          }
        }
        
        // Only update state if we're still on the same chat (prevent race conditions)
        if (currentFriendId === activeFriendId) {
          setMessages(decryptedMessages);
        }
      };
      
      decryptMessages();
    }
  }, [chatMessages, isChatroomActive, activeFriendId, currentUser?.id]);

  // Decrypt and load chatroom messages
  useEffect(() => {
    if (chatroomMessagesData && isChatroomActive) {
      const decryptedMessages = chatroomMessagesData.map(msg => ({
        ...msg,
        content: decryptMessage(msg.encryptedContent, true), // Use chatroom key
        createdAt: new Date(msg.createdAt!),
      }));
      setChatroomMessages(decryptedMessages);
    }
  }, [chatroomMessagesData, isChatroomActive]);

  // Socket.io for real-time messaging (Signal Protocol for private messages)
  const handleMessageReceived = useCallback(async (message: Message) => {
    // Only add message if it's for the active chat and we're in private chat mode
    if (
      !isChatroomActive &&
      activeFriendId &&
      ((message.senderId === activeFriendId && message.recipientId === currentUser?.id) ||
        (message.senderId === currentUser?.id && message.recipientId === activeFriendId))
    ) {
      let content: string;
      
      try {
        // Check if this is our own sent message (echo from server)
        if (message.senderId === currentUser?.id) {
          // Find the optimistic message by checking recent messages with temp IDs
          const tempMessage = messages.find(m => 
            m.id.startsWith('temp-') && 
            m.recipientId === message.recipientId &&
            Math.abs(m.createdAt.getTime() - new Date(message.createdAt!).getTime()) < 5000
          );
          
          if (tempMessage) {
            // Use content from optimistic message and cache with real ID
            content = tempMessage.content;
            await sentMessageCache.storeSentMessage(message.id, content);
            
            // Remove the temporary message from state
            setMessages((prev) => prev.filter(m => m.id !== tempMessage.id));
          } else {
            // Try to get from local cache
            const cached = await sentMessageCache.getSentMessage(message.id);
            if (cached) {
              content = cached;
            } else {
              // Fallback: we can't decrypt our own sent messages
              content = "[Your message - plaintext not cached]";
            }
          }
        } else {
          // Message from the other person - decrypt using Signal Protocol
          const senderUserId = message.senderId;
          content = await decryptPrivateMessage(senderUserId, message.encryptedContent);
        }
        
        const decryptedMessage: DecryptedMessage = {
          ...message,
          content,
          createdAt: new Date(message.createdAt!),
        };
        
        // Check if message already exists (avoid duplicates)
        setMessages((prev) => {
          const exists = prev.some(m => m.id === message.id);
          if (exists) {
            return prev;
          }
          return [...prev, decryptedMessage];
        });
      } catch (error) {
        console.error("Failed to decrypt incoming message:", error);
        
        // Still add the message with an error placeholder (don't silently drop)
        const fallbackMessage: DecryptedMessage = {
          ...message,
          content: "[Unable to decrypt - encryption error]",
          createdAt: new Date(message.createdAt!),
        };
        
        setMessages((prev) => {
          const exists = prev.some(m => m.id === message.id);
          if (exists) {
            return prev;
          }
          return [...prev, fallbackMessage];
        });
      }
    }
  }, [activeFriendId, currentUser?.id, isChatroomActive, messages]);

  const handleChatroomMessageReceived = useCallback((message: ChatroomMessage) => {
    // Only add message if it's for the currently active chatroom
    if (message.chatroomId !== activeChatroomId) {
      return; // Ignore messages from other chatrooms
    }

    const decryptedMessage: DecryptedChatroomMessage = {
      ...message,
      content: decryptMessage(message.encryptedContent, true), // Use chatroom key
      createdAt: new Date(message.createdAt!),
    };
    
    // Check if message already exists (avoid duplicates from optimistic updates)
    setChatroomMessages((prev) => {
      const exists = prev.some(m => m.id === message.id);
      if (exists) {
        return prev;
      }
      return [...prev, decryptedMessage];
    });
  }, [activeChatroomId]);

  const handleUserStatus = useCallback((data: { userId: string; status: string }) => {
    setUserStatuses((prev) => new Map(prev).set(data.userId, data.status as "online" | "offline"));
  }, []);

  const handleMessageDeleted = useCallback((data: { messageId: string }) => {
    setMessages((prev) => prev.filter(m => m.id !== data.messageId));
  }, []);

  const handleChatroomMessageDeleted = useCallback((data: { messageId: string }) => {
    setChatroomMessages((prev) => prev.filter(m => m.id !== data.messageId));
  }, []);

  const { sendMessage, sendChatroomMessage, deleteMessage, deleteChatroomMessage } = useSocket({
    userId: currentUser?.id,
    onMessageReceived: handleMessageReceived,
    onChatroomMessageReceived: handleChatroomMessageReceived,
    onUserStatus: handleUserStatus,
    onMessageDeleted: handleMessageDeleted,
    onChatroomMessageDeleted: handleChatroomMessageDeleted,
  });

  const handleSendMessage = async (content: string) => {
    if (isChatroomActive && currentUser && activeChatroomId) {
      // Send to chatroom with shared chatroom key (legacy encryption)
      const encryptedContent = encryptMessage(content, true);
      sendChatroomMessage(encryptedContent, activeChatroomId);
      
      // Don't add optimistically - wait for server broadcast to avoid duplicates
      // The server will broadcast it back to all users including sender
    } else if (activeFriendId && currentUser) {
      try {
        // Generate temporary message ID for optimistic UI update
        const tempId = `temp-${Date.now()}`;
        
        // Send to private chat using Signal Protocol E2E encryption
        const encryptedContent = await encryptPrivateMessage(activeFriendId, content);
        sendMessage(activeFriendId, encryptedContent);
        
        // Cache the plaintext locally (we'll need it to decrypt our own messages later)
        // Note: Real message ID from server will be different, but we'll cache with that too
        await sentMessageCache.storeSentMessage(tempId, content);
        
        // Optimistically add the decrypted message to UI
        const newMessage: DecryptedMessage = {
          id: tempId,
          content,
          senderId: currentUser.id,
          recipientId: activeFriendId,
          deletedAt: null,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);
      } catch (error) {
        console.error("Failed to encrypt and send message:", error);
        toast({
          title: "Send Failed",
          description: "Failed to encrypt message. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeletePrivateMessage = (messageId: string) => {
    if (activeFriendId && currentUser) {
      deleteMessage(messageId, activeFriendId);
      // Optimistically remove from UI
      setMessages((prev) => prev.filter(m => m.id !== messageId));
    }
  };

  const handleDeleteChatroomMessage = (messageId: string) => {
    if (currentUser && activeChatroomId) {
      deleteChatroomMessage(messageId, activeChatroomId);
      // Optimistically remove from UI
      setChatroomMessages((prev) => prev.filter(m => m.id !== messageId));
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleSelectChatroom = (chatroomId: string) => {
    setActiveChatroomId(chatroomId);
    setIsChatroomActive(true);
    setActiveFriendId(null); // Clear active friend when entering chatroom
    setMessages([]); // Clear private messages
  };

  const handleSelectFriend = (friendId: string) => {
    setIsChatroomActive(false);
    setActiveFriendId(friendId);
    setChatroomMessages([]); // Clear chatroom messages when entering private chat
  };

  const activeFriend = users.find((u) => u.id === activeFriendId);
  const filteredUsers = users.filter((u) =>
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPrivateMessageDisplay = (msg: DecryptedMessage, idx: number) => {
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

  const getChatroomMessageDisplay = (msg: DecryptedChatroomMessage, idx: number) => {
    const isOwn = msg.senderId === currentUser?.id;
    const prevMsg = idx > 0 ? chatroomMessages[idx - 1] : null;
    const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
    
    const senderUser = users.find((u) => u.id === msg.senderId) || currentUser;
    const senderName = isOwn 
      ? "You" 
      : senderUser 
        ? `${senderUser.firstName || ""} ${senderUser.lastName || ""}`.trim() || senderUser.email || "Unknown"
        : "Unknown";

    const activeChatroom = chatrooms.find(c => c.id === activeChatroomId);
    const isOwner = !isOwn && activeChatroom?.createdBy === msg.senderId;

    return {
      isOwn,
      showAvatar,
      isOwner,
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
          <div className="flex items-center justify-center gap-2 pb-2">
            <LockIcon className="h-7 w-auto text-foreground" />
            <h1 className="text-lg font-bold">LockBox</h1>
          </div>
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
          
          <div className="space-y-2">
            <Link href="/profile">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                data-testid="button-profile"
              >
                <UserIcon className="h-4 w-4" />
                My Profile
              </Button>
            </Link>
            
            {currentUser.isAdmin && (
              <Link href="/admin">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  data-testid="button-admin-panel"
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            )}
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
          <div className="p-2 space-y-2">
            {/* Chatrooms Section */}
            <div>
              <button
                onClick={() => setChatroomsExpanded(!chatroomsExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-md hover-elevate"
                data-testid="button-toggle-chatrooms"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Chatrooms</span>
                  <span className="text-xs text-muted-foreground">({chatrooms.length})</span>
                </div>
                {chatroomsExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {chatroomsExpanded && (
                <div className="mt-1 space-y-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => setCreateChatroomDialogOpen(true)}
                    data-testid="button-create-chatroom"
                  >
                    <Plus className="h-4 w-4" />
                    Create Chatroom
                  </Button>

                  {chatrooms.length > 0 ? (
                    chatrooms.map((chatroom) => (
                      <div
                        key={chatroom.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors hover-elevate",
                          isChatroomActive && activeChatroomId === chatroom.id && "bg-accent"
                        )}
                        onClick={() => handleSelectChatroom(chatroom.id)}
                        data-testid={`button-chatroom-${chatroom.id}`}
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{chatroom.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {chatroom.description || "Group conversation"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No chatrooms yet
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Users Section */}
            <div>
              <button
                onClick={() => setUsersExpanded(!usersExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-md hover-elevate"
                data-testid="button-toggle-users"
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Friends</span>
                  <span className="text-xs text-muted-foreground">({filteredUsers.length})</span>
                </div>
                {usersExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {usersExpanded && (
                <div className="mt-1 space-y-1">
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
                        isActive={user.id === activeFriendId && !isChatroomActive}
                        onClick={() => handleSelectFriend(user.id)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col">
        {isChatroomActive ? (
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
                name: chatrooms.find(c => c.id === activeChatroomId)?.name || "Chatroom",
                avatar: undefined,
                status: "online",
              }}
            />
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-1">
                {chatroomMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <MessageCircle className="h-8 w-8" />
                    </div>
                    <p className="text-base font-medium mb-1">No messages yet</p>
                    <p className="text-sm opacity-70">Start the conversation!</p>
                  </div>
                ) : (
                  chatroomMessages.map((msg, idx) => {
                    const { isOwn, showAvatar, isOwner, sender } = getChatroomMessageDisplay(msg, idx);
                    return (
                      <MessageBubble
                        key={msg.id}
                        id={msg.id}
                        content={msg.content}
                        sender={sender}
                        timestamp={msg.createdAt!}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        isOwner={isOwner}
                        onDelete={handleDeleteChatroomMessage}
                      />
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : activeFriend ? (
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
            />
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-1">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <LockIconLucide className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-base font-medium mb-1">End-to-end encrypted chat</p>
                    <p className="text-sm opacity-70">Send your first secure message</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const { isOwn, showAvatar, sender } = getPrivateMessageDisplay(msg, idx);
                    return (
                      <MessageBubble
                        key={msg.id}
                        id={msg.id}
                        content={msg.content}
                        sender={sender}
                        timestamp={msg.createdAt!}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        onDelete={handleDeletePrivateMessage}
                      />
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-4 max-w-md px-6">
              <div className="rounded-full bg-primary/10 p-6 w-24 h-24 mx-auto flex items-center justify-center">
                <LockIconLucide className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Your messages are private</h3>
                <p className="text-muted-foreground">
                  {users.length === 0 
                    ? "Invite friends to start secure conversations with end-to-end encryption"
                    : "Select a friend or chatroom to start chatting securely"
                  }
                </p>
              </div>
              <div className="flex items-center gap-2 justify-center pt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-full border">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>Signal Protocol</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Chatroom Dialog */}
      <Dialog open={createChatroomDialogOpen} onOpenChange={setCreateChatroomDialogOpen}>
        <DialogContent data-testid="dialog-create-chatroom">
          <DialogHeader>
            <DialogTitle>Create Chatroom</DialogTitle>
            <DialogDescription>
              Create a new chatroom for group conversations. You can create up to 3 chatrooms.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createChatroomForm}>
            <form onSubmit={createChatroomForm.handleSubmit(handleCreateChatroom)} className="space-y-4">
              <FormField
                control={createChatroomForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chatroom Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter chatroom name" 
                        data-testid="input-chatroom-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createChatroomForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter chatroom description" 
                        data-testid="input-chatroom-description"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {userChatrooms.length} / 3 chatrooms created
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateChatroomDialogOpen(false)}
                    data-testid="button-cancel-create-chatroom"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createChatroomMutation.isPending}
                    data-testid="button-submit-create-chatroom"
                  >
                    {createChatroomMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
