import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Briefcase, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile
} from '../firebase.js';

export default function AuthPage({ onAuthSuccess = () => {} }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);

  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('other');

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Friendly Firebase error messages ──────────────────────────────────────
  const parseFirebaseError = (code) => {
    const map = {
      'auth/email-already-in-use': 'This email is already registered. Please sign in.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  };

  // ── Sign Up ────────────────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Set display name
      await updateProfile(userCredential.user, { displayName: name });

      setSuccessMsg('Account created successfully! You are now signed in.');
      setTimeout(() => {
        onAuthSuccess({
          id: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || name,
          occupation
        });
      }, 1000);
    } catch (err) {
      setErrorMsg(parseFirebaseError(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Sign In ────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setSuccessMsg('Login successful! Welcome back.');
      setTimeout(() => {
        onAuthSuccess({
          id: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || email,
          occupation: 'other'
        });
      }, 800);
    } catch (err) {
      setErrorMsg(parseFirebaseError(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Reset link sent! Please check your inbox.');
    } catch (err) {
      setErrorMsg(parseFirebaseError(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setSuccessMsg('Google sign-in successful!');
      setTimeout(() => {
        onAuthSuccess({
          id: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || result.user.email,
          occupation: 'other'
        });
      }, 800);
    } catch (err) {
      setErrorMsg(parseFirebaseError(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared input classes ───────────────────────────────────────────────────
  const inputClass = "w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium outline-none focus:border-[#B3648B] focus:ring-2 focus:ring-[#B3648B]/10 transition-all";

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-premium border border-surface-200 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-400 to-[#B3648B]"></div>

        {/* Header */}
        <div className="p-6 md:p-8 text-center bg-gradient-to-b from-surface-50 to-white border-b border-surface-100">
          <div className="w-14 h-14 bg-[#2D213F] text-[#E5B59E] rounded-2xl flex items-center justify-center mx-auto shadow-md mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M12 2a7 7 0 0 0-7 7c0 2.5 2 5 7 9 5-4 7-6.5 7-9a7 7 0 0 0-7-7z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-[#2D213F]">Welcome to SakhiCredit</h2>
          <p className="text-xs text-surface-500 font-medium mt-1">Empowering Women Financially</p>
        </div>

        {/* Tab Toggle */}
        {activeTab !== 'forgot' && (
          <div className="flex border-b border-surface-100 p-2 bg-surface-50">
            <button
              onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'login' ? 'bg-white text-[#2D213F] shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'signup' ? 'bg-white text-[#2D213F] shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}
            >
              Sign Up
            </button>
          </div>
        )}

        <div className="p-6 md:p-8 space-y-6">
          {/* Alerts */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 bg-danger-50 border border-danger-100 text-danger-700 p-4 rounded-2xl text-xs font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2.5 bg-success-50 border border-success-100 text-success-700 p-4 rounded-2xl text-xs font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ─── Sign In Form ─── */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider">Password</label>
                  <button type="button" onClick={() => setActiveTab('forgot')} className="text-[10px] font-bold text-[#B3648B] hover:underline">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium outline-none focus:border-[#B3648B] focus:ring-2 focus:ring-[#B3648B]/10 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 p-1">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-[#2D213F] text-white font-bold py-3.5 rounded-xl hover:bg-[#3D2F54] disabled:opacity-50 transition-colors shadow-sm text-sm flex items-center justify-center gap-2 mt-6">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
            </form>
          )}

          {/* ─── Sign Up Form ─── */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Anita Sharma"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="anita@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider">Occupation</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium outline-none focus:border-[#B3648B] focus:ring-2 focus:ring-[#B3648B]/10 transition-all appearance-none"
                  >
                    <option value="tailoring">Tailoring / Clothing</option>
                    <option value="beauty">Beauty Parlor / Cosmetics</option>
                    <option value="tiffin service">Tiffin Service / Catering</option>
                    <option value="handicrafts">Handicrafts / Art</option>
                    <option value="SHG member">Self-Help Group Member</option>
                    <option value="other">Other Occupation</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider">Password (Min 6 Characters)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium outline-none focus:border-[#B3648B] focus:ring-2 focus:ring-[#B3648B]/10 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 p-1">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-[#2D213F] text-white font-bold py-3.5 rounded-xl hover:bg-[#3D2F54] disabled:opacity-50 transition-colors shadow-sm text-sm flex items-center justify-center gap-2 mt-6">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Account
              </button>
            </form>
          )}

          {/* ─── Forgot Password Form ─── */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <h3 className="text-sm font-bold text-[#2D213F]">Reset Your Password</h3>
              <p className="text-xs text-surface-500 leading-relaxed">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button type="submit" disabled={isLoading} className="w-full bg-[#2D213F] text-white font-bold py-3.5 rounded-xl hover:bg-[#3D2F54] disabled:opacity-50 transition-colors shadow-sm text-sm flex items-center justify-center gap-2">
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Reset Link
                </button>
                <button type="button" onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }} className="w-full bg-surface-100 text-[#2D213F] font-bold py-3 rounded-xl hover:bg-surface-200 transition-colors text-xs">
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* ─── Google Sign-In ─── */}
          {activeTab !== 'forgot' && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-surface-200"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold text-surface-400 uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-surface-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 border border-surface-200 bg-white hover:bg-surface-50 text-[#2D213F] font-semibold py-3 rounded-xl transition-all text-sm shadow-sm disabled:opacity-50"
              >
                {/* Google logo SVG */}
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
