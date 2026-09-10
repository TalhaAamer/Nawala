# Firebase Google Sign-In Setup

## 1. Firebase project

1. Create or open a Firebase project.
2. Add a Web app and copy its Firebase config values.
3. In Authentication > Sign-in method, enable Google.
4. Add the app domains used by Expo AuthSession to Authentication > Settings > Authorized domains.

## 2. Google OAuth clients

Create OAuth 2.0 client IDs in Google Cloud Console for the same Firebase project:

- Android: package name `com.nawala.app` and the SHA-1 from the signing certificate.
- iOS: the app bundle identifier configured for the iOS build.
- Web: a Web application client ID.

The Web client ID is also the OAuth client used by Firebase's Google provider.

Expo Go cannot complete native OAuth redirects. Build a Nawala development build for Google sign-in:

```powershell
npx expo prebuild --clean
npx expo run:android
```

Create an Android OAuth client with package `com.nawala.app` and your signing SHA-1, then add its client ID to `.env.local` as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`. Use `com.nawala.app:/oauthredirect` as the native redirect URI. The Web client alone is not sufficient for the Android development build.

## 3. Local environment

Copy `.env.example` to `.env.local` and replace every placeholder with the Firebase config and OAuth client IDs. Expo exposes only variables prefixed with `EXPO_PUBLIC_`.

Restart Expo after changing `.env.local`:

```powershell
npx expo start -c
```

The app exchanges the Google ID token with Firebase in `src/features/auth/google.ts`. The Firebase UID is then stored in the existing session store.

## 4. Deploy Firestore rules

Install and authenticate the Firebase CLI, select the correct project, then deploy the checked-in rules:

```powershell
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
firebase deploy --only firestore:rules
```

The rules allow users to access only their own `/users/{uid}` data and prevent clients from editing or deleting orders after creation. Do not replace them with `allow read, write: if true`.

## 5. Production requirements

Use separate Firebase projects or OAuth clients for development and production. Restrict Android and iOS OAuth clients to the package/bundle identifier and signing certificate. Rotate any API key that has been shared publicly.
