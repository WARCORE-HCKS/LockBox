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
import { eq, or, and, desc, ne } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Message operations
  createMessage(message: InsertMessage & { senderId: string }): Promise<Message>;
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]>;
  getAllUserChats(userId: string): Promise<Array<{ otherUser: User; lastMessage: Message }>>;
  
  // Chatroom operations
  createChatroomMessage(message: InsertChatroomMessage & { senderId: string }): Promise<ChatroomMessage>;
  getChatroomMessages(limit?: number): Promise<ChatroomMessage[]>;
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
        or(
          and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
        )
      )
      .orderBy(messages.createdAt);
    return msgs;
  }

  async getAllUserChats(userId: string): Promise<Array<{ otherUser: User; lastMessage: Message }>> {
    // Get all messages where user is sender or recipient
    const userMessages = await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.recipientId, userId)
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
      .orderBy(desc(chatroomMessages.createdAt))
      .limit(limit);
    
    // Return in chronological order
    return msgs.reverse();
  }
}

export const storage = new DatabaseStorage();
