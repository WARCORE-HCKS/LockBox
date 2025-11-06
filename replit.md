# LockBox - Encrypted Messenger

## Overview
LockBox is a real-time, end-to-end encrypted messaging application demonstrating secure authentication, WebSocket-based communication, and the Signal Protocol. It features an advanced cyberpunk HUD aesthetic with neon effects, orbital animations, and particle systems, aiming to provide a futuristic and secure communication platform. This MVP showcases production-grade E2E encryption combined with an immersive, futuristic design.

## User Preferences
- Cyberpunk-themed UI with neon aesthetics and HUD-style elements
- Dark backgrounds (#0a0a0f) with neon accents (cyan #00ffff, magenta #ff00ff, hot pink #ff0080)
- Futuristic typography (Orbitron for headings, Rajdhani for body text)
- Glowing effects on interactive elements and encryption indicators
- Dark mode support with localStorage persistence
- Focus on security with prominent neon-glowing encryption badges and HUD-style panels

## System Architecture

### UI/UX Decisions
The application employs a cyberpunk HUD aesthetic with neon colors and futuristic elements:
- **Advanced Landing Page**: Features animated grid patterns, scanline overlays, floating particles, hexagonal dot patterns, holographic logo effects with rotating energy rings and glitch effects, pulsing typography, and interactive buttons with energy pulses and gradient borders. It includes an encryption showcase with detailed cards on Signal Protocol, Perfect Forward Secrecy, Zero Knowledge, and Authenticated Encryption.
- **Message Bubbles**: Angular clip-path with cut corners, gradient backgrounds, and neon borders.
- **Encryption Indicators**: Pulsing neon-glow E2E badges with lock icons.
- **Connection Status Indicator**: Real-time visual indicator showing socket connection state - green pulsing dot when connected, red solid dot when disconnected. Located next to E2E badge in both mobile and desktop views.
- **Color Scheme**: Deep black backgrounds (#0a0a0f) with neon cyan, magenta, and hot pink in dark mode; soft lavender-gray backgrounds (#ebebf5) with blue-violet, softer cyan, and purple in light mode.
- **Advanced Theme Toggle**: Features orbital rings, particle effects, corner brackets, scan lines, and icon rotation with smooth transitions and dynamic neon glows.
- **Visual Effects**: Corner brackets on panels, animated scanlines, dot grid backgrounds, glass-morphism effects, and neon pulse animations.
- **Typography**: Orbitron for display elements and Rajdhani for content.
- **Empty States**: HUD-style with glowing circular icons and glass-panel containers.
- **Sidebar**: HUD-style panels with corner brackets, scanline overlays, and neon-glow avatars.
- **Admin Control**: Cyberpunk-styled comprehensive panel.
- **HUD Telemetry Panel**: Real-time display of IP address, latency, connection status, and local time, with cyber defense aesthetics.
- **Cyber Map Visualization**: Interactive world map with simplified continent SVGs, pulsing global threat/activity nodes, animated connection lines, and a scanning line effect.
- **Customizable Dashboard**: Features a `DraggablePanel` component, powered by `react-grid-layout`, allowing users to drag, resize, minimize/maximize panels, and persist layout changes to `localStorage`. Includes a `useLayoutManager` hook for state management with 11 modular HUD panels:
  - **Cyber Notes**: Encrypted note-taking with auto-save, monospace text, and scanning effects
  - **User Intel**: Real-time statistics (messages sent, network size, security level, status) with animated metrics
  - **Security Monitor**: Dynamic threat levels, security system status, and pulsing indicators
  - **System Diagnostics**: Simulated CPU/Memory/Network metrics with animated progress bars
  - **Activity Feed**: Recent events timeline with icon-coded activities and timestamps
  - **Quick Command**: 6 shortcut buttons with expanding corner brackets and energy pulse effects
  - **HUD Telemetry**: IP address, latency, connection status, and local time display
  - **Cyber Map**: Interactive world map with threat nodes and connection lines
  - **Friends & Chatrooms**: Sidebar with user list and chatroom navigation
  - **Chat Messages**: Main messaging area with E2E encrypted conversations
  - **Message Input**: Secure message composition with encryption indicators

### Technical Implementations
- **Backend**: Express and Socket.io for authentication, database interaction, and real-time communication.
- **Frontend**: React and TypeScript, utilizing Tailwind CSS and Shadcn UI.
- **Authentication**: Replit Auth for secure user authentication using OpenID Connect.
- **Real-time Messaging**: Socket.io for instant message delivery, including isolation per chatroom and soft-deletion broadcasts.
- **Encryption**:
    - **Signal Protocol**: Complete E2E encryption for private messages using X3DH and Double Ratchet.
    - **Key Management**: Automatic generation and upload of identity, signed prekeys, and one-time prekeys.
    - **Secure Storage**: Private keys encrypted in IndexedDB using WebCrypto AES-GCM with PBKDF2.
    - **Message Persistence**: Deterministic caching system using client-provided message IDs with IndexedDB for pending messages and automatic cleanup.
- **Database**: PostgreSQL managed with Drizzle ORM, supporting schemas for users, chatrooms, messages, chatroom messages, and sessions.
- **Admin Control**: Protected routes and API endpoints for administrative functions.
- **Security**: Session-based authentication middleware and server-side derivation of `userId` from authenticated sessions.

### Feature Specifications
- Real-time individual and chatroom messaging.
- User authentication and profile management.
- Client-side message encryption (Signal Protocol).
- Soft deletion of messages with real-time updates.
- Multi-chatroom support with persistent message history.
- Online/offline status indicators.
- Connection status monitoring with visual indicators and send protection.
- Dark mode support.
- Admin control panel for user and chatroom management, including role-based access control.

### System Design Choices
- **Modular Architecture**: Clear separation of frontend/backend and distinct modules for core functionalities.
- **Database Schema**: Designed with `users`, `chatrooms`, `messages`, `chatroom_messages`, and `sessions` tables, including `deletedAt` for soft-deletion.
- **Client-Side Encryption Focus**: Emphasizes data protection in transit and at rest.
- **Scalability**: Designed for efficient real-time communication across multiple users and chatrooms.

## External Dependencies
- **Database**: Neon (PostgreSQL)
- **Authentication**: Replit Auth (OpenID Connect)
- **Real-time Communication**: Socket.io
- **ORM**: Drizzle ORM
- **Encryption Libraries**: `crypto-js` (legacy), `@signalapp/libsignal-client` (Signal Protocol)
- **UI Frameworks**: Tailwind CSS, Shadcn UI
- **Layout Management**: `react-grid-layout`
- **Mobile Development**: Capacitor 7 (for iOS and Android apps)
    - **Security Plugin**: `@aparajita/capacitor-secure-storage` (native keychain/keystore for Signal keys)
    - **Capacitor Plugins**: `@capacitor/preferences`, `@capacitor/push-notifications`, `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/keyboard`
    - **Documentation**: See `MOBILE_BUILD_GUIDE.md` for complete mobile development instructions