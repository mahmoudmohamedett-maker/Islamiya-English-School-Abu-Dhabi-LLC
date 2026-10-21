/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudentApplication, GradeLevel, UserProfile, UserRole } from '../../types/admissions';
import {
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  AlertOctagon,
  UserCheck,
  Settings,
  Trash2,
  Lock,
  Mail,
  UserX,
  Building,
  Users,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { fetchAllUserProfiles, updateUserRoleInFirestore, SUPER_ADMIN_EMAIL, isAdminRole } from '../../services/firebase';

interface SuperAdminDashboardProps {
  applications: StudentApplication[];
  onApproveApplication: (appId: string, remarks?: string) => void;
  onWaitlistApplication: (appId: string, remarks?: string) => void;
  onRejectApplication: (appId: string, remarks?: string) => void;
  onTerminateStudent: (appId: string, reason: string) => void;
  activeSubTab?: 'approvals' | 'analytics' | 'settings' | 'roles';
  onChangeSubTab?: (tab: 'approvals' | 'analytics' | 'settings' | 'roles') => void;
  currentRole?: UserRole;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  applications,
  onApproveApplication,
  onWaitlistApplication,
  onRejectApplication,
  onTerminateStudent,
  activeSubTab = 'approvals',
  onChangeSubTab,
  currentRole = 'SUPER_ADMIN',
}) => {
  const [selectedApp, setSelectedApp] = useState<StudentApplication | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [decisionModal, setDecisionModal] = useState<'APPROVE' | 'WAITLIST' | 'REJECT' | null>(null);

  // Termination State
  const [terminateApp, setTerminateApp] = useState<StudentApplication | null>(null);
  const [terminateReason, setTerminateReason] = useState('');

  // User Management State (Firestore backed)
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [rolesMessage, setRolesMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const profiles = await fetchAllUserProfiles();
      setUserProfiles(profiles || []);
    } catch (err) {
      console.warn('Could not fetch user profiles:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'roles' && isAdminRole(currentRole)) {
      loadUsers();
    }
  }, [activeSubTab, currentRole]);

  if (!isAdminRole(currentRole)) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
          ✕
        </div>
        <h3 className="text-base font-bold text-red-900 mb-1">Access Restricted · غير مصرح بالدخول</h3>
        <p className="text-xs text-red-700 leading-relaxed">
          The Super Admin panel is strictly accessible to verified accounts registered with an <code className="font-mono font-bold">admin</code> role in the Firestore <code className="font-mono font-bold">UserProfile</code> collection.
        </p>
      </div>
    );
  }

  const handleUpdateRole = async (targetUid: string, email: string, newRole: UserRole) => {
    setUpdatingUid(targetUid);
    setRolesMessage(null);
    try {
      await updateUserRoleInFirestore(targetUid, email, newRole);
      setRolesMessage(`Role updated successfully to ${newRole} for ${email}`);
      await loadUsers();
    } catch (err) {
      setRolesMessage(`Failed to update role: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUpdatingUid(null);
    }
  };

  // Strictly enforce admin authorization
  if (!isAdminRole(currentRole)) {
    return (
      <div className="bg-white border border-rose-200 rounded-xl p-8 text-center max-w-lg mx-auto shadow-sm my-10">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Access Denied · صلاحية غير مصرح بها
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          The Super Admin Dashboard is strictly restricted to authenticated administrators ({SUPER_ADMIN_EMAIL}) recorded in Firestore.
        </p>
      </div>
    );
  }

  // Candidates awaiting Super Admin Final Review (Passed interviews)
  const passedCandidates = applications.filter(
    (a) => a.status === 'INTERVIEW_PASSED'
  );

  // All active enrolled students who can be terminated if necessary
  const activeEnrolledStudents = applications.filter(
    (a) => a.status === 'ENROLLED_ACTIVE'
  );

  const handleConfirmDecision = () => {
    if (!selectedApp || !decisionModal) return;
    if (decisionModal === 'APPROVE') {
      onApproveApplication(selectedApp.id, actionRemarks || 'Approved by Principal for AY 2027-2028.');
    } else if (decisionModal === 'WAITLIST') {
      onWaitlistApplication(selectedApp.id, actionRemarks || 'Quota filled; placed on official ADEK waiting list.');
    } else if (decisionModal === 'REJECT') {
      onRejectApplication(selectedApp.id, actionRemarks || 'Application not accepted.');
    }
    setDecisionModal(null);
    setSelectedApp(null);
    setActionRemarks('');
  };

  const handleConfirmTermination = () => {
    if (!terminateApp || !terminateReason.trim()) return;
    onTerminateStudent(terminateApp.id, terminateReason);
    setTerminateApp(null);
    setTerminateReason('');
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-700" />
            <h2 className="text-base font-bold text-slate-900">
              Super Admin Executive Portal · Principal & Governance
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Final seat approval, waiting list assignments, user permissions in Firestore, and student enrollment termination.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium">
            Passed Candidates Awaiting Approval: <strong className="font-mono text-amber-950">{passedCandidates.length}</strong>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-medium">
            Active Enrolled Students: <strong className="font-mono text-emerald-950">{activeEnrolledStudents.length}</strong>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => onChangeSubTab && onChangeSubTab('approvals')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'approvals'
              ? 'bg-amber-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Executive Seat Approvals ({passedCandidates.length})
        </button>
        <button
          type="button"
          onClick={() => onChangeSubTab && onChangeSubTab('settings')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'settings'
              ? 'bg-amber-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          System Quotas & Student Termination
        </button>
        <button
          type="button"
          onClick={() => onChangeSubTab && onChangeSubTab('roles')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'roles'
              ? 'bg-amber-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Firestore User Roles & Permissions</span>
        </button>
      </div>

      {/* ROLES TAB */}
      {activeSubTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Firestore User Permissions & Roles Directory</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Directly manages user records stored in collection <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">/users</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">/admins</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={loadUsers}
                disabled={isLoadingUsers}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                <span>Refresh Directory</span>
              </button>
            </div>

            {rolesMessage && (
              <div className="mb-4 p-3 bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-lg">
                {rolesMessage}
              </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Display Name</th>
                    <th className="py-2.5 px-3">User UID (Auth)</th>
                    <th className="py-2.5 px-3">Registered At</th>
                    <th className="py-2.5 px-3">Current Role in Firestore</th>
                    <th className="py-2.5 px-3 text-right">Assign / Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {isLoadingUsers ? 'Loading Firestore users...' : 'No user profiles found in /users collection.'}
                      </td>
                    </tr>
                  ) : (
                    userProfiles.map((user) => {
                      const isOwner = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {user.email}
                            {isOwner && (
                              <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-bold">
                                Project Owner
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{user.displayName || '—'}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{user.id}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{user.createdAt ? user.createdAt.slice(0, 10) : '—'}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                user.role === 'SUPER_ADMIN'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : user.role === 'ADMIN_STAFF'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : user.role === 'REGISTRATION'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isOwner ? (
                              <span className="text-[11px] text-slate-400 italic">Permanent Super Admin</span>
                            ) : (
                              <select
                                value={user.role}
                                disabled={updatingUid === user.id}
                                onChange={(e) => handleUpdateRole(user.id, user.email, e.target.value as UserRole)}
                                className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-800 font-medium cursor-pointer"
                              >
                                <option value="PARENT">PARENT (Parent/Student)</option>
                                <option value="ADMIN_STAFF">ADMIN_STAFF (Admissions)</option>
                                <option value="REGISTRATION">REGISTRATION (Records Desk)</option>
                                <option value="SUPER_ADMIN">SUPER_ADMIN (Executive Admin)</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* APPROVALS TAB */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Passed Assessment Candidates Awaiting Final Executive Action
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              All students below have completed the mandatory interview assessment and received a "PASSED" recommendation with evaluator feedback.
            </p>

            {passedCandidates.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="font-bold text-slate-800">Queue is Clear</div>
                <p>No candidates currently pending final Super Admin approval.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {passedCandidates.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{app.studentName}</span>
                          <span className="text-xs text-emerald-800 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded">
                            {app.gradeApplying} (AY {app.academicYear})
                          </span>
                          {app.hasSiblingInSchool && (
                            <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-1.5 rounded">
                              Sibling Priority
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                          App No: {app.applicationNo} · EID: {app.emiratesId} · Nationality: {app.nationality}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setDecisionModal('APPROVE');
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Final Approval & Credentials</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setDecisionModal('WAITLIST');
                          }}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Add to Waiting List</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setDecisionModal('REJECT');
                          }}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                      <div>
                        <div className="text-slate-400 text-[10px] font-semibold uppercase">Parent Contact</div>
                        <div className="font-semibold text-slate-800 mt-0.5">{app.fatherName} ({app.fatherEmail})</div>
                        <div className="text-slate-500 text-[11px] font-mono">{app.fatherPhone}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] font-semibold uppercase">Assessment Results</div>
                        <div className="font-semibold text-emerald-800 mt-0.5">
                          Status: PASSED ({app.interview?.aptitudeScore || 85}% Aptitude)
                        </div>
                        <div className="text-slate-500 text-[11px]">Date: {app.interview?.date}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] font-semibold uppercase">Evaluator Feedback</div>
                        <div className="italic text-slate-700 mt-0.5">"{app.interview?.feedback || 'Satisfactory'}"</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeSubTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Active Enrolled Students & Termination Management
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Authorized Principal action: Super Admin can formally terminate or withdraw an enrolled student profile.
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Student ID</th>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">Enrollment Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeEnrolledStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No enrolled students currently registered.
                      </td>
                    </tr>
                  ) : (
                    activeEnrolledStudents.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{app.studentName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{app.studentId || 'N/A'}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{app.gradeApplying}</td>
                        <td className="py-2.5 px-3 text-slate-500">{app.payment?.paidDate || app.submissionDate}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono">
                            ACTIVE ENROLLED
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setTerminateApp(app)}
                            className="px-2.5 py-1 bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 font-semibold rounded text-[11px] cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Terminate Account</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DECISION MODAL */}
      {decisionModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6">
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Confirm {decisionModal === 'APPROVE' ? 'Final Admission Approval' : decisionModal === 'WAITLIST' ? 'Waiting List Allocation' : 'Application Rejection'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Student: <strong>{selectedApp.studentName}</strong> ({selectedApp.gradeApplying})
            </p>

            {decisionModal === 'APPROVE' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 text-xs mb-4 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Automated Credential Generation:</span>
                </div>
                <p>
                  Approving this candidate will automatically generate their student username & temporary password, dispatch the activation email, and start the <strong>15-day fee payment countdown</strong>.
                </p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Decision Remarks / Notification Notes:
                </label>
                <textarea
                  rows={3}
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder="Enter remarks for official record and applicant notification..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDecisionModal(null);
                    setSelectedApp(null);
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  className={`px-4 py-1.5 text-white font-semibold rounded-lg shadow-2xs cursor-pointer ${
                    decisionModal === 'APPROVE'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : decisionModal === 'WAITLIST'
                      ? 'bg-slate-700 hover:bg-slate-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  Confirm & Dispatch Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TERMINATION CONFIRMATION MODAL */}
      {terminateApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6">
            <div className="flex items-center gap-2 text-rose-700 mb-2">
              <AlertOctagon className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">
                Confirm Student Account Termination
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to terminate the student account for <strong>{terminateApp.studentName}</strong> (ID: {terminateApp.studentId || terminateApp.applicationNo})?
              This action will revoke their student credentials and mark their record as terminated.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Termination / Expulsion: <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  placeholder="e.g. Guardian relocation outside UAE / Formal withdrawal / Disciplinary termination..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTerminateApp(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!terminateReason.trim()}
                  onClick={handleConfirmTermination}
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  Terminate Student Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
