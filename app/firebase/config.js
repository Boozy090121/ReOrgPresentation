import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Firebase configuration - ensure these are loaded correctly
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App (ensure it only happens once)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore instance getter
let dbInstance = null;
const getDbInstance = () => {
  if (!dbInstance) {
      // Initialize Firestore differently for browser and server/build
      if (isBrowser) {
         // Standard client-side initialization
         dbInstance = getFirestore(app);
         // Enable offline persistence (optional, only works in browser)
         enableIndexedDbPersistence(dbInstance).catch((err) => {
             if (err.code === 'failed-precondition') {
                 console.warn('DB Persistence: Multiple tabs open, only enable in one.');
             } else if (err.code === 'unimplemented') {
                 console.warn('DB Persistence: Browser does not support persistence.');
             }
         });
      } else {
         // Server-side/Build initialization (basic)
         // Use initializeFirestore for server environments if needed, 
         // but often just getFirestore is sufficient if not doing server-specific operations.
         dbInstance = getFirestore(app);
         // OR: If specific server settings needed:
         // dbInstance = initializeFirestore(app, { /* server settings if needed */ }); 
      }
  }
  return dbInstance;
};

// Auth instance getter
let authInstance = null;
const getAuthInstance = () => {
  if (!authInstance) {
    if (isBrowser) {
      // Client-side Auth with persistence
      // Use initializeAuth for explicit persistence control
      authInstance = initializeAuth(app, {
          persistence: browserLocalPersistence, // Or other persistence options
          // popupRedirectResolver: undefined // Add resolver if needed
      });
    } else {
      // Server-side/Build initialization (no persistence)
      authInstance = getAuth(app);
    }
  }
  return authInstance;
};

// Analytics instance getter (optional, browser-only)
let analyticsInstance = null;
const getAnalyticsInstance = async () => {
  if (!analyticsInstance && isBrowser && await isAnalyticsSupported()) {
    try {
        analyticsInstance = getAnalytics(app);
    } catch (error) {
        console.error('Error initializing Analytics:', error);
    }
  }
  return analyticsInstance;
};

// Export the initialized app and the instance getter functions
export { app, getDbInstance, getAuthInstance, getAnalyticsInstance }; 