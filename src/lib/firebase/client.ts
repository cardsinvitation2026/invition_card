// Firebase Web SDK client. Lazy-initialised; never imported by server modules.
'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import { hasFirebaseClientConfig } from '@/lib/auth/dev-mode';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export function isFirebaseClientReady(): boolean {
  return hasFirebaseClientConfig();
}

export function getFirebaseApp(): FirebaseApp {
  if (!hasFirebaseClientConfig()) {
    throw new Error(
      'Firebase client config missing. Populate NEXT_PUBLIC_FIREBASE_* env vars or run in dev mode.',
    );
  }
  if (!firebaseApp) {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    };
    firebaseApp = getApps()[0] ?? initializeApp(config);
  }
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
    void setPersistence(firebaseAuth, browserLocalPersistence);
  }
  return firebaseAuth;
}

export function getGoogleProvider(): GoogleAuthProvider {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  }
  return googleProvider;
}
