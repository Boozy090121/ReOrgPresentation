import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB1QJQJQJQJQJQJQJQJQJQJQJQJQJQJQJQ",
  authDomain: "pci-quality-org.firebaseapp.com",
  projectId: "pci-quality-org",
  storageBucket: "pci-quality-org.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'Admin',
  password: 'Admin1234'
};

// Function to check if user is admin
export const isAdmin = async (user) => {
  if (!user) return false;
  try {
    const userDoc = await getDoc(doc(db, 'admins', user.uid));
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Function to create admin user
export const createAdminUser = async () => {
  try {
    // Try to create the admin user
    await createUserWithEmailAndPassword(auth, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      // If user exists, try to sign in
      await signInWithEmailAndPassword(auth, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    } else {
      throw error;
    }
  }
};

// Setup authentication observer
export const setupAuthObserver = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'admins', user.uid));
      callback(user, userDoc.exists());
    } else {
      callback(null, false);
    }
  });
};

export { db, auth }; 