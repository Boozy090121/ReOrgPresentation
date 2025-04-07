const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDvQq8Qq8Qq8Qq8Qq8Qq8Qq8Qq8Qq8Qq8",
  authDomain: "reorg-presentation.firebaseapp.com",
  projectId: "reorg-presentation",
  storageBucket: "reorg-presentation.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = 'Admin';
const ADMIN_PASSWORD = 'Admin1234';

async function createAdminUser() {
  try {
    // Create the user
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const user = userCredential.user;

    // Add user to admins collection
    await setDoc(doc(db, 'admins', user.uid), {
      email: ADMIN_EMAIL,
      createdAt: new Date()
    });

    console.log('Admin user created successfully!');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser(); 