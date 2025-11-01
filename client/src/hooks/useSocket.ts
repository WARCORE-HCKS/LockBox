import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Message, ChatroomMessage } from "@shared/schema";

interface UseSocketOptions {
  userId?: string;
  onMessageReceived?: (message: Message) => void;
  onChatroomMessageReceived?: (message: ChatroomMessage) => void;
  onUserStatus?: (data: { userId: string; status: string }) => void;
  onUserTyping?: (data: { senderId: string; isTyping: boolean }) => void;
}

export function useSocket({ userId, onMessageReceived, onChatroomMessageReceived, onUserStatus, onUserTyping }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    const socket = io({
      path: "/socket.io",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      // Register user with their ID
      socket.emit("register", userId);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("receive-message", (message: Message) => {
      console.log("Message received:", message);
      onMessageReceived?.(message);
    });

    socket.on("receive-chatroom-message", (message: ChatroomMessage) => {
      console.log("Chatroom message received:", message);
      onChatroomMessageReceived?.(message);
    });

    socket.on("user-status", (data: { userId: string; status: string }) => {
      onUserStatus?.(data);
    });

    socket.on("user-typing", (data: { senderId: string; isTyping: boolean }) => {
      onUserTyping?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, onMessageReceived, onChatroomMessageReceived, onUserStatus, onUserTyping]);

  const sendMessage = (recipientId: string, encryptedContent: string) => {
    if (socketRef.current && userId) {
      socketRef.current.emit("send-message", {
        recipientId,
        encryptedContent,
        senderId: userId,
      });
    }
  };

  const sendChatroomMessage = (encryptedContent: string) => {
    if (socketRef.current && userId) {
      socketRef.current.emit("send-chatroom-message", {
        encryptedContent,
        senderId: userId,
      });
    }
  };

  const sendTypingIndicator = (recipientId: string, isTyping: boolean) => {
    if (socketRef.current && userId) {
      socketRef.current.emit("typing", {
        recipientId,
        senderId: userId,
        isTyping,
      });
    }
  };

  return {
    isConnected,
    sendMessage,
    sendChatroomMessage,
    sendTypingIndicator,
  };
}
