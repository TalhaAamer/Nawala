import { GoogleAuthProvider, signInWithCredential, type User } from '@firebase/auth';
import { doc, setDoc, serverTimestamp } from '@firebase/firestore';

import { firebaseAuth, firestore } from '@/services/firebase';

export type GoogleAuthConfig = {
  androidClientId?: string;
  iosClientId?: string;
  webClientId?: string;
  redirectUri?: string;
};

export const googleAuthConfig: GoogleAuthConfig = {
  // Expo Go validates an Android client ID before opening the OAuth prompt.
  // The Web client is a usable fallback for Expo Go; standalone Android builds
  // should provide EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID instead.
  androidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  redirectUri: process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI,
};

export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  if (!firebaseAuth) {
    throw new Error('Firebase is not configured. Add the EXPO_PUBLIC_FIREBASE_* values to .env.local.');
  }
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(firebaseAuth, credential);
  if (firestore) {
    await setDoc(doc(firestore, 'users', result.user.uid), {
      uid: result.user.uid,
      email: result.user.email ?? null,
      displayName: result.user.displayName ?? null,
      photoURL: result.user.photoURL ?? null,
      provider: 'google.com',
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  return result.user;
}