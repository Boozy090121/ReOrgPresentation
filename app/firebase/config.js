import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App (Singleton pattern)
// Check if Firebase App has already been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Get Firestore and Auth instances (can be used server-side and client-side)
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Analytics and Persistence only on the client
let analytics;
if (typeof window !== 'undefined') { // Check for browser environment
  try {
    analytics = getAnalytics(app);
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support persistence.');
      }
    });
  } catch (error) {
    console.error('Firebase client-side initialization error (Analytics/Persistence):', error);
  }
}

// Export the initialized services
export { app, analytics, db, auth };

// Optional: Helper functions to get instances (might already exist elsewhere?)
// If not, these ensure you always get the initialized instance.
export const getDbInstance = () => db;
export const getAuthInstance = () => auth; 