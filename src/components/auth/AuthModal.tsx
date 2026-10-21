/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole } from '../../types/admissions';
import { X, Lock, Mail, Shield, GraduationCap, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { signInWithGoogle, syncCurrentUserProfile } from '../../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginAsRole: (role: UserRole, emailOrUser?: string) => void;
  onStartNewApplication: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginAsRole,
  onStartNewApplication,
}) => {
  const [tab, setTab] = useState<'PARENT' | 'STAFF'>('PARENT');
  const [isSignUp, setIsSignUp] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [parentPass, setParentPass] = useState('');
  const [staffRole, setStaffRole] = useState<'ADMIN_STAFF' | 'SUPER_ADMIN' | 'REGISTRATION'>('ADMIN_STAFF');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      onStartNewApplication();
      onClose();
    } else {
      onLoginAsRole('PARENT', parentEmail || 'parent@islamiya.ae');
      onClose();
    }
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginAsRole(staffRole);
    onClose();
  };

  const handleGoogleAuth = async () => {
    setIsLoadingGoogle(true);
    try {
      const user = await signInWithGoogle();
      const profile = await syncCurrentUserProfile(user);
      onLoginAsRole(profile.role, profile.email);
      onClose();
    } catch (err: unknown) {
      console.warn('Google auth modal error:', err);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="text-base font-bold text-slate-900">
              Islamiya English School Portal
            </div>
            <div className="text-xs text-slate-500">
              Academic Year 2027-2028 · Abu Dhabi
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-100/50 p-1.5">
          <button
            type="button"
            onClick={() => setTab('PARENT')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              tab === 'PARENT'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Parent & Student</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('STAFF')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              tab === 'STAFF'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Staff Administration</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* Google Sign In Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoadingGoogle}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
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
              <span>{isLoadingGoogle ? 'Connecting Firebase...' : 'Continue with Google (Firebase Auth)'}</span>
            </button>
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-slate-400">
                <span className="bg-white px-2 font-medium">Or credentials</span>
              </div>
            </div>
          </div>

          {tab === 'PARENT' ? (
            <div>
              <div className="mb-4">
                <div className="text-xs font-semibold text-slate-900">
                  {isSignUp ? 'New Registration Account' : 'Parent & Student Login'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {isSignUp
                    ? 'Create your admissions profile for AY 2027-2028.'
                    : 'Access your applicant tracker and ADEK admission files.'}
                </div>
              </div>

              <form onSubmit={handleParentSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email or Student ID (IES-2027-XXXX)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. parent@email.ae or IES-2027-0101"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(true)}
                      className="text-[10px] text-emerald-800 hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter password"
                      value={parentPass}
                      onChange={(e) => setParentPass(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>{isSignUp ? 'Register & Begin Application' : 'Sign In to Tracker'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {isSignUp ? 'Already registered?' : 'Enrolling a new student?'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-emerald-800 font-semibold hover:underline cursor-pointer"
                >
                  {isSignUp ? 'Sign In' : 'Register Student'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <div className="text-xs font-semibold text-slate-900">
                  School Staff Administration
                </div>
                <div className="text-[11px] text-slate-500">
                  Select your department to authenticate.
                </div>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Select Staff Role
                  </label>
                  <div className="space-y-2">
                    {[
                      { role: 'ADMIN_STAFF' as const, label: 'Admissions Staff (Document & Interview)' },
                      { role: 'SUPER_ADMIN' as const, label: 'Super Admin (Final Approvals & Quotas)' },
                      { role: 'REGISTRATION' as const, label: 'Registration Team (Registry & Letters)' },
                    ].map((item) => (
                      <label
                        key={item.role}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          staffRole === item.role
                            ? 'border-emerald-700 bg-emerald-50/50 font-semibold text-slate-900'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="modalStaffRole"
                          checked={staffRole === item.role}
                          onChange={() => setStaffRole(item.role)}
                          className="text-emerald-800"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Staff Email / Access Key
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="name@islamiya.ae"
                    defaultValue="staff@islamiya.ae"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Authorize & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Forgot modal within modal */}
          {isForgotOpen && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-900">Forgot Password Recovery</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(false);
                    setForgotSent(false);
                  }}
                  className="text-amber-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {forgotSent ? (
                <div className="text-emerald-700 text-[11px] font-medium flex items-center gap-1.5 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Recovery instructions sent to registered email!</span>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] text-amber-800 mb-2">
                    Enter your email to receive recovery instructions:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="parent@domain.ae"
                      defaultValue={parentEmail}
                      className="flex-1 px-2.5 py-1 text-xs border border-amber-300 rounded bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setForgotSent(true)}
                      className="px-2.5 py-1 bg-amber-700 text-white text-[11px] font-semibold rounded cursor-pointer"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
