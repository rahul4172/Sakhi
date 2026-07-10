import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { auth, signOut } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import VerifyEmail from './components/VerifyEmail';
import ResetPassword from './components/ResetPassword';

axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Exchange Firebase token for backend JWT session cookie
  const createBackendSession = async (firebaseUser, occupation = 'other') => {
    try {
      const idToken = await firebaseUser.getIdToken();
      const { data } = await axios.post('http://localhost:5000/api/auth/firebase-session', {
        idToken,
        name: firebaseUser.displayName || firebaseUser.email,
        occupation
      });
      return data.user;
    } catch (err) {
      console.error('Backend session creation failed:', err);
      // Still return a basic user object so UI doesn't crash
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Create/refresh the backend session cookie
        const backendUser = await createBackendSession(firebaseUser);
        setUser(backendUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = async (firebaseUserData) => {
    // firebaseUserData comes from AuthPage after successful Firebase login
    // Re-fetch the current Firebase user to get a fresh ID token
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const backendUser = await createBackendSession(firebaseUser, firebaseUserData.occupation);
      setUser(backendUser);
    } else {
      setUser(firebaseUserData);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear Firebase session
      await signOut(auth);
      // Clear backend JWT cookie
      await axios.post('http://localhost:5000/api/auth/logout').catch(() => {});
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-surface-200 border-t-[#B3648B] rounded-full animate-spin"></div>
          <p className="text-surface-500 font-medium text-lg">Loading secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-surface-50 font-sans">
        <Routes>
          <Route
            path="/login"
            element={!user ? <AuthPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/" />}
          />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/*"
            element={user ? <Dashboard sessionId={user.id} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
