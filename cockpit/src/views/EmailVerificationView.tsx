// ============================================
// THE HIVE OS V4 - Email Verification View
// Handle email confirmation after signup
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function EmailVerificationView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    verifyEmail();
  }, []);

  async function verifyEmail() {
    // Get token from URL
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || type !== 'signup') {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    try {
      // Verify the token
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup',
      });

      if (error) {
        setStatus('error');
        setMessage(error.message || 'Verification failed');
      } else {
        setStatus('success');
        setMessage('Email verified successfully!');

        // Redirect to projects after 2 seconds
        setTimeout(() => {
          navigate('/projects');
        }, 2000);
      }
    } catch (err) {
      setStatus('error');
      setMessage('An unexpected error occurred');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold mb-2 text-white">Verifying Email</h2>
              <p className="text-slate-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">Email Verified!</h2>
              <p className="text-slate-400 mb-6">{message}</p>
              <p className="text-sm text-slate-500">Redirecting to your dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">Verification Failed</h2>
              <p className="text-slate-400 mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full p-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
