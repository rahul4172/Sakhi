import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'failed'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('failed');
        setMessage('Missing verification token');
        return;
      }
      try {
        const { data } = await axios.get(`${API_URL}/verify-email?token=${token}`);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setStatus('failed');
        setMessage(err.response?.data?.message || 'Verification link is invalid or expired.');
      }
    };
    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-premium border border-surface-200 p-8 text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-400 to-[#B3648B]"></div>
        
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-12 h-12 text-[#B3648B] animate-spin" />
            <h2 className="text-xl font-bold text-[#2D213F]">Verifying Your Email</h2>
            <p className="text-sm text-surface-500">Please wait while we confirm your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 bg-success-50 text-success-600 rounded-full flex items-center justify-center ring-8 ring-success-50/50 mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#2D213F]">Email Verified!</h2>
            <p className="text-sm text-success-700 font-medium">{message}</p>
            <p className="text-xs text-surface-500 animate-pulse mt-2">Redirecting to Login screen...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 bg-danger-50 text-danger-600 rounded-full flex items-center justify-center ring-8 ring-danger-50/50 mb-2">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#2D213F]">Verification Failed</h2>
            <p className="text-sm text-danger-700 font-medium">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2.5 bg-[#2D213F] hover:bg-[#3D2F54] text-white font-bold rounded-xl text-sm transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
