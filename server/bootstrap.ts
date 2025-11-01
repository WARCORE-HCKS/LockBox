import { db } from "./db";
import { chatrooms, chatroomMessages } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Bootstrap function to ensure required database records exist
 * This runs on application startup to handle initialization
 */
export async function bootstrapDatabase() {
  try {
    console.log("Running database bootstrap...");

    // Ensure default "General" chatroom exists
    const [existingChatroom] = await db
      .select()
      .from(chatrooms)
      .where(eq(chatrooms.id, 'default-general'))
      .limit(1);

    if (!existingChatroom) {
      console.log("Creating default 'General' chatroom...");
      await db.insert(chatrooms).values({
        id: 'default-general',
        name: 'General',
        description: 'Main chatroom for all users',
      });
      console.log("Default chatroom created successfully");
    } else {
      console.log("Default chatroom already exists");
    }

    // Backfill any chatroom messages that don't have a chatroom_id
    const result = await db
      .update(chatroomMessages)
      .set({ chatroomId: 'default-general' })
      .where(isNull(chatroomMessages.chatroomId))
      .returning();

    if (result.length > 0) {
      console.log(`Backfilled ${result.length} chatroom messages with default chatroom ID`);
    }

    console.log("Database bootstrap completed successfully");
  } catch (error) {
    console.error("Error during database bootstrap:", error);
    throw error; // Re-throw to prevent server startup if bootstrap fails
  }
}
