import {
  users,
  messages,
  chatroomMessages,
  chatrooms,
  chatroomBans,
  chatroomMembers,
  identityKeys,
  preKeys,
  signedPreKeys,
  signalSessions,
  type User,
  type UpsertUser,
  type Message,
  type InsertMessage,
  type ChatroomMessage,
  type InsertChatroomMessage,
  type Chatroom,
  type InsertChatroom,
  type UpdateUserProfile,
  type ChatroomBan,
  type ChatroomMember,
  type IdentityKey,
  type PreKey,
  type SignedPreKey,
  type SignalSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc, ne, isNull, count, countDistinct, sql as dsql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserProfile(userId: string, profile: UpdateUserProfile): Promise<User | undefined>;
  updateUserTheme(userId: string, theme: string): Promise<User | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage & { senderId: string }): Promise<Message>;
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]>;
  getAllUserChats(userId: string): Promise<Array<{ otherUser: User; lastMessage: Message }>>;
  deleteMessage(messageId: string, userId: string): Promise<boolean>;
  
  // Chatroom operations
  createChatroomMessage(message: InsertChatroomMessage & { senderId: string }): Promise<ChatroomMessage>;
  getChatroomMessages(chatroomId: string, limit?: number): Promise<ChatroomMessage[]>;
  deleteChatroomMessage(messageId: string, userId: string): Promise<boolean>;
  
  // User-owned chatroom operations
  getUserOwnedChatroomsCount(userId: string): Promise<number>;
  createUserChatroom(userId: string, chatroom: InsertChatroom): Promise<Chatroom>;
  getUserOwnedChatrooms(userId: string): Promise<Chatroom[]>;
  isChatroomOwner(userId: string, chatroomId: string): Promise<boolean>;
  addChatroomMember(userId: string, chatroomId: string): Promise<ChatroomMember>;
  removeChatroomMember(userId: string, chatroomId: string): Promise<boolean>;
  getChatroomMembers(chatroomId: string): Promise<User[]>;
  
  // Admin operations
  updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined>;
  deleteUser(userId: string): Promise<boolean>;
  getAllChatrooms(): Promise<Chatroom[]>;
  createChatroom(chatroom: InsertChatroom): Promise<Chatroom>;
  updateChatroom(id: string, chatroom: Partial<InsertChatroom>): Promise<Chatroom | undefined>;
  deleteChatroom(id: string): Promise<boolean>;
  banUser(userId: string): Promise<User | undefined>;
  unbanUser(userId: string): Promise<User | undefined>;
  kickUserFromChatroom(userId: string, chatroomId: string): Promise<ChatroomBan>;
  unkickUserFromChatroom(userId: string, chatroomId: string): Promise<boolean>;
  isUserBannedFromChatroom(userId: string, chatroomId: string): Promise<boolean>;
  clearChatroomHistory(chatroomId: string): Promise<boolean>;
  getChatroomStatistics(chatroomId: string): Promise<{
    totalMessages: number;
    activeUsers: number;
    uniquePosters: number;
  }>;
  
  // Signal Protocol E2E encryption operations
  storeIdentityKey(userId: string, publicKey: string): Promise<IdentityKey>;
  getIdentityKey(userId: string): Promise<IdentityKey | undefined>;
  storePreKeys(userId: string, preKeyList: Array<{ keyId: string; publicKey: string }>): Promise<void>;
  getPreKey(userId: string, keyId: string): Promise<PreKey | undefined>;
  markPreKeyAsUsed(userId: string, keyId: string): Promise<void>;
  getUnusedPreKeys(userId: string, limit?: number): Promise<PreKey[]>;
  storeSignedPreKey(userId: string, keyId: string, publicKey: string, signature: string): Promise<SignedPreKey>;
  getSignedPreKey(userId: string): Promise<SignedPreKey | undefined>;
  storeSession(userId: string, recipientId: string, sessionData: string): Promise<SignalSession>;
  getSession(userId: string, recipientId: string): Promise<SignalSession | undefined>;
  deleteSession(userId: string, recipientId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(isNull(users.deletedAt));
  }

  async updateUserProfile(userId: string, profile: UpdateUserProfile): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserTheme(userId: string, theme: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        themePreference: theme,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Message operations
  async createMessage(messageData: InsertMessage & { senderId: string }): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    const msgs = await db
      .select()
      .from(messages)
      .where(
        and(
          or(
            and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
            and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
          ),
          isNull(messages.deletedAt)
        )
      )
      .orderBy(messages.createdAt);
    return msgs;
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.senderId, userId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async getAllUserChats(userId: string): Promise<Array<{ otherUser: User; lastMessage: Message }>> {
    // Get all non-deleted messages where user is sender or recipient
    const userMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          or(
            eq(messages.senderId, userId),
            eq(messages.recipientId, userId)
          ),
          isNull(messages.deletedAt)
        )
      )
      .orderBy(desc(messages.createdAt));

    // Group by conversation partner
    const chatMap = new Map<string, Message>();
    for (const msg of userMessages) {
      const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      if (!chatMap.has(otherUserId)) {
        chatMap.set(otherUserId, msg);
      }
    }

    // Fetch other users
    const result = [];
    for (const [otherUserId, lastMessage] of Array.from(chatMap.entries())) {
      const otherUser = await this.getUser(otherUserId);
      if (otherUser) {
        result.push({ otherUser, lastMessage });
      }
    }

    return result;
  }

  // Chatroom operations
  async createChatroomMessage(messageData: InsertChatroomMessage & { senderId: string }): Promise<ChatroomMessage> {
    const [message] = await db
      .insert(chatroomMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async getChatroomMessages(chatroomId: string, limit: number = 100): Promise<ChatroomMessage[]> {
    const msgs = await db
      .select()
      .from(chatroomMessages)
      .where(
        and(
          eq(chatroomMessages.chatroomId, chatroomId),
          isNull(chatroomMessages.deletedAt)
        )
      )
      .orderBy(desc(chatroomMessages.createdAt))
      .limit(limit);
    
    // Return in chronological order
    return msgs.reverse();
  }

  async deleteChatroomMessage(messageId: string, userId: string): Promise<boolean> {
    const result = await db
      .update(chatroomMessages)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(chatroomMessages.id, messageId),
          eq(chatroomMessages.senderId, userId)
        )
      )
      .returning();
    return result.length > 0;
  }

  // User-owned chatroom operations
  async getUserOwnedChatroomsCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(chatrooms)
      .where(eq(chatrooms.createdBy, userId));
    return result[0]?.count || 0;
  }

  async createUserChatroom(userId: string, chatroomData: InsertChatroom): Promise<Chatroom> {
    const ownedCount = await this.getUserOwnedChatroomsCount(userId);
    if (ownedCount >= 3) {
      throw new Error("User has reached maximum chatroom limit (3)");
    }
    
    const [chatroom] = await db
      .insert(chatrooms)
      .values({
        ...chatroomData,
        createdBy: userId,
      })
      .returning();
    
    // Auto-add creator as member
    await this.addChatroomMember(userId, chatroom.id);
    
    return chatroom;
  }

  async getUserOwnedChatrooms(userId: string): Promise<Chatroom[]> {
    return await db
      .select()
      .from(chatrooms)
      .where(eq(chatrooms.createdBy, userId))
      .orderBy(chatrooms.createdAt);
  }

  async isChatroomOwner(userId: string, chatroomId: string): Promise<boolean> {
    const [chatroom] = await db
      .select()
      .from(chatrooms)
      .where(
        and(
          eq(chatrooms.id, chatroomId),
          eq(chatrooms.createdBy, userId)
        )
      );
    return !!chatroom;
  }

  async addChatroomMember(userId: string, chatroomId: string): Promise<ChatroomMember> {
    const [member] = await db
      .insert(chatroomMembers)
      .values({ userId, chatroomId })
      .onConflictDoNothing()
      .returning();
    return member;
  }

  async removeChatroomMember(userId: string, chatroomId: string): Promise<boolean> {
    const result = await db
      .delete(chatroomMembers)
      .where(
        and(
          eq(chatroomMembers.userId, userId),
          eq(chatroomMembers.chatroomId, chatroomId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async getChatroomMembers(chatroomId: string): Promise<User[]> {
    const members = await db
      .select({
        user: users,
      })
      .from(chatroomMembers)
      .innerJoin(users, eq(chatroomMembers.userId, users.id))
      .where(
        and(
          eq(chatroomMembers.chatroomId, chatroomId),
          isNull(users.deletedAt)
        )
      );
    
    return members.map(m => m.user);
  }

  // Admin operations
  async updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Soft delete user to preserve message history and FK integrity
    const result = await db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result.length > 0;
  }

  async getAllChatrooms(): Promise<Chatroom[]> {
    return await db.select().from(chatrooms).orderBy(chatrooms.createdAt);
  }

  async createChatroom(chatroomData: InsertChatroom): Promise<Chatroom> {
    const [chatroom] = await db
      .insert(chatrooms)
      .values(chatroomData)
      .returning();
    return chatroom;
  }

  async updateChatroom(id: string, chatroomData: Partial<InsertChatroom>): Promise<Chatroom | undefined> {
    const [chatroom] = await db
      .update(chatrooms)
      .set({ ...chatroomData, updatedAt: new Date() })
      .where(eq(chatrooms.id, id))
      .returning();
    return chatroom;
  }

  async deleteChatroom(id: string): Promise<boolean> {
    const result = await db
      .delete(chatrooms)
      .where(eq(chatrooms.id, id))
      .returning();
    return result.length > 0;
  }

  async banUser(userId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isBanned: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async unbanUser(userId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isBanned: false, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async kickUserFromChatroom(userId: string, chatroomId: string): Promise<ChatroomBan> {
    const [ban] = await db
      .insert(chatroomBans)
      .values({ userId, chatroomId })
      .onConflictDoNothing()
      .returning();
    return ban;
  }

  async unkickUserFromChatroom(userId: string, chatroomId: string): Promise<boolean> {
    const result = await db
      .delete(chatroomBans)
      .where(
        and(
          eq(chatroomBans.userId, userId),
          eq(chatroomBans.chatroomId, chatroomId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async isUserBannedFromChatroom(userId: string, chatroomId: string): Promise<boolean> {
    const [ban] = await db
      .select()
      .from(chatroomBans)
      .where(
        and(
          eq(chatroomBans.userId, userId),
          eq(chatroomBans.chatroomId, chatroomId)
        )
      );
    return !!ban;
  }

  async clearChatroomHistory(chatroomId: string): Promise<boolean> {
    const result = await db
      .update(chatroomMessages)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(chatroomMessages.chatroomId, chatroomId),
          isNull(chatroomMessages.deletedAt)
        )
      )
      .returning();
    return result.length > 0;
  }

  async getChatroomStatistics(chatroomId: string): Promise<{
    totalMessages: number;
    activeUsers: number;
    uniquePosters: number;
  }> {
    const [stats] = await db
      .select({
        totalMessages: count(chatroomMessages.id),
        uniquePosters: countDistinct(chatroomMessages.senderId),
      })
      .from(chatroomMessages)
      .where(
        and(
          eq(chatroomMessages.chatroomId, chatroomId),
          isNull(chatroomMessages.deletedAt)
        )
      );

    return {
      totalMessages: Number(stats?.totalMessages || 0),
      activeUsers: 0, // This will be calculated from socket connections in real-time
      uniquePosters: Number(stats?.uniquePosters || 0),
    };
  }

  // Signal Protocol E2E encryption operations
  async storeIdentityKey(userId: string, publicKey: string): Promise<IdentityKey> {
    const [key] = await db
      .insert(identityKeys)
      .values({ userId, publicKey })
      .onConflictDoUpdate({
        target: identityKeys.userId,
        set: { publicKey, createdAt: new Date() },
      })
      .returning();
    return key;
  }

  async getIdentityKey(userId: string): Promise<IdentityKey | undefined> {
    const [key] = await db
      .select()
      .from(identityKeys)
      .where(eq(identityKeys.userId, userId));
    return key;
  }

  async storePreKeys(
    userId: string,
    preKeyList: Array<{ keyId: string; publicKey: string }>
  ): Promise<void> {
    if (preKeyList.length === 0) return;

    await db.insert(preKeys).values(
      preKeyList.map(pk => ({
        userId,
        keyId: pk.keyId,
        publicKey: pk.publicKey,
        used: false,
      }))
    ).onConflictDoNothing();
  }

  async getPreKey(userId: string, keyId: string): Promise<PreKey | undefined> {
    const [key] = await db
      .select()
      .from(preKeys)
      .where(and(eq(preKeys.userId, userId), eq(preKeys.keyId, keyId)));
    return key;
  }

  async markPreKeyAsUsed(userId: string, keyId: string): Promise<void> {
    await db
      .update(preKeys)
      .set({ used: true })
      .where(and(eq(preKeys.userId, userId), eq(preKeys.keyId, keyId)));
  }

  async getUnusedPreKeys(userId: string, limit: number = 10): Promise<PreKey[]> {
    return await db
      .select()
      .from(preKeys)
      .where(and(eq(preKeys.userId, userId), eq(preKeys.used, false)))
      .limit(limit);
  }

  async storeSignedPreKey(
    userId: string,
    keyId: string,
    publicKey: string,
    signature: string
  ): Promise<SignedPreKey> {
    const [key] = await db
      .insert(signedPreKeys)
      .values({ userId, keyId, publicKey, signature })
      .onConflictDoUpdate({
        target: [signedPreKeys.userId, signedPreKeys.keyId],
        set: { publicKey, signature, createdAt: new Date() },
      })
      .returning();
    return key;
  }

  async getSignedPreKey(userId: string): Promise<SignedPreKey | undefined> {
    const [key] = await db
      .select()
      .from(signedPreKeys)
      .where(eq(signedPreKeys.userId, userId))
      .orderBy(desc(signedPreKeys.createdAt))
      .limit(1);
    return key;
  }

  async storeSession(
    userId: string,
    recipientId: string,
    sessionData: string
  ): Promise<SignalSession> {
    const [session] = await db
      .insert(signalSessions)
      .values({ userId, recipientId, sessionData })
      .onConflictDoUpdate({
        target: [signalSessions.userId, signalSessions.recipientId],
        set: { sessionData, updatedAt: new Date() },
      })
      .returning();
    return session;
  }

  async getSession(userId: string, recipientId: string): Promise<SignalSession | undefined> {
    const [session] = await db
      .select()
      .from(signalSessions)
      .where(
        and(
          eq(signalSessions.userId, userId),
          eq(signalSessions.recipientId, recipientId)
        )
      );
    return session;
  }

  async deleteSession(userId: string, recipientId: string): Promise<boolean> {
    const result = await db
      .delete(signalSessions)
      .where(
        and(
          eq(signalSessions.userId, userId),
          eq(signalSessions.recipientId, recipientId)
        )
      )
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
