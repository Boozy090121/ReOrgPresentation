import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';

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
    const userCredential = await signInWithEmailAndPassword(
      auth,
      ADMIN_CREDENTIALS.email,
      ADMIN_CREDENTIALS.password
    );
    
    // Add user to admins collection
    await setDoc(doc(db, 'admins', userCredential.user.uid), {
      email: ADMIN_CREDENTIALS.email,
      createdAt: new Date()
    });
    
    console.log('Admin user created successfully');
    return userCredential.user;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
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