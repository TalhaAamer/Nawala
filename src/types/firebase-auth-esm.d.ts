export {};

declare module 'firebase/auth/dist/esm/index.esm.js' {
  export {
    GoogleAuthProvider,
    getAuth,
    signInWithCredential,
  } from 'firebase/auth';
  export type { User } from 'firebase/auth';
}

declare module '@firebase/auth' {
  export function getReactNativePersistence(
    storage: import('@react-native-async-storage/async-storage').default,
  ): import('@firebase/auth').Persistence;
}
