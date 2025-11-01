import {
  users,
  messages,
  chatroomMessages,
  type User,
  type UpsertUser,
  type Message,
  type InsertMessage,
  type ChatroomMessage,
  type InsertChatroomMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc, ne, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Message operations
  createMessage(message: InsertMessage & { senderId: string }): Promise<Message>;
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]>;
  getAllUserChats(userId: string): Promise<Array<{ otherUser: User; lastMessage: Message }>>;
  deleteMessage(messageId: string, userId: string): Promise<boolean>;
  
  // Chatroom operations
  createChatroomMessage(message: InsertChatroomMessage & { senderId: string }): Promise<ChatroomMessage>;
  getChatroomMessages(limit?: number): Promise<ChatroomMessage[]>;
  deleteChatroomMessage(messageId: string, userId: string): Promise<boolean>;
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
    return await db.select().from(users);
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

  async getChatroomMessages(limit: number = 100): Promise<ChatroomMessage[]> {
    const msgs = await db
      .select()
      .from(chatroomMessages)
      .where(isNull(chatroomMessages.deletedAt))
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
}

export const storage = new DatabaseStorage();
