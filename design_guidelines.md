# Secure Messenger Design Guidelines

## Design Approach
**System-Based Design** drawing from Discord's friendly social interface and Signal's security-focused minimalism. This creates a trustworthy, efficient messaging experience that prioritizes usability and clarity.

## Typography System
- **Primary Font**: Inter or DM Sans via Google Fonts CDN
- **Message Text**: 15px regular (base text size)
- **Usernames**: 14px semibold
- **Timestamps**: 12px regular, reduced opacity
- **Section Headers**: 18px semibold
- **Input Fields**: 15px regular
- **Status Indicators**: 11px medium, uppercase with letter-spacing

## Layout & Spacing
**Spacing Units**: Tailwind units of 2, 3, 4, 6, and 8 for consistent rhythm

**Desktop Layout** (3-column structure):
- Sidebar: Fixed 280px width with friends list and status
- Main Chat: Flex-grow central column with message history
- Right Panel: Optional 320px for group info/settings (collapsible)

**Mobile Layout**: Single column with slide-out sidebar

**Message Bubbles**: py-3 px-4, mb-2 between messages, mb-6 between different users

**Container Spacing**: 
- Sidebar padding: p-4
- Chat area padding: p-6
- Message input container: p-4

## Core Components

**Sidebar - Friends List**
- User avatars: 40px circles with online status dot (8px) at bottom-right
- Each friend item: py-3 px-4 with username and last seen/online status
- Active chat: distinct background treatment
- Search bar at top: h-10 with icon

**Message Display**
- Avatar: 32px circle, positioned top-left of message group
- Message groups: Stack messages from same user within 5 minutes
- Timestamp: Appears on hover or at regular intervals (every 5 messages)
- Own messages: Align right without avatar, distinct background
- Other messages: Align left with avatar, neutral background

**Message Input**
- Fixed height: h-14
- Full-width text input with rounded corners
- Send button: 36px square icon button on right
- Emoji picker icon: 20px on left side
- Attachment icon: 20px next to emoji
- Auto-expand textarea up to 120px max height

**Login/Registration**
- Centered card: max-w-md with p-8
- Form fields: h-12 with clear labels above
- Submit button: w-full h-12
- Logo/app name: mb-8 centered
- Toggle link between login/register states

**Status Indicators**
- Online: Solid circle
- Away: Hollow circle
- Offline: No indicator or greyed circle
- Typing indicator: Three animated dots in message area

**Encryption Badge**
- Small lock icon (14px) next to chat title
- "End-to-end encrypted" text on hover

## Navigation
**Top Bar** (h-16):
- Chat room name or friend name (left)
- Encryption status indicator
- Settings/info icon (right)

**Sidebar Header**:
- App logo/name (mb-4)
- Current user profile section with avatar and status selector
- Logout button as icon in corner

## Responsive Behavior
**Desktop** (lg: and above):
- Three-column layout active
- Sidebar always visible
- Message bubbles max-width: 65% of chat area

**Tablet** (md:):
- Two-column: sidebar + chat (right panel hidden)
- Hamburger menu to toggle sidebar

**Mobile** (base):
- Single column chat view
- Slide-out sidebar via menu button
- Message bubbles: 85% max-width
- Reduced padding (p-3 instead of p-6)

## Animations
**Minimal Motion**:
- Message send: Subtle fade-in (200ms)
- Typing indicator: Gentle pulse
- Sidebar transitions: 300ms ease
- No decorative animations

## Accessibility
- Focus states: 2px outline on all interactive elements
- High contrast between text and backgrounds
- Keyboard navigation: Tab through messages, Enter to send
- Screen reader labels on all icons
- ARIA labels for online status
- Alt text for avatars using username

## Key Interactions
- Click friend to open chat
- Press Enter to send message (Shift+Enter for new line)
- Click avatar to view profile
- Real-time message delivery without page refresh
- Scroll to load older messages (infinite scroll)
- Visual confirmation when message is sent/delivered

## Images
**User Avatars**: Required throughout - generated initials or uploaded photos as 32px (messages) and 40px (sidebar) circles

**App Logo**: Optional branded logo in sidebar header and login screen, approximately 120px wide

No hero images needed - this is a functional application interface focused on messaging efficiency.