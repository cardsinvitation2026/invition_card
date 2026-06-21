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

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const FIREBASE_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

function hasFirebaseClientConfig(): boolean {
  return Boolean(
    FIREBASE_API_KEY && FIREBASE_AUTH_DOMAIN && FIREBASE_PROJECT_ID && FIREBASE_APP_ID,
  );
}

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
      apiKey: FIREBASE_API_KEY!,
      authDomain: FIREBASE_AUTH_DOMAIN!,
      projectId: FIREBASE_PROJECT_ID!,
      storageBucket: FIREBASE_STORAGE_BUCKET,
      messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
      appId: FIREBASE_APP_ID!,
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
