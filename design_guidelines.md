# LockBox Encrypted Messenger Design Guidelines

## Design Approach
**Cyberpunk-Themed System Design** inspired by futuristic HUD interfaces, combining Signal's security-focused functionality with a dark, neon-accented aesthetic. The interface emphasizes encryption features through glowing indicators and angular, tech-forward UI elements that create an immersive, high-tech messaging experience.

## Color System
**Background Foundation**:
- Primary background: #0a0a0f (deep space black)
- Secondary panels: #12121a (elevated surfaces)
- Tertiary elements: #1a1a24 (cards, message bubbles)
- Borders/dividers: rgba(0, 255, 255, 0.15) (subtle cyan glow)

**Neon Accents**:
- Primary accent: #00ffff (cyan - encryption indicators, active states)
- Secondary accent: #ff00ff (magenta - notifications, highlights)
- Tertiary accent: #ff0080 (hot pink - critical actions, warnings)
- Success states: #00ff88 (neon green)
- Online status: #00ffff with glow
- Offline status: #666677 (muted grey)

**Text Hierarchy**:
- Primary text: #e0e0ff (soft white with slight blue tint)
- Secondary text: #9090aa (muted purple-grey)
- Timestamps/metadata: rgba(255, 255, 255, 0.4)
- Placeholder text: rgba(255, 255, 255, 0.25)

**Interactive Elements**:
- Hover states: Add cyan glow (box-shadow: 0 0 10px rgba(0, 255, 255, 0.3))
- Active chat: #1a1a24 background with cyan left border (3px solid)
- Message input focus: Cyan glow (box-shadow: 0 0 15px rgba(0, 255, 255, 0.4))

## Typography System
- **Primary Font**: "Rajdhani" or "Orbitron" (geometric, tech-forward) via Google Fonts CDN
- **Fallback**: "Inter" for better readability in message content
- **Message Text**: 15px regular weight (use Inter for readability)
- **Usernames**: 14px bold, uppercase with letter-spacing: 0.05em
- **Timestamps**: 11px medium, uppercase, letter-spacing: 0.1em
- **Section Headers**: 16px bold, uppercase, letter-spacing: 0.08em
- **Input Fields**: 15px regular (Inter)
- **Status Text**: 10px bold, uppercase, letter-spacing: 0.12em
- **Encryption Indicators**: 12px medium, uppercase

## Layout & Spacing
**Spacing Units**: Tailwind units of 2, 3, 4, 6, and 8

**Desktop Layout** (3-column HUD structure):
- Left Sidebar: Fixed 300px width with corner accent brackets
- Main Chat: Flex-grow central panel with angular top border
- Right Panel: Fixed 340px info panel (collapsible) with glass-morphism effect

**Mobile Layout**: Single column with slide-out sidebar featuring animated scanline transition

**Component Spacing**:
- Sidebar padding: p-4
- Chat area padding: p-6
- Message bubbles: py-2.5 px-4, mb-2 between messages, mb-6 between users
- Panel headers: h-16 with border accent lines

## Core Components

**Sidebar - Contact List**
- Header: App logo "LOCKBOX" with glowing cyan underline, h-20
- User profile section: 48px avatar with animated cyan ring, status dropdown
- Contact items: Angular left border (2px), py-3 px-4 spacing
  - Avatar: 36px circle with online status dot (10px) with glow effect
  - Username: Bold, uppercase with cyan text for active chat
  - Last message preview: Truncated, secondary text color
  - Unread badge: Magenta circle with count, positioned top-right
- Search bar: h-11, dark background with cyan focus glow and angular corners
- Corner brackets on container (CSS borders at corners only)

**Message Display Panel**
- Header bar: h-16 with gradient border-bottom (cyan to magenta)
  - Contact name: Left-aligned, bold uppercase
  - Encryption badge: Glowing lock icon (16px) with "E2E ENCRYPTED" text
  - Info/settings icon: Right-aligned with hover glow
- Message container: Scrollable with custom scrollbar (cyan track)
- Message groups:
  - Own messages: Right-aligned, magenta-tinted background (#1a0f1a), no avatar
  - Received messages: Left-aligned, cyan-tinted background (#0f1a1a), 32px avatar
  - Angular clip-path on message bubbles (cut corners)
  - Timestamp on hover: Floating above with glass-morphism background
- Typing indicator: Three animated dots with cyan glow pulse
- Scanline overlay: Subtle animated line moving top to bottom (opacity: 0.05)

**Message Input Area**
- Container: h-18 with top border featuring corner accents
- Text area: Glass-morphism background, auto-expand to max 140px
- Left icons: Emoji picker (20px) and attachment (20px) with hover glow
- Send button: 40px angular button with cyan border and magenta glow on hover
- Character counter: Bottom-right, magenta when approaching limit
- Focus state: Full cyan glow around container

**Authentication Screens**
- Centered card: max-w-md, glass-morphism with corner brackets
- Logo treatment: "LOCKBOX" with glowing cyan letters and scanline effect
- Form fields: h-12 with angular borders, cyan glow on focus
- Labels: Uppercase, small, positioned above fields
- Submit button: Full-width, h-13, gradient background (cyan to magenta) with hover glow
- Toggle link: Magenta text with underline animation
- Background: Animated grid pattern with moving dots

**Status & Encryption Indicators**
- Online: Solid cyan circle with outer glow ring
- Away: Hollow magenta circle with pulse animation
- Offline: Grey circle, no glow
- Encryption active: Lock icon with cyan glow and particle effect
- Message sent: Single cyan checkmark
- Message delivered: Double cyan checkmarks
- Message read: Double magenta checkmarks

**Info Panel** (Right sidebar)
- Glass-morphism background with border glow
- Section dividers: Gradient lines (cyan to magenta)
- User profile: Large avatar (80px) with animated hexagon border
- Shared media grid: 3-column with hover glow effect
- Settings toggles: Custom switches with cyan/magenta states
- Encryption details: Expandable section with key fingerprint display in monospace font

## Visual Effects

**Glass-Morphism Treatment**:
- Background: rgba(26, 26, 36, 0.7)
- Backdrop-filter: blur(10px)
- Border: 1px solid rgba(0, 255, 255, 0.2)
- Apply to: Panels, modals, dropdowns

**Glow Effects**:
- Interactive hover: box-shadow: 0 0 10px rgba(0, 255, 255, 0.3)
- Active states: box-shadow: 0 0 20px rgba(255, 0, 255, 0.4)
- Encryption indicators: box-shadow: 0 0 15px rgba(0, 255, 255, 0.5)
- Status dots: box-shadow: 0 0 8px currentColor

**Angular/Geometric Elements**:
- Corner brackets on panels: 16px length, 2px width, cyan color
- Clip-path on message bubbles: polygon for cut corners
- Border accents: Gradient strokes (cyan to magenta) on headers
- Divider lines: 1px height with gradient and glow

**Tech Patterns**:
- Background grid: Subtle dotted pattern (2px dots, 20px spacing, opacity: 0.03)
- Scanlines: Animated horizontal line overlay (1px, opacity: 0.05, 3s loop)
- Data streams: Vertical moving particles on sidebar borders (optional animation)

## Navigation & Interactions
**Top Bar Functionality**:
- Fixed position with glass-morphism
- Back button (mobile): Angular icon with magenta glow
- Contact/room name with typing indicator space
- Voice/video call icons: Cyan glow on hover
- Settings dropdown: Angular panel with corner brackets

**Keyboard Shortcuts Display**:
- Overlay panel: Glass-morphism with shortcuts in grid
- Triggered by "?" key
- Shortcuts shown with cyan key badges

## Responsive Behavior
**Desktop** (lg: 1024px+):
- Three-column layout active
- Message bubbles: max-width 65%
- Full visual effects enabled

**Tablet** (md: 768px):
- Two-column: sidebar + chat
- Right panel accessed via slide-over
- Reduced glow intensity

**Mobile** (base):
- Single column chat view
- Slide-out sidebar with animated transition
- Message bubbles: max-width 80%
- Simplified glow effects for performance
- Reduced padding: p-3

## Animations
**Purposeful Motion**:
- Message send: Fade-in with slight scale (250ms ease-out)
- Typing indicator: Gentle pulse on dots (1s infinite)
- Sidebar transitions: 350ms ease with blur fade
- Scanline movement: 3s linear infinite
- Glow pulse on encryption badge: 2s ease infinite
- Status dot pulse: 1.5s ease infinite (away status only)
- No excessive decorative animations

## Accessibility
- Focus states: 2px cyan outline on all interactive elements
- High contrast maintained: Text minimum 4.5:1 ratio against backgrounds
- Reduced motion preference: Disable scanlines and pulse animations
- Keyboard navigation: Full support with visible focus indicators
- Screen reader: ARIA labels on all icons and status indicators
- Alt text: Avatar images use username
- Color-blind considerations: Don't rely solely on color for status (use shapes)

## Images
**User Avatars**: Generated initials or uploaded photos
- Sidebar: 36px circles with glowing border
- Messages: 32px circles
- Profile panel: 80px with hexagonal frame
- All avatars have subtle cyan glow on active users

**App Logo**: "LOCKBOX" text treatment with:
- Geometric letterforms
- Cyan glow effect
- Scanline overlay
- Positioned in sidebar header (h-20) and auth screens (h-24)

**Background Elements**: 
- Animated dot grid pattern (generated via CSS)
- No photographic imagery needed