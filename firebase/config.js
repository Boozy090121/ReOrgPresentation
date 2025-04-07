import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "reorg-presentation.firebaseapp.com",
  projectId: "reorg-presentation",
  storageBucket: "reorg-presentation.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
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
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const adminStatus = await isAdmin(user);
    console.log('User is signed in:', user.email);
    console.log('Admin status:', adminStatus);
  } else {
    console.log('User is signed out');
  }
});

export { db, auth, isAdmin }; 