import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getAuthInstance } from '../app/firebase/config';

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
  const [loadingAuth, setLoadingAuth] = useState(true); // Start loading until auth state is resolved
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    const auth = getAuthInstance(); // Get Auth instance when hook mounts
    if (!auth) {
      console.error("useAuth: Auth service not available.");
      setError("Authentication service failed to initialize.");
      setLoadingAuth(false);
      return; // Stop if auth couldn't be initialized
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('Auth state changed: User logged in', user.uid);
        setUser(user);
        // Example: Check for admin claim (replace with your actual logic)
        // This requires setting custom claims via Firebase Admin SDK
        user.getIdTokenResult().then(idTokenResult => {
          setIsUserAdmin(!!idTokenResult.claims.admin); // Check for admin custom claim
          console.log('Admin check result:', !!idTokenResult.claims.admin);
        }).catch(err => {
          console.error("Error getting ID token result:", err);
          setIsUserAdmin(false); // Default to non-admin on error
          setError("Failed to verify user permissions.");
        }).finally(() => {
           setLoadingAuth(false); // Mark loading as complete after claims check
        });
      } else {
        console.log('Auth state changed: User logged out');
        setUser(null);
        setIsUserAdmin(false);
        setLoadingAuth(false); // Mark loading as complete
      }
    }, (authError) => {
      // Handle errors during listener setup or auth state changes
      console.error('Auth listener error:', authError);
      setUser(null);
      setIsUserAdmin(false);
      setError(`Authentication error: ${authError.message}`);
      setLoadingAuth(false); // Mark loading as complete even on error
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs once on mount

  const signOut = async () => {
    setLoadingAuth(true); // Indicate loading during sign out
    setError(null);
    const auth = getAuthInstance(); // Get auth instance again
    if (!auth) {
       console.error("Sign out failed: Auth service not available.");
       setError("Sign out failed: Auth service unavailable.");
       setLoadingAuth(false);
       return;
    }
    try {
      await firebaseSignOut(auth);
      // State updates (user: null, isAdmin: false) are handled by onAuthStateChanged
      console.log('User signed out successfully.');
    } catch (signOutError) {
      console.error('Sign out error:', signOutError);
      setError(`Sign out failed: ${signOutError.message}`);
    } finally {
      // Ensure loading is set to false even if onAuthStateChanged takes time
      // Though usually, the listener updates state quickly after sign out
      setLoadingAuth(false); 
    }
  };

  return { user, isUserAdmin, loadingAuth, signOut, error };
} 