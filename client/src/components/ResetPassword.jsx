import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg('Missing password reset token');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data } = await axios.post(`${API_URL}/reset-password`, {
        token,
        newPassword
      });
      setSuccessMsg(data.message || 'Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Reset token is invalid or has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-premium border border-surface-200 p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-400 to-[#B3648B]"></div>
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold text-[#2D213F]">Reset Password</h2>
          <p className="text-xs text-surface-500">Please enter your new secure password.</p>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 bg-danger-50 border border-danger-100 text-danger-700 p-4 rounded-2xl text-xs font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-16 h-16 bg-success-50 text-success-600 rounded-full flex items-center justify-center ring-8 ring-success-50/50 mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#2D213F]">Password Updated!</h3>
            <p className="text-sm text-success-700 font-medium">{successMsg}</p>
            <p className="text-xs text-surface-500 animate-pulse mt-2">Redirecting to Login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium outline-none focus:border-[#B3648B] focus:ring-2 focus:ring-[#B3648B]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-wider">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium outline-none focus:border-[#B3648B] focus:ring-2 focus:ring-[#B3648B]/10 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2D213F] text-white font-bold py-3.5 rounded-xl hover:bg-[#3D2F54] disabled:opacity-50 transition-colors shadow-sm text-sm flex items-center justify-center gap-2 mt-6"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
