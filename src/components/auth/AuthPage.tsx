/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Mail, GraduationCap, Shield, ArrowRight, AlertCircle, KeyRound, X, User, CheckCircle2 } from 'lucide-react';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  SUPER_ADMIN_EMAIL,
  normalizeEmail,
  DESIGNATED_STAFF_EMAILS,
} from '../../services/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthPageProps {
  onFirebaseAuthenticated?: (user: FirebaseUser) => void;
  onStartNewApplication: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onFirebaseAuthenticated,
  onStartNewApplication,
}) => {
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Forgot Password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      if (onFirebaseAuthenticated) {
        onFirebaseAuthenticated(user);
      }
    } catch (err: unknown) {
      console.warn('Google sign in error or popup closed:', err);
      const msg = err instanceof Error ? err.message : 'Google authentication could not be completed.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(msg);
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsLoading(true);

    const cleanEmail = normalizeEmail(email);

    try {
      if (authMode === 'SIGN_UP') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }
        const user = await signUpWithEmail(cleanEmail, password, fullName);
        setAuthSuccess('Account created successfully! Logging you in...');
        if (onFirebaseAuthenticated) {
          onFirebaseAuthenticated(user);
        }
      } else {
        const user = await signInWithEmail(cleanEmail, password);
        if (onFirebaseAuthenticated) {
          onFirebaseAuthenticated(user);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      if (
        cleanEmail.toLowerCase().includes('timonegypt') &&
        (msg.includes('user-not-found') || msg.includes('invalid-credential') || msg.includes('INVALID_LOGIN_CREDENTIALS'))
      ) {
        setAuthError(
          'Notice for timonegypt@gmail.com: If this email was previously signed in via Google, please click "Continue with Google" above. Or click "Send Password Setup Link" to establish the password Mm@123123 via your email.'
        );
      } else if (msg.includes('user-not-found') || msg.includes('invalid-credential')) {
        setAuthError('Invalid email or password. Please verify your credentials or create a new account.');
      } else if (msg.includes('email-already-in-use')) {
        setAuthError('An account with this email address already exists. Please sign in instead.');
      } else if (msg.includes('weak-password')) {
        setAuthError('Password is too weak. Please use at least 6 characters.');
      } else {
        setAuthError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setRecoveryLoading(true);
    try {
      await sendPasswordReset(recoveryEmail);
      setRecoverySuccess(true);
      setTimeout(() => {
        setIsForgotPasswordOpen(false);
        setRecoverySuccess(false);
        setRecoveryEmail('');
      }, 3500);
    } catch (err: unknown) {
      // In case user does not exist in Firebase Auth yet, provide user-friendly message
      setRecoverySuccess(true);
      setTimeout(() => {
        setIsForgotPasswordOpen(false);
        setRecoverySuccess(false);
        setRecoveryEmail('');
      }, 3500);
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* School Crest / Branding */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-900 mx-auto flex items-center justify-center text-amber-400 font-serif font-black text-2xl shadow-md border border-emerald-800">
          IES
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Islamiya English School Abu Dhabi
        </h2>
        <p className="mt-1 text-xs text-emerald-800 font-semibold tracking-wide">
          Official Admissions Portal · Academic Year 2027-2028 · ADEK Approved
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {/* Auth Mode Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode('SIGN_IN');
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'SIGN_IN'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In · تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('SIGN_UP');
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'SIGN_UP'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account · حساب جديد
            </button>
          </div>

          <div className="mb-4 text-center">
            <h3 className="text-base font-bold text-slate-900">
              {authMode === 'SIGN_IN' ? 'Portal Authentication' : 'Parent Registration'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {authMode === 'SIGN_IN'
                ? 'Sign in with your registered account. Roles and permissions are strictly enforced from your Firestore UserProfile record.'
                : 'Register as a parent to apply for student admission and track ADEK documentation status.'}
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Designated Admissions Staff Quick Assistance */}
          <div className="mb-4 p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Shield className="w-3.5 h-3.5 text-blue-700" />
                <span>Designated Admissions Staff</span>
              </div>
              <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded">
                ADMIN_STAFF
              </span>
            </div>
            <p className="text-[11px] text-blue-800 mt-1 leading-snug">
              Account: <code className="font-semibold font-mono">timonegypt@gmail.com</code>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('timonegypt@gmail.com');
                  setPassword('Mm@123123');
                  setAuthMode('SIGN_IN');
                  setAuthError(null);
                }}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100/50 border border-blue-300 rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
              >
                Auto-fill Staff Credentials
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await sendPasswordReset('timonegypt@gmail.com');
                    setAuthSuccess('Password setup link sent to timonegypt@gmail.com! Check your inbox to establish Mm@123123.');
                  } catch {
                    setAuthError('Could not send reset email. Please try again.');
                  }
                }}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Send Password Setup Link
              </button>
            </div>
          </div>

          {/* Primary Authentication: Firebase Google Auth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoadingGoogle || isLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoadingGoogle ? 'Connecting with Google...' : 'Continue with Google'}</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium text-[11px]">Or with email & password</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {authMode === 'SIGN_UP' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name (Parent / Guardian)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohammed Al-Hashimi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="parent@example.ae"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                {authMode === 'SIGN_IN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(email);
                      setIsForgotPasswordOpen(true);
                    }}
                    className="text-[11px] text-emerald-800 font-semibold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                />
              </div>
            </div>

            {authMode === 'SIGN_UP' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isLoadingGoogle}
              className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              <span>{isLoading ? 'Processing...' : authMode === 'SIGN_IN' ? 'Sign In' : 'Create Parent Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Access Policy Note */}
          <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Strict Firestore Role Security</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              • <strong>Super Admin Dashboard</strong>: Only accessible to users registered as <code className="text-slate-800 font-semibold font-mono text-[10px]">admin</code> in the Firestore <code className="text-slate-800 font-semibold font-mono text-[10px]">UserProfile</code> collection (<code className="text-slate-700 font-mono text-[10px]">{SUPER_ADMIN_EMAIL}</code>).<br />
              • <strong>Admissions Staff</strong>: Verified staff members in Firestore.<br />
              • <strong>Parents & Students</strong>: Submit applications and track real-time status.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-6 relative">
            <button
              type="button"
              onClick={() => {
                setIsForgotPasswordOpen(false);
                setRecoverySuccess(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Reset Account Password</h4>
                <p className="text-[11px] text-slate-500">Islamiya English School Portal</p>
              </div>
            </div>

            {recoverySuccess ? (
              <div className="py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h5 className="text-xs font-bold text-emerald-950 mb-1">Reset Email Dispatched</h5>
                <p className="text-xs text-slate-600">
                  Password reset link sent to <strong className="font-semibold text-slate-900">{recoveryEmail}</strong>. Please check your inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5 mt-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered Google or email address to receive a secure password recovery link:
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="parent@example.ae"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {recoveryLoading ? 'Sending...' : 'Send Password Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
