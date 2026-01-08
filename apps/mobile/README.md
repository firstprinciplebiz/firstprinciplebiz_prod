# FirstPrincipleBiz Mobile App

React Native mobile app for FirstPrincipleBiz, built with Expo.

## Tech Stack

- **Expo SDK 52** - React Native framework
- **Expo Router** - File-based navigation
- **NativeWind** - Tailwind CSS for React Native
- **Supabase** - Backend and authentication
- **Expo Notifications** - Push notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for development)
- Android Studio (for Android development)

### Environment Setup

Create a `.env` file in this directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Installation

From the monorepo root:

```bash
npm install
```

### Development

```bash
# Start the development server
npm run dev:mobile

# Or from this directory
npx expo start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS).

### Building

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Build development APK (Android)
eas build --platform android --profile development

# Build preview APK (Android)
eas build --platform android --profile preview

# Build production
eas build --platform android --profile production
```

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding/
│   ├── (tabs)/            # Main tab screens
│   │   ├── index.tsx      # Dashboard
│   │   ├── issues.tsx     # Browse issues
│   │   ├── messages.tsx   # Conversations
│   │   └── profile.tsx    # User profile
│   ├── issues/            # Issue screens
│   ├── chat/              # Chat screens
│   └── profile/           # Profile screens
├── components/            # Reusable components
│   └── ui/               # UI primitives
├── lib/                  # Utilities
│   ├── supabase.ts       # Supabase client
│   └── notifications.ts  # Push notifications
├── hooks/                # Custom hooks
├── assets/               # Images, fonts
└── app.json             # Expo config
```

## Features

- **Authentication**: Email/password login, signup, forgot password
- **Role-based**: Different experiences for students and businesses
- **Dashboard**: Stats, quick actions, recent activity
- **Issues**: Browse, search, filter, create, apply
- **Messaging**: Real-time chat with file attachments
- **Notifications**: Push notifications for messages and updates
- **Profiles**: View and edit profiles

## Shared Code

This app uses shared code from `packages/core`:

- Types and interfaces
- Supabase query functions
- Utility formatters
- React hooks

## Assets Required

Add the following images to `assets/`:

- `icon.png` (1024x1024) - App icon
- `splash-icon.png` (512x512) - Splash screen icon  
- `adaptive-icon.png` (1024x1024) - Android adaptive icon
- `favicon.png` (48x48) - Web favicon
- `notification-icon.png` (96x96) - Notification icon

## Push Notifications

For Android push notifications:

1. Create a Firebase project
2. Download `google-services.json`
3. Place it in this directory
4. Configure in Expo dashboard

## License

Private - All rights reserved





