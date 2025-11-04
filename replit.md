# LockBox - Encrypted Messenger (Demo/MVP)

## Overview
LockBox is a real-time messaging application designed for private communication. This project serves as a demonstration and Minimum Viable Product (MVP), showcasing secure authentication, WebSocket-based real-time messaging, and encrypted message storage. The application is currently implementing the Signal Protocol for robust end-to-end encryption. While not yet fully production-ready in terms of E2E security, it provides encrypted storage and transit. The long-term vision is to deliver a secure, user-friendly platform for private conversations with advanced features like user-owned chatrooms and comprehensive administrative controls.

## User Preferences
- Dark mode support with localStorage persistence
- Clean, modern design with subtle interactions
- Focus on privacy and encryption

## System Architecture

### UI/UX Decisions
The application features a clean, modern design with a focus on usability. Key UI elements include:
- Collapsible chatroom and user sections in the ChatPage sidebar.
- Crown icon (👑) to denote chatroom owners.
- Theme preference persistence across devices and sessions.
- User-owned chatrooms with moderation capabilities, including inviting and kicking users.
- Admin Control Panel for comprehensive user and chatroom management, including soft-deletion and online status monitoring.

### Technical Implementations
- **Backend**: Built with Express and Socket.io, handling authentication, database interactions, and real-time communication.
- **Frontend**: Developed using React and TypeScript, leveraging Tailwind CSS and Shadcn UI for a responsive and modern interface.
- **Authentication**: Integrates Replit Auth for secure user authentication using OpenID Connect.
- **Real-time Messaging**: Utilizes Socket.io for instant message delivery, including real-time isolation of messages per chatroom and soft-deletion broadcasts.
- **Encryption**:
    - **Current Transition**: Migrating from a simplified shared-key encryption model to the Signal Protocol for robust End-to-End Encryption (E2E).
    - **Signal Protocol Implementation Status**: Key infrastructure, automatic key generation (identity, signed prekey, one-time prekeys), encrypted IndexedDB storage for private keys (using WebCrypto AES-GCM with PBKDF2), and backend API endpoints for public key distribution are implemented.
    - **Pending Signal Protocol**: X3DH key exchange, Double Ratchet algorithm, Sender Keys for group chat, and UI for safety number verification are in progress.
    - **Legacy Encryption (Temporary)**: Private and chatroom messages currently use shared static keys, which will be replaced by the Signal Protocol.
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