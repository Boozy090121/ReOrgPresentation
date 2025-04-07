import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../app/firebase/config'; // Assuming auth is exported from here

// This component assumes useAuth hook provides user and isUserAdmin
// For now, we pass them as props, along with handleLogout
// It manages its own modal state and login logic

const AuthSection = ({ user, isUserAdmin, handleLogout }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      // signInWithEmailAndPassword handles the auth state change,
      // which should be picked up by the (future) useAuth hook
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      console.error('Login error:', error);
      if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-email'].includes(error.code)) {
        setLoginError('Invalid email or password.');
      } else {
        setLoginError('An error occurred during login.');
      }
    }
  };

  return (
    <div className="auth-section">
      {/* Login Modal */} 
      {showLoginModal && !user && (
        <div className="modal-overlay">
          <div className="modal-content login-modal">
            <h2>Admin Login</h2>
            {loginError && <div className="error-message">{loginError}</div>}
            <form onSubmit={handleLogin}>
              <input
                type="email"
                className="modal-input"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoFocus
              />
              <input
                type="password"
                className="modal-input"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <div className="modal-actions">
                 <button type="button" onClick={() => setShowLoginModal(false)} className="button secondary-button">Cancel</button>
                 <button type="submit" className="button primary-button">Login</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Status and Buttons */} 
      {user ? (
        <>
          <span className="user-email">{user.email} {isUserAdmin ? '(Admin)' : ''}</span>
          <button onClick={handleLogout} className="auth-button logout-button">Logout</button>
        </>
      ) : (
        <button onClick={() => setShowLoginModal(true)} className="auth-button login-button">Admin Login</button>
      )}
    </div>
  );
};

export default AuthSection; 