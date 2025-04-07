import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../app/firebase/config'; // Adjust path as needed

const checkAdminStatus = async (uid) => {
  if (!uid) return false;
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists();
  } catch (err) {
    console.error("Error checking admin status:", err);
    return false;
  }
};

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true); // Add loading state

  useEffect(() => {
    // Check if auth exists before setting up listener
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const isAdmin = await checkAdminStatus(authUser.uid);
        setIsUserAdmin(isAdmin);
        try {
          // Check if db exists
          if (db) {
            // Check if user.uid exists
            const uid = authUser.uid;
            if (uid) {
              const userDocRef = doc(db, "users", uid);
              const userDocSnap = await getDoc(userDocRef);
              // ... rest of logic ...
            }
          }
        } catch (error) {
          // ... error handling ...
        }
      } else {
        setIsUserAdmin(false);
      }
      setLoadingAuth(false); // Set loading to false after initial check
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  const signOut = async () => {
      try {
          await firebaseSignOut(auth);
          // State will be updated by onAuthStateChanged listener
      } catch (error) {
          console.error("Logout error:", error);
          // Optionally, handle logout error state here
      }
  };

  return { user, isUserAdmin, loadingAuth, signOut };
} 