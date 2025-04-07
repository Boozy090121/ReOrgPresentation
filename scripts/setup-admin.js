const admin = require('firebase-admin');
const serviceAccount = require('../reorg-presentation-firebase-adminsdk-fbsvc-ad182587f0.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupAdmin(email, password) {
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
    return userRecord;
  } catch (error) {
    console.error('Error setting up admin:', error);
    throw error;
  }
}

async function initializeCollections() {
  try {
    // Initialize timeline collection
    const timelineData = {
      phases: [
        {
          phase: "Phase 1: Planning & Preparation",
          timeframe: "Month 1 (April)",
          activities: [
            "Finalize organization structure and job descriptions",
            "Develop transition plan for existing staff",
            "Identify training needs and create development plans"
          ]
        },
        {
          phase: "Phase 2: Initial Implementation",
          timeframe: "Month 2 (May 1st Deadline)",
          activities: [
            "Transition existing staff to new roles",
            "Fill critical open positions",
            "Conduct initial training for all team members"
          ]
        },
        {
          phase: "Phase 3: Rollout & Stabilization",
          timeframe: "Months 5-6",
          activities: [
            "Complete training and onboarding for all staff",
            "Implement new shift coverage model",
            "Standardize client communication processes"
          ]
        },
        {
          phase: "Phase 4: Optimization",
          timeframe: "Months 7-9",
          activities: [
            "Review and refine organization based on feedback",
            "Develop advanced training for specialized roles",
            "Optimize client-specific processes"
          ]
        }
      ]
    };

    await db.collection('timeline').doc('current').set(timelineData);

    // Initialize budget collection
    const budgetData = {
      summary: {
        leadership: {
          title: "Leadership",
          roles: [
            { title: "Quality Director", count: 1, costRange: "$150,000 - $180,000" },
            { title: "Quality Managers", count: 3, costRange: "$378,000 - $474,000" },
            { title: "Quality Systems Lead", count: 1, costRange: "$90,000 - $105,000" },
            { title: "Lab Manager", count: 1, costRange: "$95,000 - $120,000" }
          ],
          subtotal: { count: 6, costRange: "$713,000 - $879,000" }
        },
        specialists: {
          title: "Specialists",
          roles: [
            { title: "Senior Quality Specialists", count: 6, costRange: "$540,000 - $660,000" },
            { title: "Quality Specialists", count: 8, costRange: "$560,000 - $680,000" },
            { title: "Quality Specialists, Complaints", count: 6, costRange: "$420,000 - $510,000" },
            { title: "Senior Lab Technicians", count: 2, costRange: "$150,000 - $180,000" }
          ],
          subtotal: { count: 22, costRange: "$1,670,000 - $2,030,000" }
        },
        associates: {
          title: "Associates",
          roles: [
            { title: "Associate QA Specialists (Day)", count: 6, costRange: "$330,000 - $420,000" },
            { title: "Associate QA Specialists (Night)", count: 3, costRange: "$165,000 - $210,000" },
            { title: "Lab Technicians", count: 4, costRange: "$220,000 - $280,000" },
            { title: "Associate Lab Technicians", count: 2, costRange: "$90,000 - $110,000" }
          ],
          subtotal: { count: 15, costRange: "$805,000 - $1,020,000" }
        },
        total: {
          count: 43,
          costRange: "$3,188,000 - $3,929,000"
        }
      }
    };

    await db.collection('budget').doc('current').set(budgetData);

    console.log('Successfully initialized collections');
  } catch (error) {
    console.error('Error initializing collections:', error);
    throw error;
  }
}

// Run setup
async function main() {
  try {
    // Replace with your desired admin email and password
    await setupAdmin('admin@example.com', 'your-secure-password');
    await initializeCollections();
    console.log('Setup completed successfully');
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    process.exit();
  }
}

main(); 