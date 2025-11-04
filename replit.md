# LockBox - Encrypted Messenger (Demo/MVP)

## Overview
LockBox is a real-time messaging application designed for private communication. This project demonstrates secure authentication, WebSocket-based real-time messaging, and Signal Protocol end-to-end encryption. The application features an advanced cyberpunk HUD aesthetic with neon effects, orbital animations, and particle systems. This MVP showcases production-grade E2E encryption with an impressive, futuristic design featuring an advanced theme toggle with orbital rings, particle effects, and smooth light/dark mode transitions.

## User Preferences
- Cyberpunk-themed UI with neon aesthetics and HUD-style elements
- Dark backgrounds (#0a0a0f) with neon accents (cyan #00ffff, magenta #ff00ff, hot pink #ff0080)
- Futuristic typography (Orbitron for headings, Rajdhani for body text)
- Glowing effects on interactive elements and encryption indicators
- Dark mode support with localStorage persistence
- Focus on security with prominent neon-glowing encryption badges and HUD-style panels

## System Architecture

### UI/UX Decisions
The application features a cyberpunk HUD aesthetic with neon colors and futuristic elements:
- **Advanced Landing Page**: Premium interface with tons of special effects making users feel like they're operating a highly intelligent machine:
  - **Background Layers**: Animated grid pattern (40px×40px sliding), scanline overlay (vertical movement), 20 floating particles, hexagonal dot pattern
  - **Logo Effects**: 3 rotating energy rings (different speeds), holographic glow background, glitch effect (2 offset layers), neon drop shadow
  - **Typography**: Holographic "LOCKBOX" title with animated gradient shift (primary→secondary), pulsing tagline animation, Orbitron display font
  - **Button Effects**: "INITIALIZE SECURE SESSION" with energy pulse, animated gradient border (hue rotation), glow trail on hover
  - **Encryption Showcase**: Corner brackets (expand on hover), 4 detailed cards (Signal Protocol, Perfect Forward Secrecy, Zero Knowledge, Authenticated Encryption), scrolling binary data stream
  - **Features Grid**: Real-Time, Multi-Room, Open Source cards with pulsing icons and neon glows
  - **Open Source**: Interactive button with project information and deployment instructions
  - **15+ CSS Animations**: GPU-accelerated effects (grid-slide, scanline-move, particle-drift, glitch, holographic-shift, pulse variants, energy-border, data-scroll)
- **Message Bubbles**: Angular clip-path with cut corners, gradient backgrounds (cyan/magenta tints), neon borders with glow effects
- **Encryption Indicators**: Pulsing neon-glow E2E badges with lock icons, prominent throughout UI
- **Color Scheme**: 
  - Dark Mode: Deep black backgrounds (#0a0a0f) with neon cyan (primary), magenta (secondary), and hot pink (accent) colors
  - Light Mode: Soft lavender-gray backgrounds (#ebebf5) with blue-violet brand color (#8a2be2), softer cyan (#07b8c4), and purple (#a855f7) - designed for eye comfort while maintaining cyberpunk edge
- **Advanced Theme Toggle**: Impressive button with orbital rings, particle effects, corner brackets, scan line, and icon rotation
  - Orbital Rings: Two animated concentric rings (outer pulsing 3s, middle reverse rotating 4s)
  - Particle Effects: 6 floating particles with staggered animations on hover
  - Corner Brackets: HUD-style expanding accents (2px → 3px on hover)
  - Neon Glow: Dynamic box-shadow (cyan in dark, pink in light)
  - Smooth Transitions: 500-700ms icon rotation and color changes
  - GPU-Accelerated: Pure CSS animations for optimal performance
- **Visual Effects**: Corner brackets on panels, animated scanlines, dot grid backgrounds, glass-morphism effects, neon pulse animations
- **Typography**: Orbitron (display font) for UI elements with uppercase tracking-wide text, Rajdhani (sans) for message content
- **Empty States**: HUD-style with glowing circular icons, pulsing animations, and glass-panel containers
- **Theme Support**: Seamless light/dark mode switching with cyberpunk color palette adjustments, theme persistence across navigation
- **Sidebar**: HUD-style panels with corner brackets, scanline overlays, neon-glow avatars, and gradient section headers
- **Admin Control**: Comprehensive panel styled with cyberpunk aesthetics
- **HUD Telemetry Panel**: Premium real-time stats display featuring:
  - IP Address Monitor: Displays user's connection IP from backend endpoint
  - Latency Monitor: Live connection latency with color-coded status (OPTIMAL <30ms, GOOD <60ms, FAIR >60ms)
  - Connection Status: Shows network location/type
  - Local Time Clock: Real-time clock updating every second (HH:MM:SS format)
  - Corner brackets, neon glows, and data stream animations for cyber defense aesthetic
- **Cyber Map Visualization**: Interactive world map component with:
  - Simplified continent SVG shapes (Africa, Europe, Asia, Americas, Australia)
  - 8 global threat/activity nodes with pulsing animations
  - Animated connection lines between active nodes
  - Horizontal scanning line effect (4s loop)
  - Grid background pattern for technical feel
  - Legend showing secure/activity status indicators
  - Active node counter display

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