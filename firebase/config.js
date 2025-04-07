import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDvQq8Qq8Qq8Qq8Qq8Qq8Qq8Qq8Qq8Qq8",
  authDomain: "reorg-presentation.firebaseapp.com",
  projectId: "reorg-presentation",
  storageBucket: "reorg-presentation.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Handle initialization error
}

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);

// Check if current user is admin
const isAdmin = async (user) => {
  if (!user) return false;
  
  try {
    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Auth state observer
export const setupAuthObserver = (callback) => {
  try {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const adminStatus = await isAdmin(user);
        console.log('User is signed in:', user.email);
        console.log('Admin status:', adminStatus);
        if (callback) callback(user, adminStatus);
      } else {
        console.log('User is signed out');
        if (callback) callback(null, false);
      }
    });
  } catch (error) {
    console.error('Auth observer error:', error);
    if (callback) callback(null, false);
    return () => {}; // Return empty cleanup function
  }
};

export { db, auth, isAdmin }; 