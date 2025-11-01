# LockBox - Encrypted Messenger (Demo/MVP)

## Overview
LockBox is a real-time messaging application built for private communication between friends. Lock the gate, avoid the fate. The app features secure authentication via Replit Auth, WebSocket-based real-time messaging, and encrypted message storage. 

**Important**: This is a demonstration/MVP with simplified encryption. It provides encrypted storage and transit but does NOT implement true end-to-end encryption. See "Encryption Model" section below for details.

## Recent Changes (November 2025)
- **Admin Control Panel**: Comprehensive admin interface for platform management
  - User management: view all users, promote to admin, soft-delete accounts
  - Chatroom management: create, update, delete chatrooms (multi-room support)
  - Real-time online/offline user status monitoring
  - Protected routes and API endpoints (requires isAdmin flag)
  - Bootstrap function ensures default chatroom exists on server startup
  - Soft deletion for users prevents FK constraint violations
- **Message Deletion**: Implemented soft deletion for both private and chatroom messages
  - Delete button appears on hover for user's own messages only
  - Deleted messages filtered from all queries and chat previews
  - Real-time deletion broadcasts via Socket.IO
- **Security Hardening**: Fixed critical Socket.IO security vulnerabilities
  - Session-based authentication middleware for all socket connections
  - All socket events use authenticated userId from server session (never trust client)
  - withCredentials enabled for proper cookie sharing between HTTP and WebSocket
- **Friend List Improvements**: Fixed test-id uniqueness to use user IDs instead of names

## Previous Changes
- **Database Schema**: Added users, messages, chatroom_messages, and sessions tables with proper relationships
- **Authentication**: Integrated Replit Auth for secure user authentication with Google, GitHub, and email
- **Real-Time Messaging**: Implemented Socket.io for instant message delivery
- **Chatroom Feature**: Added public chatroom with persistent message history
- **Message Encryption**: Added client-side AES encryption for message storage and transit
- **Frontend**: Built complete chat interface with chatroom, friend list, message history, and real-time updates
- **Storage Model**: 
  - Messages stored in database in encrypted form only (no plaintext storage)
  - Messages transmitted over network in encrypted form
  - Shared encryption keys used for demo purposes (NOT production-ready security)

## Encryption Model

### Current Implementation
The app uses **client-side AES encryption** with shared keys for demonstration purposes:

**Private Messages:**
- Uses a shared static key (`PRIVATE_MESSAGE_KEY`) hardcoded in client source
- All users can decrypt all private messages
- Provides basic obfuscation in storage/transit but not true end-to-end security
- Messages stored and transmitted only in encrypted form

**Chatroom Messages:**
- Uses a shared static key (`CHATROOM_KEY`) hardcoded in client source  
- All users can decrypt all chatroom messages
- Provides basic obfuscation but not true end-to-end security
- Messages stored and transmitted only in encrypted form

### Limitations
This is a **simplified encryption model** suitable for a demo/MVP but NOT production-ready:

1. **Shared Keys**: Both private and chatroom messages use shared static keys hardcoded in client source
2. **No True E2E**: Any user or server operator can decrypt all messages by inspecting client code
3. **Key Visibility**: Encryption keys are visible to anyone with access to the source code
4. **No Key Rotation**: Keys never expire or rotate
5. **No Per-User Security**: No distinction between users' ability to decrypt messages
6. **Server Trust**: Server operator could inject code to capture plaintext before encryption

### For Production Use
A production-ready secure messenger should implement:

**For Private Messages:**
- **Asymmetric Encryption**: Public/private key pairs (RSA, Curve25519)
- **Key Exchange Protocol**: Diffie-Hellman or Signal Protocol for secure key sharing
- **Perfect Forward Secrecy**: Ephemeral keys that are destroyed after use
- **Identity Verification**: Public key fingerprints and safety numbers

**For Group Chat/Chatroom:**
- **Group Key Management**: Sender keys or tree-based key distribution (Signal's Sender Keys, MLS protocol)
- **Member Changes**: Re-key when members join/leave for forward/backward secrecy
- **Per-Room Keys**: Unique keys for each chatroom, encrypted separately for each member

**General:**
- **Secure Key Storage**: Hardware security modules or secure enclaves
- **Key Backup**: Encrypted cloud backup with recovery mechanisms
- **Audit Logs**: Track key rotations and member changes

## What This App Provides

✅ **Encrypted Storage**: Messages stored in database in encrypted form  
✅ **Encrypted Transit**: Messages sent over network in encrypted form  
✅ **Authentication**: Only authenticated users can access messages  
✅ **Real-Time Delivery**: Instant message delivery via WebSocket  
✅ **Persistent History**: Messages saved and retrievable  

❌ **NOT True End-to-End Encryption**: All users share the same encryption keys, so any user or server operator with access to the source code can decrypt all messages. See "Encryption Model" for details.

## Project Architecture

### Backend (Express + Socket.io)
- **Authentication**: Replit Auth with OpenID Connect (server/replitAuth.ts)
- **Database**: PostgreSQL with Drizzle ORM (server/db.ts)
- **Bootstrap**: Database initialization ensuring default chatroom exists (server/bootstrap.ts)
- **Storage**: Database storage layer for users, chatrooms, and messages (server/storage.ts)
- **WebSocket**: Socket.io server for real-time messaging (server/routes.ts)
- **API Routes**: User management, chatroom management, and message history endpoints
- **Admin Middleware**: Role-based access control for admin-only routes (isAdmin middleware)

### Frontend (React + TypeScript)
- **Pages**:
  - LandingPage: Login page for unauthenticated users
  - ChatPage: Main chat interface with friend list and messaging
  - AdminPage: Admin control panel for user/chatroom management (admin-only)
- **Hooks**:
  - useAuth: Authentication state management
  - useSocket: WebSocket connection and real-time messaging
- **Components**:
  - UserAvatar: User profile pictures with online status
  - FriendListItem: Friend list entries with last message preview
  - MessageBubble: Individual message display
  - MessageInput: Message composition area
  - ChatHeader: Chat header with call buttons and menu
  - ThemeToggle: Dark/light mode switcher
  - LockIcon: Custom SVG lock icon that adapts to theme
- **Encryption**: Client-side AES encryption (client/src/lib/encryption.ts)

### Database Schema
- **users**: User profiles (id, email, firstName, lastName, profileImageUrl, isAdmin, deletedAt)
- **chatrooms**: Chatroom definitions (id, name, description, createdAt, updatedAt)
- **messages**: Encrypted private message storage (id, senderId, recipientId, encryptedContent, deletedAt, createdAt)
- **chatroom_messages**: Encrypted chatroom messages (id, chatroomId, senderId, encryptedContent, deletedAt, createdAt)
- **sessions**: Session storage for authentication

### Socket.IO Security Model
- **Authentication**: Session middleware validates all Socket.IO connections
- **User Identity**: Server derives userId from authenticated session (socket.data.userId)
- **No Client Trust**: All socket events ignore client-supplied user IDs
- **Event Validation**: register, send-message, send-chatroom-message, typing, delete-message all use authenticated userId

## Features
- ✅ Real-time messaging with Socket.io
- ✅ User authentication via Replit Auth
- ✅ Message encryption (client-side AES)
- ✅ Message deletion (soft deletion with real-time broadcasts)
- ✅ Multiple chatrooms with persistent history
- ✅ Private 1-on-1 messaging
- ✅ Online/offline status indicators
- ✅ Message history persistence
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Friend discovery (all registered users)
- ✅ Session-based Socket.IO authentication
- ✅ Admin control panel (user/chatroom management)
- ✅ Role-based access control (admin vs regular users)

## Known Limitations
1. **Encryption**: Simplified model - NOT suitable for production security requirements
   - All messages (private + chatroom) use shared hardcoded keys
   - Any user can technically decrypt any message
   - Encryption provides obfuscation, not true end-to-end security
2. **File Sharing**: No support for images or file attachments
3. **Read Receipts**: Not implemented
4. **Message Editing**: Cannot edit sent messages (deletion only)
5. **Voice/Video Calls**: UI buttons present but not functional
6. **Hard Deletion**: Deleted messages and users remain in database with deletedAt timestamp (soft deletion only)

## User Preferences
- Dark mode support with localStorage persistence
- Clean, modern design with subtle interactions
- Focus on privacy and encryption

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, Socket.io-client, crypto-js
- **Backend**: Express, Socket.io, Passport, Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **Authentication**: Replit Auth (OpenID Connect)
- **Encryption**: crypto-js (AES)
- **Real-time**: Socket.io
