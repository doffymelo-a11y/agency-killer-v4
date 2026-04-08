// ============================================
// THE HIVE OS V4 - Account Settings
// User profile, password, billing
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updatePassword, signOut, supabase } from '../lib/supabase';
import { getEmailPreferences, updateEmailPreferences } from '../services/support.service';
import type { EmailPreferences } from '../types/support.types';

export default function AccountSettingsView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Data export (GDPR)
  const [exportLoading, setExportLoading] = useState(false);

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Email preferences (Phase 2)
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  useEffect(() => {
    loadUser();
    loadEmailPreferences();
  }, []);

  async function loadUser() {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }

  async function loadEmailPreferences() {
    try {
      const prefs = await getEmailPreferences();
      setEmailPreferences(prefs);
    } catch (error) {
      console.error('[Account] Error loading email preferences:', error);
    }
  }

  async function handleUpdateEmailPreference(key: keyof Omit<EmailPreferences, 'user_id' | 'updated_at'>, value: boolean) {
    setPrefsSuccess(false);
    setPrefsLoading(true);

    try {
      const updated = await updateEmailPreferences({ [key]: value });
      setEmailPreferences(updated);
      setPrefsSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setPrefsSuccess(false), 3000);
    } catch (error) {
      console.error('[Account] Error updating email preference:', error);
      alert('Failed to update preference. Please try again.');
    } finally {
      setPrefsLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      setPasswordLoading(false);
      return;
    }

    const { error } = await updatePassword(newPassword);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    }

    setPasswordLoading(false);
  }

  async function handleExportData() {
    setExportLoading(true);

    try {
      // Fetch all user data
      const [
        { data: projects },
        { data: tasks },
        { data: chatSessions },
        { data: chatMessages },
        { data: subscription },
        { data: usage },
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*'),
        supabase.from('chat_sessions').select('*').eq('user_id', user.id),
        supabase.from('chat_messages').select('*'),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
        supabase.from('usage_tracking').select('*').eq('user_id', user.id),
      ]);

      // Build export object (GDPR compliant)
      const exportData = {
        export_date: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        subscription: subscription || null,
        usage: usage || [],
        projects: projects || [],
        tasks: tasks || [],
        chat_sessions: chatSessions || [],
        chat_messages: chatMessages || [],
      };

      // Create JSON blob
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      // Download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `the-hive-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[Account] Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    // Delete user data first
    await supabase.from('projects').delete().eq('user_id', user.id);
    await supabase.from('tasks').delete().eq('user_id', user.id);
    await supabase.from('chat_sessions').delete().eq('user_id', user.id);

    // Delete auth user (this will cascade delete remaining data via RLS)
    await supabase.auth.admin.deleteUser(user.id);

    // Sign out and redirect
    await signOut();
    navigate('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Account Settings</h1>
            <p className="text-slate-400">Manage your profile and preferences</p>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
          >
            ← Back to Projects
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <div className="p-3 rounded-lg bg-slate-700 border border-slate-600 text-white">
                  {user?.email}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">User ID</label>
                <div className="p-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-400 text-xs font-mono">
                  {user?.id}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Account Created</label>
                <div className="p-3 rounded-lg bg-slate-700 border border-slate-600 text-white">
                  {new Date(user?.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-lg text-sm bg-green-500/10 text-green-400 border border-green-500/20">
                Password updated successfully!
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  required
                  disabled={passwordLoading}
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  required
                  disabled={passwordLoading}
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full p-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Email Notifications (Phase 2) */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Email Notifications</h2>

            {prefsSuccess && (
              <div className="mb-4 p-3 rounded-lg text-sm bg-green-500/10 text-green-400 border border-green-500/20">
                Email preferences updated successfully!
              </div>
            )}

            <div className="space-y-4">
              <p className="text-slate-400 text-sm mb-4">
                Choose when you want to receive email notifications for your support tickets.
              </p>

              {emailPreferences ? (
                <>
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer transition group">
                    <input
                      type="checkbox"
                      checked={emailPreferences.notify_on_message}
                      onChange={(e) => handleUpdateEmailPreference('notify_on_message', e.target.checked)}
                      disabled={prefsLoading}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 focus:ring-offset-slate-800 disabled:opacity-50 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white group-hover:text-cyan-400 transition">
                        New messages
                      </div>
                      <div className="text-sm text-slate-400">
                        Receive an email when an admin responds to your ticket
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer transition group">
                    <input
                      type="checkbox"
                      checked={emailPreferences.notify_on_status_change}
                      onChange={(e) => handleUpdateEmailPreference('notify_on_status_change', e.target.checked)}
                      disabled={prefsLoading}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 focus:ring-offset-slate-800 disabled:opacity-50 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white group-hover:text-cyan-400 transition">
                        Status changes
                      </div>
                      <div className="text-sm text-slate-400">
                        Receive an email when the status of your ticket changes
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer transition group">
                    <input
                      type="checkbox"
                      checked={emailPreferences.notify_on_assignment}
                      onChange={(e) => handleUpdateEmailPreference('notify_on_assignment', e.target.checked)}
                      disabled={prefsLoading}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 focus:ring-offset-slate-800 disabled:opacity-50 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white group-hover:text-cyan-400 transition">
                        Ticket assignment
                      </div>
                      <div className="text-sm text-slate-400">
                        Receive an email when your ticket is assigned to an admin
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer transition group">
                    <input
                      type="checkbox"
                      checked={emailPreferences.notify_on_resolution}
                      onChange={(e) => handleUpdateEmailPreference('notify_on_resolution', e.target.checked)}
                      disabled={prefsLoading}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 focus:ring-offset-slate-800 disabled:opacity-50 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white group-hover:text-cyan-400 transition">
                        Ticket resolution
                      </div>
                      <div className="text-sm text-slate-400">
                        Receive an email when your ticket is marked as resolved
                      </div>
                    </div>
                  </label>
                </>
              ) : (
                <div className="flex items-center justify-center p-8">
                  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Data & Privacy (GDPR) */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Data & Privacy</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Export Your Data (GDPR)</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Download all your personal data in JSON format. This includes your projects, tasks, chat history, and subscription information.
                </p>
                <button
                  onClick={handleExportData}
                  disabled={exportLoading}
                  className="px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      Exporting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Download My Data
                    </div>
                  )}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <h3 className="font-semibold text-white mb-2">Privacy Policy & Terms</h3>
                <p className="text-slate-400 text-sm mb-3">
                  Learn how we handle your data and the terms of service.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/privacy')}
                    className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Privacy Policy
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => navigate('/terms')}
                    className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Terms of Service
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-slate-800 border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>

            {!showDeleteConfirm ? (
              <div>
                <p className="text-slate-400 mb-4">
                  Once you delete your account, there is no going back. All your projects, tasks, and data will be permanently deleted.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold transition"
                >
                  Delete Account
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-red-400 font-semibold">
                  ⚠️ Are you absolutely sure?
                </p>
                <p className="text-slate-400 text-sm">
                  This action cannot be undone. Type <span className="font-bold text-white">DELETE</span> to confirm.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full p-3 rounded-lg bg-slate-700 border border-red-500/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE'}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
