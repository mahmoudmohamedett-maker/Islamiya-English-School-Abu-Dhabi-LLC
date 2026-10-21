/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudentApplication, LetterRequest, GradeLevel, ApplicationStatus } from '../../types/admissions';
import { exportApplicationsToCSV, printInvoice, printVoucher, printLetter } from '../../utils/exportUtils';
import {
  Database,
  Download,
  Filter,
  Search,
  FileText,
  User,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  Printer,
  ChevronRight,
  FolderOpen,
  Send,
  Building,
  Check,
  X,
} from 'lucide-react';

interface RegistrationDatabaseProps {
  applications: StudentApplication[];
  letters: LetterRequest[];
  onProcessLetter: (letterId: string, status: 'APPROVED' | 'READY_FOR_PICKUP', location?: string, notes?: string) => void;
  activeSubTab?: 'database' | 'letters';
  onChangeSubTab?: (tab: 'database' | 'letters') => void;
}

export const RegistrationDatabase: React.FC<RegistrationDatabaseProps> = ({
  applications,
  letters,
  onProcessLetter,
  activeSubTab = 'database',
  onChangeSubTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected Student Digital Dossier / File View
  const [selectedStudentFile, setSelectedStudentFile] = useState<StudentApplication | null>(null);

  // Letter processing modal state
  const [processingLetter, setProcessingLetter] = useState<LetterRequest | null>(null);
  const [letterAction, setLetterAction] = useState<'APPROVED' | 'READY_FOR_PICKUP'>('READY_FOR_PICKUP');
  const [collectionLocation, setCollectionLocation] = useState('School Registration Department, Counter 2');
  const [letterAdminNotes, setLetterAdminNotes] = useState('');

  // Filter application database
  const filteredApps = applications.filter((app) => {
    // 1. Search filter
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.studentId && app.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      app.emiratesId.includes(searchQuery) ||
      app.fatherPhone.includes(searchQuery);

    if (!matchesSearch) return false;

    // 2. Grade level filter
    if (gradeFilter !== 'ALL' && app.gradeApplying !== gradeFilter) {
      return false;
    }

    // 3. Academic status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PASSED_AND_COMPLETED') {
        if (app.status !== 'ENROLLED_ACTIVE' && app.status !== 'SUPER_ADMIN_APPROVED' && app.status !== 'PAYMENT_PENDING' && app.status !== 'INTERVIEW_PASSED') {
          return false;
        }
      } else if (app.status !== statusFilter) {
        return false;
      }
    }

    // 4. Date filter
    if (dateFrom && app.submissionDate < dateFrom) return false;
    if (dateTo && app.submissionDate > dateTo) return false;

    return true;
  });

  const handleSaveLetterProcessing = () => {
    if (!processingLetter) return;
    onProcessLetter(
      processingLetter.id,
      letterAction,
      collectionLocation,
      letterAdminNotes || 'Attested and signed by Registration Controller.'
    );
    setProcessingLetter(null);
  };

  return (
    <div className="space-y-6">
      {/* Registration Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-700" />
            <h2 className="text-base font-bold text-slate-900">
              Registration & Student Affairs Department
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full central registry of passed and completed student files, exportable reports (Excel/PDF), and official document attestation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportApplicationsToCSV(filteredApps)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel / CSV ({filteredApps.length})</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => onChangeSubTab && onChangeSubTab('database')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'database'
              ? 'bg-purple-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Master Student Registry ({filteredApps.length})
        </button>
        <button
          type="button"
          onClick={() => onChangeSubTab && onChangeSubTab('letters')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'letters'
              ? 'bg-purple-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Letters Desk & Attestations ({letters.length})
        </button>
      </div>

      {/* VIEW 1: MASTER STUDENT REGISTRY */}
      {activeSubTab === 'database' && (
        <div className="space-y-4">
          {/* Multi-filter Strip */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Search Registry</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by student, ID, Emirates ID, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-700"
                  />
                </div>
              </div>

              {/* Grade Filter */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Filter by Grade</label>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full py-1.5 px-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ALL">All Grades (KG-1 to Gr 12)</option>
                  <option value="KG-1">KG-1</option>
                  <option value="KG-2">KG-2</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              {/* Academic Status Filter */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-1.5 px-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PASSED_AND_COMPLETED">Passed & Completed Only</option>
                  <option value="ENROLLED_ACTIVE">Enrolled & Active</option>
                  <option value="PAYMENT_PENDING">Approved Pending Payment</option>
                  <option value="INTERVIEW_PASSED">Interview Passed</option>
                  <option value="WAITING_LIST">Waiting List</option>
                  <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                  <option value="DOCS_VERIFIED">Docs Verified</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Submission Date Range</label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full py-1 px-1.5 border border-slate-300 rounded text-[11px]"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full py-1 px-1.5 border border-slate-300 rounded text-[11px]"
                  />
                </div>
              </div>
            </div>

            {(gradeFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery || dateFrom || dateTo) && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span>Showing {filteredApps.length} filtered records</span>
                <button
                  type="button"
                  onClick={() => {
                    setGradeFilter('ALL');
                    setStatusFilter('ALL');
                    setSearchQuery('');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-purple-700 hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Database Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3">Student File ID</th>
                    <th className="py-3 px-3">Student Full Name</th>
                    <th className="py-3 px-3">Grade</th>
                    <th className="py-3 px-3">Emirates ID</th>
                    <th className="py-3 px-3">Parent Details</th>
                    <th className="py-3 px-3">Academic Status</th>
                    <th className="py-3 px-3 text-right">Tuition Paid</th>
                    <th className="py-3 px-3 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                        No student records found matching the active criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {app.studentId || app.applicationNo}
                        </td>

                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                          {app.studentName}
                        </td>

                        <td className="py-2.5 px-3 font-sans font-medium text-slate-800">
                          {app.gradeApplying}
                        </td>

                        <td className="py-2.5 px-3 text-slate-600">
                          {app.emiratesId}
                        </td>

                        <td className="py-2.5 px-3 font-sans text-slate-600">
                          <div className="text-[11px] font-medium text-slate-800">{app.fatherName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{app.fatherPhone}</div>
                        </td>

                        <td className="py-2.5 px-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            app.status === 'ENROLLED_ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'PAYMENT_PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : app.status === 'INTERVIEW_PASSED'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'WAITING_LIST'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {app.status.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          {app.payment?.isPaid ? (
                            <span className="font-bold text-emerald-800">
                              AED {app.payment.paidAmount.toLocaleString()}.00
                            </span>
                          ) : (
                            <span className="text-slate-400">AED 0.00</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-sans">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentFile(app)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold rounded text-[11px] transition-colors cursor-pointer"
                          >
                            <FolderOpen className="w-3 h-3 text-purple-700" />
                            <span>View File</span>
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

      {/* VIEW 2: LETTERS DESK & ATTESTATIONS */}
      {activeSubTab === 'letters' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Official Student Letters & Attestation Queue
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              "The Registration team user will follow up and once its accepted, the status will reflect to the student/Parent portal, and the registration team will upload the required documents or send proceed status so the user will come and collect it from the Registration DEPT."
            </p>

            <div className="divide-y divide-slate-100 text-xs">
              {letters.length === 0 ? (
                <div className="py-6 text-center text-slate-500">
                  No letter requests currently submitted.
                </div>
              ) : (
                letters.map((req) => (
                  <div key={req.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {req.letterType.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          req.status === 'READY_FOR_PICKUP'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        Student: <strong>{req.studentName}</strong> (ID: {req.studentId}) · Grade: {req.grade}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        <strong>Purpose:</strong> {req.purpose}
                      </div>
                      {req.collectionLocation && (
                        <div className="text-emerald-900 bg-emerald-50 border border-emerald-200 p-1.5 rounded text-[11px] mt-1">
                          Collection Instructions: {req.collectionLocation}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => printLetter(req)}
                        className="px-3 py-1.5 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Document</span>
                      </button>

                      {req.status === 'UNDER_REVIEW' && (
                        <button
                          type="button"
                          onClick={() => setProcessingLetter(req)}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Process & Issue Ready Status</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DIGITAL DOSSIER / FILE MODAL */}
      {selectedStudentFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-900 font-bold flex items-center justify-center font-mono">
                  {selectedStudentFile.studentId?.slice(-4) || 'FILE'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Official Student Digital Dossier: {selectedStudentFile.studentName}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    ID: {selectedStudentFile.studentId || selectedStudentFile.applicationNo} · Grade: {selectedStudentFile.gradeApplying} (AY {selectedStudentFile.academicYear})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentFile(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Personal Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Emirates ID:</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedStudentFile.emiratesId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date of Birth:</span>
                  <span className="font-bold text-slate-800">{selectedStudentFile.dob}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nationality:</span>
                  <span className="font-bold text-slate-800">{selectedStudentFile.nationality}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Gender:</span>
                  <span className="font-bold text-slate-800">{selectedStudentFile.gender}</span>
                </div>
              </div>

              {/* Parents & Contacts */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Legal Guardians & Contacts:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Father:</span>
                    <strong className="text-slate-900">{selectedStudentFile.fatherName}</strong>
                    <div className="text-slate-600 font-mono">{selectedStudentFile.fatherPhone} · {selectedStudentFile.fatherEmail}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mother:</span>
                    <strong className="text-slate-900">{selectedStudentFile.motherName}</strong>
                    <div className="text-slate-600 font-mono">{selectedStudentFile.motherPhone}</div>
                  </div>
                  <div className="md:col-span-2 pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Residential Address: </span>
                    <span className="text-slate-800">{selectedStudentFile.residentialAddress}, {selectedStudentFile.city}</span>
                  </div>
                </div>
              </div>

              {/* Assessment Records */}
              {selectedStudentFile.interview && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Assessment & Interview Evaluation:</h4>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Evaluator: {selectedStudentFile.interview.interviewer}</span>
                      <span className="font-bold text-emerald-800 font-mono">
                        Score: {selectedStudentFile.interview.aptitudeScore}% ({selectedStudentFile.interview.status})
                      </span>
                    </div>
                    <p className="text-slate-700 italic">"{selectedStudentFile.interview.feedback}"</p>
                  </div>
                </div>
              )}

              {/* Uploaded Documents Vault */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Attached ADEK Soft Copies:</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {selectedStudentFile.documents.map((doc) => (
                    <div key={doc.id} className="p-2.5 bg-white flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{doc.title}</span>
                        <span className="text-slate-400">({doc.fileName})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                        doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentFile(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCESS LETTER MODAL */}
      {processingLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 text-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Process Student Document Request
            </h3>
            <p className="text-slate-500 mb-4">
              Student: <strong>{processingLetter.studentName}</strong> · {processingLetter.letterType.replace(/_/g, ' ')}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Action</label>
                <select
                  value={letterAction}
                  onChange={(e) => setLetterAction(e.target.value as 'APPROVED' | 'READY_FOR_PICKUP')}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="READY_FOR_PICKUP">Ready for Collection from Registration DEPT</option>
                  <option value="APPROVED">Approved (Digital Copy Uploaded)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Collection Location / Instructions</label>
                <input
                  type="text"
                  value={collectionLocation}
                  onChange={(e) => setCollectionLocation(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registration Staff Notes</label>
                <textarea
                  rows={2}
                  value={letterAdminNotes}
                  onChange={(e) => setLetterAdminNotes(e.target.value)}
                  placeholder="e.g. Attested and sealed by Registration Controller Mr. Qasim."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProcessingLetter(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLetterProcessing}
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Update Status & Notify Parent</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
