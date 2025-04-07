import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBvQJh8QJh8QJh8QJh8QJh8QJh8QJh8QJh8",
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
export const ADMIN_CREDENTIALS = {
  email: 'Admin',
  password: 'Admin1234'
};

// Function to check if user is admin
export const isAdmin = async (user) => {
  if (!user) return false;
  const userDoc = await getDoc(doc(db, 'admins', user.uid));
  return userDoc.exists();
};

// Setup authentication observer
export const setupAuthObserver = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const adminStatus = await isAdmin(user);
      console.log('User is signed in:', user.email);
      console.log('Admin status:', adminStatus);
      callback(user, adminStatus);
    } else {
      console.log('User is signed out');
      callback(null, false);
    }
  });
};

export { db, auth }; 