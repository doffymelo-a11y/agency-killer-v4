// ============================================
// THE HIVE OS V4 - Forgot Password View
// Password reset via email
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../lib/supabase';

export default function ForgotPasswordView() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold mb-2 text-white">Check Your Email</h2>
            <p className="text-slate-400 mb-6">
              We've sent a password reset link to <span className="text-white font-medium">{email}</span>
            </p>

            <button
              onClick={() => navigate('/login')}
              className="w-full p-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">THE HIVE OS</h1>
          <p className="text-slate-400">Password Recovery</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-2 text-white">Forgot Password?</h2>
          <p className="text-slate-400 mb-6 text-sm">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              disabled={loading}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition disabled:opacity-50"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
