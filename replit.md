# LockBox - Encrypted Messenger (Demo/MVP)

## Overview
LockBox is a real-time messaging application designed for private communication. This project demonstrates secure authentication, WebSocket-based real-time messaging, and Signal Protocol end-to-end encryption. The application now features a modern, polished UI with encryption indicators throughout, making security transparent to users. This MVP showcases production-grade E2E encryption with user-friendly design, user-owned chatrooms, and comprehensive administrative controls.

## User Preferences
- Modern, polished UI with Discord/Signal-inspired aesthetics
- Dark mode support with localStorage persistence and improved color contrast
- Clean design with refined message bubbles (rounded corners with cutoff effect)
- Prominent encryption indicators (E2E badges, lock icons, security-focused empty states)
- Focus on privacy with clear visual cues

## System Architecture

### UI/UX Decisions
The application features a polished, modern design following Discord/Signal aesthetics with security transparency:
- **Message Bubbles**: Refined with rounded corners and cutoff effect (rounded-2xl + corner cutoff), subtle shadows, improved spacing
- **Encryption Indicators**: E2E badges with lock icons in chat headers, security-focused empty states
- **Color Scheme**: Refined palette with better contrast in light/dark modes, improved text readability
- **Empty States**: Enhanced with icons and encryption-focused messaging ("End-to-end encrypted chat", "Signal Protocol" badges)
- **Theme Support**: Seamless light/dark mode switching with localStorage persistence
- **Sidebar**: Collapsible chatroom and user sections with improved spacing and hover states
- **Admin Control**: Comprehensive panel for user and chatroom management

### Technical Implementations
- **Backend**: Built with Express and Socket.io, handling authentication, database interactions, and real-time communication.
- **Frontend**: Developed using React and TypeScript, leveraging Tailwind CSS and Shadcn UI for a responsive and modern interface.
- **Authentication**: Integrates Replit Auth for secure user authentication using OpenID Connect.
- **Real-time Messaging**: Utilizes Socket.io for instant message delivery, including real-time isolation of messages per chatroom and soft-deletion broadcasts.
- **Encryption**:
    - **Signal Protocol (Complete)**: Full E2E encryption for private messages using X3DH key exchange and Double Ratchet algorithm
    - **Key Management**: Automatic generation and upload of identity keys, signed prekeys, and one-time prekeys
    - **Secure Storage**: Private keys encrypted in IndexedDB using WebCrypto AES-GCM with PBKDF2
    - **Message Encryption**: Proper ArrayBuffer handling for Uint8Array views (fixed buffer slicing bug)
    - **Message Persistence**: Deterministic caching system using client-provided message IDs
        - Server echoes messages back to sender with `clientMessageId` for cache matching
        - IndexedDB stores pending messages (tempId → plaintext mapping)
        - Direct lookup by tempId (primary key) for efficient, deterministic matching
        - Automatic cleanup of expired pending entries (60s TTL)
        - Enables message history persistence across page reloads
    - **UI Integration**: Encryption status visible throughout interface with E2E badges and security indicators
    - **Legacy Encryption**: Chatroom messages use shared-key encryption (planned upgrade to Sender Keys)
- **Database**: PostgreSQL managed with Drizzle ORM, supporting schemas for users, chatrooms, messages, chatroom messages, and sessions.
- **Admin Control**: Protected routes and API endpoints ensure only administrators can access management features.
- **Security**: Session-based authentication middleware for all Socket.IO connections and server-side derivation of `userId` from authenticated sessions to prevent client-side tampering.

### Feature Specifications
- Real-time messaging with individual and chatroom capabilities.
- User authentication and profile management (edit name, view details).
- Client-side message encryption (transitioning to Signal Protocol).
- Soft deletion of messages with real-time updates.
- Multi-chatroom support with persistent message history.
- Online/offline status indicators.
- Dark mode support.
- Admin control panel for user and chatroom management, including promotion to admin and soft-deletion of accounts.
- Role-based access control for administrative functions.

### System Design Choices
- **Modular Architecture**: Clear separation between frontend and backend, and distinct modules for authentication, storage, and real-time communication.
- **Database Schema**: Designed with `users`, `chatrooms`, `messages`, `chatroom_messages`, and `sessions` tables, including `deletedAt` for soft-deletion.
- **Client-Side Encryption Focus**: Emphasizes protecting data in transit and at rest, with a clear understanding of browser-based E2E limitations (e.g., XSS vulnerabilities).
- **Scalability**: Designed to handle real-time communication for multiple users and chatrooms efficiently.

## External Dependencies
- **Database**: Neon (PostgreSQL)
- **Authentication**: Replit Auth (OpenID Connect)
- **Real-time Communication**: Socket.io
- **ORM**: Drizzle ORM
- **Encryption Libraries**: `crypto-js` (for legacy encryption) and `@signalapp/libsignal-client` (for Signal Protocol implementation)
- **UI Frameworks**: Tailwind CSS, Shadcn UI