import { useState } from "react";
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

import avatar1 from "@assets/generated_images/Female_user_avatar_portrait_abd7f3c7.png";
import avatar2 from "@assets/generated_images/Male_user_avatar_portrait_9b21d128.png";
import avatar3 from "@assets/generated_images/User_avatar_portrait_three_815e8396.png";
import avatar4 from "@assets/generated_images/User_avatar_portrait_four_4d673272.png";

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
}

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  lastMessage?: string;
  unreadCount?: number;
}

interface ChatPageProps {
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  onLogout: () => void;
}

export default function ChatPage({ currentUser, onLogout }: ChatPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [friends] = useState<Friend[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      avatar: avatar1,
      status: "online",
      lastMessage: "Hey! Are we still on for tonight?",
      unreadCount: 3,
    },
    {
      id: "2",
      name: "Mike Chen",
      avatar: avatar2,
      status: "away",
      lastMessage: "I'll send you the files tomorrow",
    },
    {
      id: "3",
      name: "Emma Wilson",
      avatar: avatar3,
      status: "offline",
      lastMessage: "Thanks for your help!",
    },
    {
      id: "4",
      name: "Alex Taylor",
      avatar: avatar4,
      status: "online",
      lastMessage: "See you soon!",
    },
  ]);

  const [activeFriendId, setActiveFriendId] = useState("1");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hey! How's everything going?",
      senderId: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "2",
      content: "Great! Just finished that project I was telling you about.",
      senderId: currentUser.id,
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
    },
    {
      id: "3",
      content: "That's awesome! How did it turn out?",
      senderId: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
    },
    {
      id: "4",
      content: "Better than expected. The client loved it!",
      senderId: currentUser.id,
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: "5",
      content: "So proud of you! We should celebrate sometime.",
      senderId: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
    },
    {
      id: "6",
      content: "Definitely! Are we still on for tonight?",
      senderId: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
  ]);

  const activeFriend = friends.find((f) => f.id === activeFriendId);
  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: String(Date.now()),
      content,
      senderId: currentUser.id,
      timestamp: new Date(),
    };
    setMessages([...messages, newMessage]);
  };

  const getMessageDisplay = (msg: Message, idx: number) => {
    const isOwn = msg.senderId === currentUser.id;
    const prevMsg = idx > 0 ? messages[idx - 1] : null;
    const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
    const sender = isOwn
      ? currentUser
      : friends.find((f) => f.id === msg.senderId) || { name: "Unknown", avatar: undefined };

    return {
      isOwn,
      showAvatar,
      sender,
    };
  };

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
              <UserAvatar name={currentUser.name} src={currentUser.avatar} size="md" status="online" />
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate" data-testid="text-current-user">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                size="icon"
                variant="ghost"
                onClick={onLogout}
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
            {filteredFriends.map((friend) => (
              <FriendListItem
                key={friend.id}
                {...friend}
                isActive={friend.id === activeFriendId}
                onClick={() => setActiveFriendId(friend.id)}
              />
            ))}
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
              friend={activeFriend}
              onVoiceCall={() => console.log("Voice call")}
              onVideoCall={() => console.log("Video call")}
              onSettings={() => console.log("Settings")}
            />
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-1">
                {messages.map((msg, idx) => {
                  const { isOwn, showAvatar, sender } = getMessageDisplay(msg, idx);
                  return (
                    <MessageBubble
                      key={msg.id}
                      id={msg.id}
                      content={msg.content}
                      sender={sender}
                      timestamp={msg.timestamp}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                    />
                  );
                })}
              </div>
            </ScrollArea>
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a friend to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
}
