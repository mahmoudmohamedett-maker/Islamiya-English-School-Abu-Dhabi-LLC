/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserRole } from '../types/admissions';
import { GraduationCap, Shield, UserCheck, Users, LogOut, CheckCircle } from 'lucide-react';
import { isAdminRole } from '../services/firebase';

interface NavbarProps {
  currentRole: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
  userEmail?: string;
  userDisplayName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  onSignOut,
  userEmail,
  userDisplayName,
}) => {
  const isSuperAdmin = isAdminRole(currentRole);

  const getBadge = () => {
    if (isSuperAdmin) {
      return {
        label: 'Super Admin',
        icon: <Shield className="w-3.5 h-3.5 text-amber-500" />,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    if (currentRole === 'ADMIN_STAFF') {
      return {
        label: 'Admissions Staff',
        icon: <UserCheck className="w-3.5 h-3.5 text-blue-500" />,
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    }
    if (currentRole === 'REGISTRATION') {
      return {
        label: 'Registration Team',
        icon: <Users className="w-3.5 h-3.5 text-purple-500" />,
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      };
    }
    return {
      label: 'Parent & Student',
      icon: <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  };

  const badge = getBadge();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Main Top Bar Contract: Brand - Role-specific Nav Links - User Profile / Sign Out */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Wordmark with official crest */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-amber-400 shadow-sm border border-emerald-800 shrink-0 font-serif font-black text-lg">
              IES
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                Islamiya English School Abu Dhabi
              </div>
              <div className="text-xs text-emerald-800 font-medium tracking-wide">
                Admissions Portal · Academic Year 2027-2028 · ADEK Approved
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links based on strictly authenticated role */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            {(!isSuperAdmin && currentRole !== 'ADMIN_STAFF' && currentRole !== 'REGISTRATION') && (
              <>
                <button
                  type="button"
                  onClick={() => onTabChange('tracker')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'tracker'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  My Application & Status
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('apply')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'apply'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  New Registration
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('fees')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'fees'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Fee Schedule & Plans
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('letters')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'letters'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Student Letters & Certificates
                </button>
              </>
            )}

            {currentRole === 'ADMIN_STAFF' && (
              <>
                <button
                  type="button"
                  onClick={() => onTabChange('staff-review')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'staff-review'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Document Verification Queue
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('staff-interviews')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'staff-interviews'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Assessment Interviews & Evaluation
                </button>
              </>
            )}

            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => onTabChange('super-approvals')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'super-approvals'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Executive Approval Queue
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('super-analytics')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'super-analytics'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Admissions Intelligence
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('super-settings')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'super-settings'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  School Quotas & Settings
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('super-roles')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'super-roles'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Staff Permissions
                </button>
              </>
            )}

            {currentRole === 'REGISTRATION' && (
              <>
                <button
                  type="button"
                  onClick={() => onTabChange('reg-database')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'reg-database'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Official Student Registry
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('reg-letters')}
                  className={`cursor-pointer transition-colors whitespace-nowrap py-1 ${
                    activeTab === 'reg-letters'
                      ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Letters Desk (NOC & Certificates)
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Authenticated User Badge & Sign Out */}
          <div className="flex items-center gap-3 shrink-0">
            {/* User Profile Card */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center text-xs">
                {(userDisplayName || userEmail || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 max-w-[160px] truncate" title={userEmail}>
                  {userDisplayName || userEmail}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              title="Sign out of Firebase Account"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
