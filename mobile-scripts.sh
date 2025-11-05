#!/bin/bash

# LockBox Mobile Build Scripts
# These commands help you build and deploy iOS/Android apps

case "$1" in
  "build")
    echo "Building web assets and syncing to native projects..."
    npm run build && npx cap sync
    ;;
  "ios")
    echo "Opening iOS project in Xcode..."
    npm run build && npx cap sync && npx cap open ios
    ;;
  "android")
    echo "Opening Android project in Android Studio..."
    npm run build && npx cap sync && npx cap open android
    ;;
  "sync")
    echo "Syncing web assets to native projects..."
    npx cap sync
    ;;
  *)
    echo "LockBox Mobile Build Commands:"
    echo "  ./mobile-scripts.sh build    - Build web assets and sync to native"
    echo "  ./mobile-scripts.sh ios      - Build and open iOS in Xcode"
    echo "  ./mobile-scripts.sh android  - Build and open Android in Studio"
    echo "  ./mobile-scripts.sh sync     - Sync changes to native projects"
    ;;
esac
