import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all users (for finding friends to chat with)
  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const allUsers = await storage.getAllUsers();
      // Filter out current user
      const otherUsers = allUsers.filter(u => u.id !== currentUserId);
      res.json(otherUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get messages between two users (returns encrypted messages)
  app.get("/api/messages/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const otherUserId = req.params.userId;
      const messages = await storage.getMessagesBetweenUsers(currentUserId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get chat list with last messages
  app.get("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chats = await storage.getAllUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  // Get chatroom messages (returns encrypted messages)
  app.get("/api/chatroom/messages", isAuthenticated, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const messages = await storage.getChatroomMessages(limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chatroom messages:", error);
      res.status(500).json({ message: "Failed to fetch chatroom messages" });
    }
  });

  // Delete a private message
  app.delete("/api/messages/:messageId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageId = req.params.messageId;
      const success = await storage.deleteMessage(messageId, userId);
      
      if (success) {
        res.json({ success: true, messageId });
      } else {
        res.status(403).json({ message: "Not authorized to delete this message" });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Delete a chatroom message
  app.delete("/api/chatroom/messages/:messageId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageId = req.params.messageId;
      const success = await storage.deleteChatroomMessage(messageId, userId);
      
      if (success) {
        res.json({ success: true, messageId });
      } else {
        res.status(403).json({ message: "Not authorized to delete this message" });
      }
    } catch (error) {
      console.error("Error deleting chatroom message:", error);
      res.status(500).json({ message: "Failed to delete chatroom message" });
    }
  });

  const httpServer = createServer(app);

  // Socket.io setup for real-time messaging
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store user socket mappings
  const userSockets = new Map<string, string>();

  io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id);

    // User authentication and registration
    socket.on("register", (userId: string) => {
      userSockets.set(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} registered with socket ${socket.id}`);
      
      // Broadcast online status to all connected users
      io.emit("user-status", { userId, status: "online" });
    });

    // Handle sending encrypted messages
    socket.on("send-message", async (data: { recipientId: string; encryptedContent: string; senderId: string }) => {
      try {
        const { recipientId, encryptedContent, senderId } = data;

        // Save encrypted message to database
        const message = await storage.createMessage({
          senderId,
          recipientId,
          encryptedContent,
        });

        // Send to recipient if online
        const recipientSocketId = userSockets.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receive-message", message);
        }

        // Confirm to sender
        socket.emit("message-sent", message);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message-error", { error: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing", (data: { recipientId: string; senderId: string; isTyping: boolean }) => {
      const recipientSocketId = userSockets.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("user-typing", {
          senderId: data.senderId,
          isTyping: data.isTyping,
        });
      }
    });

    // Handle chatroom message
    socket.on("send-chatroom-message", async (data: { encryptedContent: string; senderId: string }) => {
      try {
        const { encryptedContent, senderId } = data;

        // Save encrypted message to database
        const message = await storage.createChatroomMessage({
          senderId,
          encryptedContent,
        });

        // Broadcast to all connected users
        io.emit("receive-chatroom-message", message);
      } catch (error) {
        console.error("Error sending chatroom message:", error);
        socket.emit("chatroom-message-error", { error: "Failed to send chatroom message" });
      }
    });

    // Handle private message deletion
    socket.on("delete-message", async (data: { messageId: string; userId: string; recipientId: string }) => {
      try {
        const { messageId, userId, recipientId } = data;
        const success = await storage.deleteMessage(messageId, userId);
        
        if (success) {
          // Notify both sender and recipient
          socket.emit("message-deleted", { messageId });
          const recipientSocketId = userSockets.get(recipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("message-deleted", { messageId });
          }
        }
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    });

    // Handle chatroom message deletion
    socket.on("delete-chatroom-message", async (data: { messageId: string; userId: string }) => {
      try {
        const { messageId, userId } = data;
        const success = await storage.deleteChatroomMessage(messageId, userId);
        
        if (success) {
          // Broadcast deletion to all users
          io.emit("chatroom-message-deleted", { messageId });
        }
      } catch (error) {
        console.error("Error deleting chatroom message:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      
      // Find and remove user from mapping
      for (const [userId, socketId] of Array.from(userSockets.entries())) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          io.emit("user-status", { userId, status: "offline" });
          break;
        }
      }
    });
  });

  return httpServer;
}
