import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table - only stores encrypted content
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  encryptedContent: text("encrypted_content").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chatrooms table - manage multiple chatrooms
export const chatrooms = pgTable("chatrooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chatroom messages table - public group chat with encrypted content
export const chatroomMessages = pgTable("chatroom_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatroomId: varchar("chatroom_id").notNull().references(() => chatrooms.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  encryptedContent: text("encrypted_content").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "recipient" }),
  chatroomMessages: many(chatroomMessages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "recipient",
  }),
}));

export const chatroomsRelations = relations(chatrooms, ({ many }) => ({
  messages: many(chatroomMessages),
}));

export const chatroomMessagesRelations = relations(chatroomMessages, ({ one }) => ({
  sender: one(users, {
    fields: [chatroomMessages.senderId],
    references: [users.id],
  }),
  chatroom: one(chatrooms, {
    fields: [chatroomMessages.chatroomId],
    references: [chatrooms.id],
  }),
}));

// Types and schemas
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertMessageSchema = createInsertSchema(messages).pick({
  recipientId: true,
  encryptedContent: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const insertChatroomSchema = createInsertSchema(chatrooms).pick({
  name: true,
  description: true,
});

export type InsertChatroom = z.infer<typeof insertChatroomSchema>;
export type Chatroom = typeof chatrooms.$inferSelect;

export const insertChatroomMessageSchema = createInsertSchema(chatroomMessages).pick({
  chatroomId: true,
  encryptedContent: true,
});

export type InsertChatroomMessage = z.infer<typeof insertChatroomMessageSchema>;
export type ChatroomMessage = typeof chatroomMessages.$inferSelect;
