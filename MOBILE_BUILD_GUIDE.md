# LockBox Mobile App Development Guide

## Overview
LockBox is available as native iOS and Android applications using Capacitor 7. The mobile apps wrap the React web interface while providing access to native device features like secure storage, push notifications, and camera.

## Mobile Features
- **Native Apps**: Full iOS and Android apps built from the same React codebase
- **Secure Storage**: Encryption keys stored in native keychain (iOS) or keystore (Android) using `@aparajita/capacitor-secure-storage`
- **Push Notifications**: Real-time message alerts using Capacitor Push Notifications
- **Native UI**: Status bar customization, splash screen, keyboard handling
- **Responsive Design**: Mobile-optimized viewport with proper touch handling

## Project Structure
```
ios/                           # iOS native project (Xcode)
android/                       # Android native project (Android Studio)
capacitor.config.ts            # Capacitor configuration
mobile-scripts.sh              # Helper scripts for building
client/src/lib/capacitor-utils.ts  # Mobile platform utilities
```

## Development Workflow

### Prerequisites
- **For iOS**: macOS with Xcode 14+ installed
- **For Android**: Android Studio with SDK 33+ installed
- Node.js and npm (already available in Replit)

### Building the Mobile Apps

**Step 1: Build Web Assets**
```bash
npm run build
```
This compiles your React app into `dist/public/` which Capacitor will bundle into native apps.

**Step 2: Sync to Native Projects**
```bash
npx cap sync
```
This copies web assets and updates native projects with the latest plugins.

**Step 3: Open in Native IDE**

For iOS:
```bash
npx cap open ios
```
This opens the project in Xcode where you can:
- Build and run on iOS Simulator
- Test on physical iPhone/iPad devices
- Archive for App Store submission

For Android:
```bash
npx cap open android
```
This opens the project in Android Studio where you can:
- Build and run on Android Emulator
- Test on physical Android devices
- Generate signed APK/AAB for Play Store

### Helper Scripts
The `mobile-scripts.sh` file provides convenient shortcuts:

```bash
# Build and sync
./mobile-scripts.sh build

# Build and open iOS
./mobile-scripts.sh ios

# Build and open Android
./mobile-scripts.sh android

# Just sync changes
./mobile-scripts.sh sync
```

## Configuration

### App Identity
Located in `capacitor.config.ts`:
- **App ID**: `com.lockbox.app`
- **App Name**: `LockBox`
- **Web Directory**: `dist/public`

### Backend Connection
For production mobile apps, update `capacitor.config.ts` to point to your deployed backend:

```typescript
server: {
  androidScheme: 'https',
  iosScheme: 'https',
  url: 'https://your-app.replit.app', // Your deployed Replit URL
  cleartext: true,
}
```

**Important**: The mobile app needs to connect to a live backend. Deploy your Replit app first using the Publish button, then update the `url` field.

### Installed Plugins

#### Security - Encrypted Storage
- **`@aparajita/capacitor-secure-storage`** - Production-grade encrypted storage using:
  - **iOS**: Native Keychain for maximum security
  - **Android**: Native Keystore with hardware-backed encryption when available
  - **Use Case**: Stores Signal protocol private keys, identity keys, and session data
  - **Security**: Protected against jailbroken/rooted device access

#### Standard Plugins
- `@capacitor/preferences` - Standard local storage for non-sensitive settings (theme, layout)
- `@capacitor/push-notifications` - Real-time message notifications
- `@capacitor/splash-screen` - App launch screen
- `@capacitor/status-bar` - Native status bar customization
- `@capacitor/keyboard` - Keyboard behavior control

### Using Secure Storage for Encryption Keys

The `client/src/lib/capacitor-utils.ts` module provides a unified interface:

```typescript
import { SecureKeyStorage, isNativePlatform } from '@/lib/capacitor-utils';

// Store encryption keys (automatically uses native keychain/keystore on mobile)
await SecureKeyStorage.set('signalIdentityKey', identityKeyData);

// Retrieve keys
const identityKey = await SecureKeyStorage.get('signalIdentityKey');

// Remove keys
await SecureKeyStorage.remove('signalIdentityKey');

// Check platform
if (isNativePlatform()) {
  // Running on iOS or Android
  console.log('Using native secure storage');
} else {
  // Running on web - uses IndexedDB with WebCrypto
  console.log('Using IndexedDB encrypted storage');
}
```

**Key Points**:
- On native platforms: Uses hardware-backed keychain/keystore
- On web: Falls back to existing IndexedDB with WebCrypto AES-GCM encryption
- All Signal protocol keys should be stored using `SecureKeyStorage` on mobile
- Platform detection happens automatically

## Deployment

### iOS App Store
1. Open project in Xcode: `npx cap open ios`
2. Configure signing certificates (Apple Developer Account required)
3. Set deployment target (iOS 14+ recommended)
4. Archive for distribution: Product → Archive
5. Submit to App Store Connect

### Google Play Store
1. Open project in Android Studio: `npx cap open android`
2. Generate signing keystore
3. Update `android/app/build.gradle` with signing config
4. Build signed bundle: Build → Generate Signed Bundle/APK
5. Upload to Google Play Console

## Testing Mobile-Specific Features

### Local Development
During development, you can test the web version on mobile devices:
1. Deploy your Replit app (click Publish)
2. Access the `.replit.app` URL on your mobile browser
3. Test responsive design and touch interactions

### Native Testing
For native features (push notifications, secure storage):
1. Build the app: `npm run build && npx cap sync`
2. Open in native IDE: `npx cap open ios` or `npx cap open android`
3. Run on simulator/emulator or physical device
4. Test native integrations

## Important Notes

### Backend Deployment Required
- Mobile apps cannot connect to `localhost`
- Deploy your backend to Replit (use Publish button)
- Update `capacitor.config.ts` with production URL

### Platform-Specific Configuration
- **iOS**: Requires macOS and Xcode (cannot build on Replit directly)
- **Android**: Can be built on any platform with Android Studio
- Both platforms require native IDE for final builds

### Asset Updates
After changing web code, always sync:
```bash
npm run build && npx cap sync
```

### Plugin Installation
When adding new Capacitor plugins:
1. Install the npm package
2. Run `npx cap sync`
3. Update native permissions in Xcode/Android Studio if needed

### Push Notifications Setup

#### iOS (APNs)
1. Create App ID in Apple Developer Portal
2. Generate APNs certificate or key
3. Enable Push Notifications capability in Xcode
4. Update backend to send notifications via APNs

#### Android (Firebase Cloud Messaging)
1. Create Firebase project
2. Add `google-services.json` to `android/app/`
3. Configure FCM in Firebase Console
4. Update backend to send notifications via FCM

## Mobile Platform Initialization

The app automatically initializes mobile-specific features on startup via `capacitor-utils.ts`:

```typescript
import { initializeMobilePlatform } from '@/lib/capacitor-utils';

// Call this in your main App component
useEffect(() => {
  initializeMobilePlatform();
}, []);
```

This configures:
- Status bar styling (dark theme)
- Keyboard accessory bar
- Splash screen hiding
- Platform detection logging

## Troubleshooting

### Build Fails
- Ensure `npm run build` succeeds first
- Check that `dist/public/` contains `index.html` and assets

### Plugins Not Working
- Run `npx cap sync` after plugin installation
- Check native permissions in `Info.plist` (iOS) or `AndroidManifest.xml`

### Backend Connection Issues
- Verify backend URL in `capacitor.config.ts`
- Ensure backend is deployed and accessible
- Check CORS settings on backend

### White Screen on Launch
- Run `npx cap sync` to ensure latest web assets are copied
- Check browser console in native debugger for errors

### Secure Storage Not Working
- Verify `@aparajita/capacitor-secure-storage` is installed
- Run `npx cap sync` after installation
- Check that you're using `SecureKeyStorage` class correctly
- On iOS: Ensure keychain entitlements are configured
- On Android: Verify app has proper permissions

## Security Best Practices

### Encryption Key Storage
1. **Always use SecureKeyStorage** for Signal protocol keys on mobile
2. **Never** store private keys in localStorage, sessionStorage, or Preferences
3. **Verify** keychain/keystore access on app startup
4. **Handle** keychain wipes (e.g., user changed passcode)

### Network Security
1. **Enforce HTTPS** in capacitor.config.ts
2. **Pin certificates** for production backends
3. **Validate** all server responses
4. **Use** proper CORS configuration

### App Permissions
1. **Request** only necessary permissions
2. **Explain** permission usage to users
3. **Handle** permission denials gracefully

## Next Steps
1. Deploy your Replit backend (click Publish button)
2. Update `capacitor.config.ts` with production URL
3. Build web assets: `npm run build`
4. Sync to native: `npx cap sync`
5. Open in Xcode/Android Studio and test
6. Configure app icons and splash screens
7. Set up push notifications (APNs/FCM)
8. Test secure storage integration
9. Submit to App Store / Play Store
