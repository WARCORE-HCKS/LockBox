import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Message, ChatroomMessage } from "@shared/schema";

interface UseSocketOptions {
  userId?: string;
  onMessageReceived?: (message: Message) => void;
  onChatroomMessageReceived?: (message: ChatroomMessage) => void;
  onUserStatus?: (data: { userId: string; status: string }) => void;
  onUserTyping?: (data: { senderId: string; isTyping: boolean }) => void;
  onMessageDeleted?: (data: { messageId: string }) => void;
  onChatroomMessageDeleted?: (data: { messageId: string }) => void;
}

export function useSocket({ 
  userId, 
  onMessageReceived, 
  onChatroomMessageReceived, 
  onUserStatus, 
  onUserTyping,
  onMessageDeleted,
  onChatroomMessageDeleted
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    const socket = io({
      path: "/socket.io",
      withCredentials: true, // Enable credentials to send session cookies
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      // Register user (userId is authenticated server-side from session)
      socket.emit("register");
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

    socket.on("message-deleted", (data: { messageId: string }) => {
      console.log("Message deleted:", data);
      onMessageDeleted?.(data);
    });

    socket.on("chatroom-message-deleted", (data: { messageId: string }) => {
      console.log("Chatroom message deleted:", data);
      onChatroomMessageDeleted?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, onMessageReceived, onChatroomMessageReceived, onUserStatus, onUserTyping, onMessageDeleted, onChatroomMessageDeleted]);

  const sendMessage = (recipientId: string, encryptedContent: string) => {
    if (socketRef.current && userId) {
      // senderId is authenticated server-side from session, not sent from client
      socketRef.current.emit("send-message", {
        recipientId,
        encryptedContent,
      });
    }
  };

  const sendChatroomMessage = (encryptedContent: string) => {
    if (socketRef.current && userId) {
      // senderId is authenticated server-side from session, not sent from client
      socketRef.current.emit("send-chatroom-message", {
        encryptedContent,
      });
    }
  };

  const sendTypingIndicator = (recipientId: string, isTyping: boolean) => {
    if (socketRef.current && userId) {
      // senderId is authenticated server-side from session, not sent from client
      socketRef.current.emit("typing", {
        recipientId,
        isTyping,
      });
    }
  };

  const deleteMessage = (messageId: string, recipientId: string) => {
    if (socketRef.current && userId) {
      // userId is authenticated via socket session, not sent from client
      socketRef.current.emit("delete-message", {
        messageId,
        recipientId,
      });
    }
  };

  const deleteChatroomMessage = (messageId: string) => {
    if (socketRef.current && userId) {
      // userId is authenticated via socket session, not sent from client
      socketRef.current.emit("delete-chatroom-message", {
        messageId,
      });
    }
  };

  return {
    isConnected,
    sendMessage,
    sendChatroomMessage,
    sendTypingIndicator,
    deleteMessage,
    deleteChatroomMessage,
  };
}
