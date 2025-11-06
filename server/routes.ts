import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSession } from "./replitAuth";

// Middleware to check if user is banned (must be used after isAuthenticated)
const checkNotBanned = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }
    
    next();
  } catch (error) {
    console.error("Ban check middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin middleware
const isAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is banned
      if (user.isBanned) {
        return res.status(403).json({ message: "Your account has been banned" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch('/api/profile', isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const { updateUserProfileSchema } = await import("@shared/schema");
      const validationResult = updateUserProfileSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const updatedUser = await storage.updateUserProfile(userId, validationResult.data);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update user theme preference
  app.patch('/api/theme', isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const { updateThemeSchema } = await import("@shared/schema");
      const validationResult = updateThemeSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const updatedUser = await storage.updateUserTheme(userId, validationResult.data.theme);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating theme:", error);
      res.status(500).json({ message: "Failed to update theme" });
    }
  });

  // Get connection info (IP address, location)
  app.get('/api/connection-info', isAuthenticated, async (req: any, res) => {
    try {
      // Get IP from various headers (Replit, proxy, or direct)
      const ip = (req.headers['x-replit-user-ip'] || 
                  req.headers['x-forwarded-for'] || 
                  req.connection.remoteAddress || 
                  req.socket.remoteAddress ||
                  '127.0.0.1') as string;
      
      // Clean up IP (remove ::ffff: prefix if present)
      const cleanIp = ip.replace('::ffff:', '');
      
      // Simple location based on IP (could be enhanced with GeoIP service)
      let location = "Unknown";
      if (cleanIp.startsWith('127.') || cleanIp === 'localhost') {
        location = "Local";
      } else if (cleanIp.includes(':')) {
        location = "IPv6 Network";
      } else {
        location = "Global Network";
      }

      res.json({
        ip: cleanIp,
        location: location,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching connection info:", error);
      res.status(500).json({ message: "Failed to fetch connection info" });
    }
  });

  // Get all users (for finding friends to chat with)
  app.get("/api/users", isAuthenticated, checkNotBanned, async (req: any, res) => {
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
  app.get("/api/messages/:userId", isAuthenticated, checkNotBanned, async (req: any, res) => {
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
  app.get("/api/chats", isAuthenticated, checkNotBanned, async (req: any, res) => {
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
  app.get("/api/chatroom/messages", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const chatroomId = (req.query.chatroomId as string) || 'default-general';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const messages = await storage.getChatroomMessages(chatroomId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chatroom messages:", error);
      res.status(500).json({ message: "Failed to fetch chatroom messages" });
    }
  });

  // Delete a private message
  app.delete("/api/messages/:messageId", isAuthenticated, checkNotBanned, async (req: any, res) => {
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
  app.delete("/api/chatroom/messages/:messageId", isAuthenticated, checkNotBanned, async (req: any, res) => {
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

  // Get all chatrooms (for regular users to see available rooms)
  app.get("/api/chatrooms", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const chatrooms = await storage.getAllChatrooms();
      res.json(chatrooms);
    } catch (error) {
      console.error("Error fetching chatrooms:", error);
      res.status(500).json({ message: "Failed to fetch chatrooms" });
    }
  });

  // User-owned chatroom operations
  // Create a user chatroom (max 3 per user)
  app.post("/api/my-chatrooms", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const { insertChatroomSchema } = await import("@shared/schema");
      const validationResult = insertChatroomSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const chatroom = await storage.createUserChatroom(userId, validationResult.data);
      res.status(201).json(chatroom);
    } catch (error: any) {
      console.error("Error creating user chatroom:", error);
      if (error.message?.includes("maximum chatroom limit")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create chatroom" });
    }
  });

  // Get user's owned chatrooms
  app.get("/api/my-chatrooms", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatrooms = await storage.getUserOwnedChatrooms(userId);
      res.json(chatrooms);
    } catch (error) {
      console.error("Error fetching user chatrooms:", error);
      res.status(500).json({ message: "Failed to fetch chatrooms" });
    }
  });

  // Get chatroom members (for room owners)
  app.get("/api/chatrooms/:chatroomId/members", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatroomId = req.params.chatroomId;
      
      // Check if user is room owner
      const isOwner = await storage.isChatroomOwner(userId, chatroomId);
      if (!isOwner) {
        return res.status(403).json({ message: "Only room owners can view members" });
      }
      
      const members = await storage.getChatroomMembers(chatroomId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching chatroom members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Invite user to chatroom (room owner only)
  app.post("/api/chatrooms/:chatroomId/invite/:userId", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const ownerId = req.user.claims.sub;
      const chatroomId = req.params.chatroomId;
      const userId = req.params.userId;
      
      // Check if user is room owner
      const isOwner = await storage.isChatroomOwner(ownerId, chatroomId);
      if (!isOwner) {
        return res.status(403).json({ message: "Only room owners can invite users" });
      }
      
      await storage.addChatroomMember(userId, chatroomId);
      res.json({ message: "User invited successfully" });
    } catch (error) {
      console.error("Error inviting user:", error);
      res.status(500).json({ message: "Failed to invite user" });
    }
  });

  // Kick user from chatroom (room owner only)
  app.post("/api/chatrooms/:chatroomId/kick/:userId", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const ownerId = req.user.claims.sub;
      const chatroomId = req.params.chatroomId;
      const userId = req.params.userId;
      
      // Check if user is room owner
      const isOwner = await storage.isChatroomOwner(ownerId, chatroomId);
      if (!isOwner) {
        return res.status(403).json({ message: "Only room owners can kick users" });
      }
      
      // Remove from members and add to bans
      await storage.removeChatroomMember(userId, chatroomId);
      await storage.kickUserFromChatroom(userId, chatroomId);
      res.json({ message: "User kicked successfully" });
    } catch (error) {
      console.error("Error kicking user:", error);
      res.status(500).json({ message: "Failed to kick user" });
    }
  });

  // Get chatroom statistics (room owner only)
  app.get("/api/chatrooms/:chatroomId/stats", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatroomId = req.params.chatroomId;
      
      // Check if user is room owner
      const isOwner = await storage.isChatroomOwner(userId, chatroomId);
      if (!isOwner) {
        return res.status(403).json({ message: "Only room owners can view statistics" });
      }
      
      const stats = await storage.getChatroomStatistics(chatroomId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching chatroom stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // ========== SIGNAL PROTOCOL E2E ENCRYPTION ROUTES ==========
  
  // Upload user's identity key and prekey bundle
  app.post("/api/signal/keys", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { identityKey, signedPreKey, preKeys } = req.body;

      console.log(`[Signal Keys] POST /api/signal/keys - User: ${userId}`);
      console.log(`[Signal Keys] - Identity key length: ${identityKey?.length || 0}`);
      console.log(`[Signal Keys] - Signed prekey exists: ${!!signedPreKey}`);
      console.log(`[Signal Keys] - Prekeys count: ${preKeys?.length || 0}`);

      // Validate required fields
      if (!identityKey || !signedPreKey || !Array.isArray(preKeys)) {
        console.log(`[Signal Keys] ❌ Validation failed for user ${userId}`);
        return res.status(400).json({ message: "Missing required key data" });
      }

      // Store identity key
      await storage.storeIdentityKey(userId, identityKey);

      // Store signed prekey
      await storage.storeSignedPreKey(
        userId,
        signedPreKey.keyId,
        signedPreKey.publicKey,
        signedPreKey.signature
      );

      // Store prekeys
      await storage.storePreKeys(userId, preKeys);

      console.log(`[Signal Keys] ✅ Keys uploaded successfully for user ${userId}`);
      res.status(201).json({ message: "Keys uploaded successfully" });
    } catch (error) {
      console.error(`[Signal Keys] ❌ Error uploading keys for user:`, error);
      res.status(500).json({ message: "Failed to upload keys" });
    }
  });

  // Get a prekey bundle for a specific user (for initiating encrypted session)
  app.get("/api/signal/keys/:targetUserId", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const targetUserId = req.params.targetUserId;
      const requesterId = req.user.claims.sub;

      console.log(`[Signal Keys] GET /api/signal/keys/${targetUserId} - Requester: ${requesterId}`);

      // Get identity key
      const identityKey = await storage.getIdentityKey(targetUserId);
      if (!identityKey) {
        console.log(`[Signal Keys] ❌ 404 - User ${targetUserId} has no identity key`);
        return res.status(404).json({ message: "User has not set up encryption keys" });
      }

      // Get signed prekey
      const signedPreKey = await storage.getSignedPreKey(targetUserId);
      if (!signedPreKey) {
        console.log(`[Signal Keys] ❌ 404 - User ${targetUserId} has no signed prekey`);
        return res.status(404).json({ message: "User has no signed prekey" });
      }

      // Get one unused prekey
      const unusedPreKeys = await storage.getUnusedPreKeys(targetUserId, 1);
      const preKey = unusedPreKeys.length > 0 ? unusedPreKeys[0] : null;

      // If a prekey was provided, mark it as used
      if (preKey) {
        await storage.markPreKeyAsUsed(targetUserId, preKey.keyId);
      }

      console.log(`[Signal Keys] ✅ 200 - Returning prekey bundle for ${targetUserId}`);
      res.json({
        identityKey: identityKey.publicKey,
        signedPreKey: {
          keyId: signedPreKey.keyId,
          publicKey: signedPreKey.publicKey,
          signature: signedPreKey.signature,
        },
        preKey: preKey ? {
          keyId: preKey.keyId,
          publicKey: preKey.publicKey,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching prekey bundle:", error);
      res.status(500).json({ message: "Failed to fetch prekey bundle" });
    }
  });

  // Store a session with another user
  app.post("/api/signal/sessions/:recipientId", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recipientId = req.params.recipientId;
      const { sessionData } = req.body;

      if (!sessionData) {
        return res.status(400).json({ message: "Session data is required" });
      }

      await storage.storeSession(userId, recipientId, sessionData);
      res.status(201).json({ message: "Session stored successfully" });
    } catch (error) {
      console.error("Error storing session:", error);
      res.status(500).json({ message: "Failed to store session" });
    }
  });

  // Get session with another user
  app.get("/api/signal/sessions/:recipientId", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recipientId = req.params.recipientId;

      const session = await storage.getSession(userId, recipientId);
      if (!session) {
        return res.status(404).json({ message: "No session found" });
      }

      res.json({ sessionData: session.sessionData });
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // Delete session with another user
  app.delete("/api/signal/sessions/:recipientId", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recipientId = req.params.recipientId;

      const deleted = await storage.deleteSession(userId, recipientId);
      if (!deleted) {
        return res.status(404).json({ message: "No session found" });
      }

      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Replenish prekeys (when running low)
  app.post("/api/signal/keys/replenish", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { preKeys } = req.body;

      if (!Array.isArray(preKeys) || preKeys.length === 0) {
        return res.status(400).json({ message: "Prekeys array is required" });
      }

      await storage.storePreKeys(userId, preKeys);
      res.status(201).json({ message: "Prekeys replenished successfully" });
    } catch (error) {
      console.error("Error replenishing prekeys:", error);
      res.status(500).json({ message: "Failed to replenish prekeys" });
    }
  });

  // ========== ADMIN ROUTES ==========
  
  // Get all users (with admin status and online status)
  app.get("/api/admin/users", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user admin status (used by admin UI)
  app.patch("/api/admin/users/:userId/admin", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin: adminStatus } = req.body;
      
      if (typeof adminStatus !== 'boolean') {
        return res.status(400).json({ message: "Invalid admin status" });
      }

      const user = await storage.updateUserAdminStatus(userId, adminStatus);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user admin status:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Update user (general endpoint for admin status - for testing/API use)
  app.patch("/api/admin/users/:userId", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin: adminStatus } = req.body;
      
      if (adminStatus !== undefined) {
        if (typeof adminStatus !== 'boolean') {
          return res.status(400).json({ message: "Invalid admin status" });
        }

        const user = await storage.updateUserAdminStatus(userId, adminStatus);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        res.json(user);
      } else {
        return res.status(400).json({ message: "No valid fields to update" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:userId", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.claims.sub;
      
      // Prevent self-deletion
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get all chatrooms
  app.get("/api/admin/chatrooms", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const chatrooms = await storage.getAllChatrooms();
      res.json(chatrooms);
    } catch (error) {
      console.error("Error fetching chatrooms:", error);
      res.status(500).json({ message: "Failed to fetch chatrooms" });
    }
  });

  // Create chatroom
  app.post("/api/admin/chatrooms", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Chatroom name is required" });
      }

      const chatroom = await storage.createChatroom({ name, description });
      res.json(chatroom);
    } catch (error) {
      console.error("Error creating chatroom:", error);
      res.status(500).json({ message: "Failed to create chatroom" });
    }
  });

  // Update chatroom
  app.patch("/api/admin/chatrooms/:chatroomId", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { chatroomId } = req.params;
      const { name, description } = req.body;

      const chatroom = await storage.updateChatroom(chatroomId, { name, description });
      if (!chatroom) {
        return res.status(404).json({ message: "Chatroom not found" });
      }
      
      res.json(chatroom);
    } catch (error) {
      console.error("Error updating chatroom:", error);
      res.status(500).json({ message: "Failed to update chatroom" });
    }
  });

  // Delete chatroom
  app.delete("/api/admin/chatrooms/:chatroomId", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { chatroomId } = req.params;
      
      // Prevent deletion of default chatroom
      if (chatroomId === 'default-general') {
        return res.status(400).json({ message: "Cannot delete the default chatroom" });
      }

      const success = await storage.deleteChatroom(chatroomId);
      if (!success) {
        return res.status(404).json({ message: "Chatroom not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chatroom:", error);
      res.status(500).json({ message: "Failed to delete chatroom" });
    }
  });

  // Clear chatroom history
  app.delete("/api/admin/chatrooms/:chatroomId/messages", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { chatroomId } = req.params;
      const success = await storage.clearChatroomHistory(chatroomId);
      
      if (!success) {
        return res.status(404).json({ message: "No messages to clear or chatroom not found" });
      }
      
      res.json({ success: true, message: "Chatroom history cleared" });
    } catch (error) {
      console.error("Error clearing chatroom history:", error);
      res.status(500).json({ message: "Failed to clear chatroom history" });
    }
  });

  // Get chatroom statistics
  app.get("/api/admin/chatrooms/:chatroomId/stats", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { chatroomId } = req.params;
      const stats = await storage.getChatroomStatistics(chatroomId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting chatroom statistics:", error);
      res.status(500).json({ message: "Failed to get chatroom statistics" });
    }
  });

  // Ban user globally
  app.post("/api/admin/users/:userId/ban", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.banUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  // Unban user
  app.delete("/api/admin/users/:userId/ban", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.unbanUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  // Kick user from chatroom
  app.post("/api/admin/chatrooms/:chatroomId/kick/:userId", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { chatroomId, userId } = req.params;
      const ban = await storage.kickUserFromChatroom(userId, chatroomId);
      res.json(ban);
    } catch (error) {
      console.error("Error kicking user from chatroom:", error);
      res.status(500).json({ message: "Failed to kick user from chatroom" });
    }
  });

  // Unkick user from chatroom
  app.delete("/api/admin/chatrooms/:chatroomId/kick/:userId", isAuthenticated, checkNotBanned, isAdmin, async (req: any, res) => {
    try {
      const { chatroomId, userId } = req.params;
      const success = await storage.unkickUserFromChatroom(userId, chatroomId);
      
      if (!success) {
        return res.status(404).json({ message: "User not kicked from this chatroom" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error unkicking user from chatroom:", error);
      res.status(500).json({ message: "Failed to unkick user from chatroom" });
    }
  });

  const httpServer = createServer(app);

  // Socket.io setup for real-time messaging
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: true, // Allow credentials from any origin in development
      credentials: true, // Enable credentials (cookies, auth headers)
      methods: ["GET", "POST"],
    },
  });

  // Wrap session middleware for Socket.IO
  const sessionMiddleware = getSession();
  io.engine.use(sessionMiddleware);

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const req = socket.request as any;
    if (req.session?.passport?.user?.claims?.sub) {
      // Store authenticated user ID in socket data
      socket.data.userId = req.session.passport.user.claims.sub;
      next();
    } else {
      next(new Error("Unauthorized socket connection"));
    }
  });

  // Store user socket mappings (userId -> socketId)
  const userSockets = new Map<string, string>();

  // Now define the HTTP POST endpoint with access to io and userSockets
  app.post("/api/messages", isAuthenticated, checkNotBanned, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { recipientId, encryptedContent, clientMessageId } = req.body;

      if (!recipientId || !encryptedContent) {
        return res.status(400).json({ message: "recipientId and encryptedContent are required" });
      }

      console.log('[HTTP POST /api/messages] Creating message:', {
        senderId,
        recipientId,
        clientMessageId,
        hasEncryptedContent: !!encryptedContent
      });

      // Save encrypted message to database
      const message = await storage.createMessage({
        senderId,
        recipientId,
        encryptedContent,
        clientMessageId,
      });

      console.log('[HTTP POST /api/messages] Message created successfully:', message.id);

      // Send to recipient if online (same as socket handler)
      const recipientSocketId = userSockets.get(recipientId);
      console.log('[HTTP POST /api/messages] Recipient socket ID:', recipientSocketId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receive-message", message);
        console.log('[HTTP POST /api/messages] Message sent to recipient via socket');
      } else {
        console.log('[HTTP POST /api/messages] Recipient is offline - message stored for later');
      }

      // Return message to sender via HTTP response
      // (No socket echo needed - if sender used HTTP, their socket is disconnected)
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  io.on("connection", (socket) => {
    const authenticatedUserId = socket.data.userId;
    console.log("New socket connection:", socket.id, "User:", authenticatedUserId);

    // User registration (now using authenticated userId from session)
    socket.on("register", () => {
      // Use authenticated user ID from socket session, ignore any client-provided ID
      const userId = authenticatedUserId;
      userSockets.set(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} registered with socket ${socket.id}`);
      
      // Broadcast online status to all connected users
      io.emit("user-status", { userId, status: "online" });
    });

    // Handle sending encrypted messages
    socket.on("send-message", async (data: { recipientId: string; encryptedContent: string; clientMessageId?: string }) => {
      console.log('[Socket] send-message event received:', {
        senderId: authenticatedUserId,
        recipientId: data.recipientId,
        clientMessageId: data.clientMessageId,
        hasEncryptedContent: !!data.encryptedContent
      });
      
      try {
        // Use authenticated user ID from socket data (ignore any client-provided senderId)
        const senderId = authenticatedUserId;
        const { recipientId, encryptedContent, clientMessageId } = data;

        if (!senderId) {
          console.error('[Socket] ERROR: senderId is undefined - user not authenticated!');
          socket.emit("message-error", { error: "User not authenticated" });
          return;
        }

        console.log('[Socket] Creating message in database...');
        // Save encrypted message to database (include clientMessageId for cache matching)
        const message = await storage.createMessage({
          senderId,
          recipientId,
          encryptedContent,
          clientMessageId,
        });
        console.log('[Socket] Message created successfully:', message.id);

        // Send to recipient if online
        const recipientSocketId = userSockets.get(recipientId);
        console.log('[Socket] Recipient socket ID:', recipientSocketId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receive-message", message);
          console.log('[Socket] Message sent to recipient');
        } else {
          console.log('[Socket] Recipient is offline');
        }

        // Echo back to sender for cache matching (includes clientMessageId for deterministic matching)
        socket.emit("receive-message", message);
        console.log('[Socket] Message echoed back to sender');
      } catch (error) {
        console.error("[Socket] Error sending message:", error);
        socket.emit("message-error", { error: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing", (data: { recipientId: string; isTyping: boolean }) => {
      // Use authenticated user ID from socket data (ignore any client-provided senderId)
      const senderId = authenticatedUserId;
      const recipientSocketId = userSockets.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("user-typing", {
          senderId,
          isTyping: data.isTyping,
        });
      }
    });

    // Handle chatroom message
    socket.on("send-chatroom-message", async (data: { encryptedContent: string; chatroomId?: string }) => {
      try {
        // Use authenticated user ID from socket data (ignore any client-provided senderId)
        const senderId = authenticatedUserId;
        const { encryptedContent, chatroomId = 'default-general' } = data;

        // Save encrypted message to database
        const message = await storage.createChatroomMessage({
          senderId,
          chatroomId,
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
    socket.on("delete-message", async (data: { messageId: string; recipientId: string }) => {
      try {
        // Use authenticated user ID from socket data (validated during connection)
        const userId = authenticatedUserId;
        const { messageId, recipientId } = data;
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
    socket.on("delete-chatroom-message", async (data: { messageId: string }) => {
      try {
        // Use authenticated user ID from socket data (validated during connection)
        const userId = authenticatedUserId;
        const { messageId } = data;
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
      
      // Get user ID from socket data
      const userId = authenticatedUserId;
      if (userId) {
        // Remove from user socket mapping
        userSockets.delete(userId);
        io.emit("user-status", { userId, status: "offline" });
      }
    });
  });

  return httpServer;
}
