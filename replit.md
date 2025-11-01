# SecureChat - Encrypted Messenger

## Overview
SecureChat is a real-time messaging application built for private communication between friends. The app features secure authentication via Replit Auth, WebSocket-based real-time messaging, and message encryption.

## Recent Changes
- **Database Schema**: Added users, messages, and sessions tables with proper relationships
- **Authentication**: Integrated Replit Auth for secure user authentication with Google, GitHub, and email
- **Real-Time Messaging**: Implemented Socket.io for instant message delivery
- **Message Encryption**: Added client-side AES encryption for all messages
- **Frontend**: Built complete chat interface with friend list, message history, and real-time updates
- **Security Improvements**: 
  - Removed plaintext message storage - only encrypted content is stored
  - Per-user encryption keys stored in browser localStorage
  - Messages encrypted before transmission and decrypted on client

## Encryption Model

### Current Implementation
The app uses **client-side AES encryption** with per-user keys:
- Each user gets a unique encryption key generated on first use
- Keys are stored in browser localStorage
- Messages are encrypted before leaving the client
- Server only stores and transmits encrypted content
- Messages can only be decrypted by users with the correct key

### Limitations
This is a **simplified encryption model** suitable for a demo/MVP but NOT production-ready:

1. **Key Storage**: Keys in localStorage are vulnerable to XSS attacks
2. **No Key Exchange**: Users cannot securely share keys to decrypt each other's messages (currently each user can only decrypt their own sent messages)
3. **No Key Rotation**: Keys never expire or rotate
4. **No Recovery**: Lost keys mean lost message access
5. **Server Trust**: Server operator could inject code to capture keys

### For Production Use
A production-ready secure messenger should implement:
- **Asymmetric Encryption**: Public/private key pairs (RSA, Curve25519)
- **Key Exchange Protocol**: Diffie-Hellman or Signal Protocol for secure key sharing
- **Perfect Forward Secrecy**: Ephemeral keys that are destroyed after use
- **Secure Key Storage**: Hardware security modules or secure enclaves
- **Key Backup**: Encrypted cloud backup with recovery mechanisms
- **Identity Verification**: Public key fingerprints and safety numbers

## Project Architecture

### Backend (Express + Socket.io)
- **Authentication**: Replit Auth with OpenID Connect (server/replitAuth.ts)
- **Database**: PostgreSQL with Drizzle ORM (server/db.ts)
- **Storage**: Database storage layer for users and messages (server/storage.ts)
- **WebSocket**: Socket.io server for real-time messaging (server/routes.ts)
- **API Routes**: User management and message history endpoints

### Frontend (React + TypeScript)
- **Pages**:
  - LandingPage: Login page for unauthenticated users
  - ChatPage: Main chat interface with friend list and messaging
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
- **Encryption**: Client-side AES encryption (client/src/lib/encryption.ts)

### Database Schema
- **users**: User profiles (id, email, firstName, lastName, profileImageUrl)
- **messages**: Encrypted message storage (id, senderId, recipientId, encryptedContent, createdAt)
- **sessions**: Session storage for authentication

## Features
- ✅ Real-time messaging with Socket.io
- ✅ User authentication via Replit Auth
- ✅ Message encryption (client-side AES)
- ✅ Online/offline status indicators
- ✅ Message history persistence
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Friend discovery (all registered users)

## Known Limitations
1. **Encryption**: Simplified model - not suitable for production security requirements
2. **Group Chats**: Currently only 1-on-1 messaging supported
3. **File Sharing**: No support for images or file attachments
4. **Read Receipts**: Not implemented
5. **Message Editing**: Cannot edit or delete sent messages
6. **Voice/Video Calls**: UI buttons present but not functional

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
