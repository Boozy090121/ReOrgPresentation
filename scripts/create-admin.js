const admin = require('firebase-admin');
const serviceAccount = require('../reorg-presentation-firebase-adminsdk-fbsvc-ad182587f0.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createAdminUser(email, password) {
  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true
    });

    // Set custom claims (admin role)
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    // Add to admins collection
    await db.collection('admins').doc(userRecord.uid).set({
      admin: true,
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Successfully created admin user: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Please save these credentials securely.');
    return userRecord;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

// Run with your desired credentials
const ADMIN_EMAIL = 'admin@pci.com';
const ADMIN_PASSWORD = 'PCI@dmin2024!';

createAdminUser(ADMIN_EMAIL, ADMIN_PASSWORD)
  .then(() => process.exit())
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  }); 