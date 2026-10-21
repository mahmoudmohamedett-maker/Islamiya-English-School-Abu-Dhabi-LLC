/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudentApplication, AssessmentInterview, UploadedDoc } from '../../types/admissions';
import {
  FileCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Search,
  Filter,
  Check,
  X,
  Send,
  UserCheck,
  User,
} from 'lucide-react';

interface StaffAdmissionsProps {
  applications: StudentApplication[];
  onVerifyDocument: (appId: string, docId: string, verified: boolean, notes?: string) => void;
  onVerifyAllDocuments: (appId: string) => void;
  onRequestReupload: (appId: string, docId: string, notes: string) => void;
  onScheduleInterview: (appId: string, interview: AssessmentInterview) => void;
  onCompleteEvaluation: (appId: string, result: 'PASSED' | 'FAILED', feedback: string, score: number) => void;
}

export const StaffAdmissions: React.FC<StaffAdmissionsProps> = ({
  applications,
  onVerifyDocument,
  onVerifyAllDocuments,
  onRequestReupload,
  onScheduleInterview,
  onCompleteEvaluation,
}) => {
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<StudentApplication | null>(null);

  // Scheduling Modal State
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [schedDate, setSchedDate] = useState('2026-10-28');
  const [schedTime, setSchedTime] = useState('10:00 AM');
  const [schedVenue, setSchedVenue] = useState('Primary Campus Assessment Suite 1');
  const [schedInterviewer, setSchedInterviewer] = useState('Mrs. Fatima Al Qasimi (Head of Admissions)');

  // Evaluation Modal State
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evalResult, setEvalResult] = useState<'PASSED' | 'FAILED'>('PASSED');
  const [evalFeedback, setEvalFeedback] = useState('');
  const [evalScore, setEvalScore] = useState<number>(85);
  const [evalAttended, setEvalAttended] = useState(true);
  const [evalError, setEvalError] = useState('');

  // Re-upload Request Modal State
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [reuploadNotes, setReuploadNotes] = useState('');

  // Document Viewer State (Requirement 6)
  const [viewingDoc, setViewingDoc] = useState<UploadedDoc | null>(null);
  const [viewerFeedbackMode, setViewerFeedbackMode] = useState(false);

  // Filtering
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.emiratesId.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterStage === 'PENDING_DOCS') {
      return app.status === 'PENDING_DOCS' || app.status === 'DOCS_REUPLOAD_REQ';
    } else if (filterStage === 'READY_FOR_INTERVIEW') {
      return app.status === 'DOCS_VERIFIED';
    } else if (filterStage === 'INTERVIEW_SCHEDULED') {
      return app.status === 'INTERVIEW_SCHEDULED';
    } else if (filterStage === 'EVALUATED') {
      return app.status === 'INTERVIEW_PASSED' || app.status === 'INTERVIEW_FAILED';
    }
    return true;
  });

  const handleOpenEvaluation = (app: StudentApplication) => {
    setSelectedApp(app);
    setEvalResult('PASSED');
    setEvalFeedback('');
    setEvalScore(85);
    setEvalAttended(true);
    setEvalError('');
    setIsEvaluationModalOpen(true);
  };

  const handleSaveEvaluation = () => {
    if (!evalFeedback.trim()) {
      setEvalError('Feedback is mandatory per school and ADEK compliance rules.');
      return;
    }
    if (selectedApp) {
      onCompleteEvaluation(selectedApp.id, evalResult, evalFeedback, evalScore);
      setIsEvaluationModalOpen(false);
      setSelectedApp(null);
    }
  };

  const handleOpenSchedule = (app: StudentApplication) => {
    setSelectedApp(app);
    setIsSchedulingModalOpen(true);
  };

  const handleSaveSchedule = () => {
    if (selectedApp) {
      onScheduleInterview(selectedApp.id, {
        date: schedDate,
        time: schedTime,
        venue: schedVenue,
        interviewer: schedInterviewer,
        attended: false,
        status: 'SCHEDULED',
      });
      setIsSchedulingModalOpen(false);
      setSelectedApp(null);
    }
  };

  const handleOpenReupload = (doc: UploadedDoc) => {
    setSelectedDocId(doc.id);
    setReuploadNotes('');
    setIsReuploadModalOpen(true);
  };

  const handleSaveReupload = () => {
    if (selectedApp && selectedDocId) {
      onRequestReupload(selectedApp.id, selectedDocId, reuploadNotes || 'Please upload a clearer scan of front and back.');
      setIsReuploadModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-bold text-slate-900">
              Admissions Staff Desk · Verification & Assessment
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review uploaded parent documents, schedule interviews, and record mandatory assessment evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500">Pending Docs: </span>
            <span className="font-bold text-amber-800 font-mono">
              {applications.filter((a) => a.status === 'PENDING_DOCS' || a.status === 'DOCS_REUPLOAD_REQ').length}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500">Ready for Interview: </span>
            <span className="font-bold text-blue-800 font-mono">
              {applications.filter((a) => a.status === 'DOCS_VERIFIED').length}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500">Awaiting Evaluation: </span>
            <span className="font-bold text-emerald-800 font-mono">
              {applications.filter((a) => a.status === 'INTERVIEW_SCHEDULED').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {[
            { id: 'ALL', label: 'All Applications' },
            { id: 'PENDING_DOCS', label: '1. Documents Review' },
            { id: 'READY_FOR_INTERVIEW', label: '2. Ready to Schedule' },
            { id: 'INTERVIEW_SCHEDULED', label: '3. Scheduled Interviews' },
            { id: 'EVALUATED', label: '4. Completed Evaluations' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterStage(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filterStage === f.id
                  ? 'bg-emerald-800 text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student, ID, Emirates ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-xs"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Applicant Particulars</th>
                <th className="py-3 px-4">Grade & Year</th>
                <th className="py-3 px-4">Sibling In School</th>
                <th className="py-3 px-4">Document Vault</th>
                <th className="py-3 px-4">Lifecycle State</th>
                <th className="py-3 px-4">Interview Record</th>
                <th className="py-3 px-4 text-right">Admissions Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No applications matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{app.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {app.applicationNo} · EID: {app.emiratesId}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Parent: {app.fatherName} ({app.fatherPhone})
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{app.gradeApplying}</div>
                      <div className="text-[10px] text-slate-500 font-normal">AY {app.academicYear}</div>
                    </td>

                    <td className="py-3 px-4">
                      {app.hasSiblingInSchool ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          Priority: {app.siblingName} ({app.siblingGrade})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Standard</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="flex items-center gap-1 text-xs text-emerald-800 hover:underline font-medium cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {app.documents.filter((d) => d.status === 'VERIFIED').length} / {app.documents.length} Docs
                          </span>
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        app.status === 'DOCS_VERIFIED'
                          ? 'bg-blue-100 text-blue-800'
                          : app.status === 'INTERVIEW_SCHEDULED'
                          ? 'bg-purple-100 text-purple-800'
                          : app.status === 'INTERVIEW_PASSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'INTERVIEW_FAILED'
                          ? 'bg-rose-100 text-rose-800'
                          : app.status === 'DOCS_REUPLOAD_REQ'
                          ? 'bg-amber-100 text-amber-800 font-bold'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {app.interview ? (
                        <div>
                          <div className="font-medium text-slate-800">
                            {app.interview.date} at {app.interview.time}
                          </div>
                          {app.interview.status && (
                            <div className="text-[10px] text-slate-500">
                              Result: <strong>{app.interview.status}</strong>
                              {app.interview.aptitudeScore ? ` (${app.interview.aptitudeScore}%)` : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Not scheduled</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Action 1: Review Documents */}
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors cursor-pointer"
                        >
                          Inspect Docs
                        </button>

                        {/* Action 2: Schedule Interview (if docs verified) */}
                        {app.status === 'DOCS_VERIFIED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenSchedule(app)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Schedule Interview</span>
                          </button>
                        )}

                        {/* Action 3: Conduct / Update Evaluation (if scheduled) */}
                        {app.status === 'INTERVIEW_SCHEDULED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenEvaluation(app)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Evaluate (Pass/Fail)</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOCUMENT INSPECTION DRAWER / MODAL */}
      {selectedApp && !isSchedulingModalOpen && !isEvaluationModalOpen && !isReuploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Document Inspection & ADEK Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Candidate: <strong>{selectedApp.studentName}</strong> · {selectedApp.gradeApplying} ({selectedApp.applicationNo})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Uploaded Documents Checklist:</span>
                <button
                  type="button"
                  onClick={() => {
                    onVerifyAllDocuments(selectedApp.id);
                    setSelectedApp({
                      ...selectedApp,
                      status: 'DOCS_VERIFIED',
                      documents: selectedApp.documents.map((d) => ({ ...d, status: 'VERIFIED' })),
                    });
                  }}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify All Documents & Qualify</span>
                </button>
              </div>

              <div className="space-y-3">
                {selectedApp.documents.map((doc) => (
                  <div key={doc.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{doc.title}</span>
                          {doc.mandatory && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 rounded">
                              MANDATORY
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          File: {doc.fileName} · Size: {doc.fileSize} · Uploaded: {doc.uploadDate}
                        </div>
                        {doc.verificationNotes && (
                          <div className="text-amber-800 text-[11px] mt-1 bg-amber-50 p-1.5 rounded border border-amber-200">
                            <strong>Note:</strong> {doc.verificationNotes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          doc.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'REUPLOAD_REQUESTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {doc.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setViewingDoc(doc);
                            setViewerFeedbackMode(false);
                            setReuploadNotes('');
                          }}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View & Verify</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onVerifyDocument(selectedApp.id, doc.id, true)}
                          title="Mark Document as Verified"
                          className="p-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReupload(doc)}
                          title="Request Parent to Re-upload clearer copy"
                          className="p-1.5 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded cursor-pointer"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Once all required documents are verified, the applicant unlocks assessment interview scheduling.
              </span>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {isSchedulingModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6">
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Schedule Assessment Interview Appointment
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Student: <strong>{selectedApp.studentName}</strong> ({selectedApp.gradeApplying})
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                <input
                  type="text"
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  placeholder="e.g. 10:00 AM"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Venue / Assessment Room</label>
                <input
                  type="text"
                  value={schedVenue}
                  onChange={(e) => setSchedVenue(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Evaluator</label>
                <input
                  type="text"
                  value={schedInterviewer}
                  onChange={(e) => setSchedInterviewer(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSchedulingModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Confirm Appointment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EVALUATION MODAL (PASS/FAIL + MANDATORY FEEDBACK) */}
      {isEvaluationModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 p-6">
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Assessment Interview Evaluation Desk
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter official result for <strong>{selectedApp.studentName}</strong> ({selectedApp.gradeApplying}).
            </p>

            {evalError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{evalError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evalAttended}
                    onChange={(e) => setEvalAttended(e.target.checked)}
                    className="rounded text-emerald-800"
                  />
                  <span>Student attended and completed the assessment in person</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Assessment Outcome Decision:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                    evalResult === 'PASSED' ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="evalOutcome"
                      checked={evalResult === 'PASSED'}
                      onChange={() => setEvalResult('PASSED')}
                      className="text-emerald-800"
                    />
                    <div>
                      <div className="font-bold">PASSED</div>
                      <div className="text-[10px] text-slate-500">Pushed to Super Admin for Final Seat Approval</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                    evalResult === 'FAILED' ? 'border-rose-600 bg-rose-50/60 text-rose-950' : 'border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="evalOutcome"
                      checked={evalResult === 'FAILED'}
                      onChange={() => setEvalResult('FAILED')}
                      className="text-rose-800"
                    />
                    <div>
                      <div className="font-bold">FAILED</div>
                      <div className="text-[10px] text-slate-500">Readiness benchmarks not achieved</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Aptitude / Benchmark Score (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={evalScore}
                  onChange={(e) => setEvalScore(parseInt(e.target.value) || 0)}
                  className="w-32 p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Mandatory Assessment Feedback Box: <span className="text-rose-600">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Detailed developmental, academic, and behavioral commentary required by school policy before submitting.
                </p>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail candidate's psychological and physiological readiness, language fluency, mathematical reasoning, and specific recommendations..."
                  value={evalFeedback}
                  onChange={(e) => {
                    setEvalFeedback(e.target.value);
                    if (e.target.value.trim()) setEvalError('');
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEvaluationModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvaluation}
                  className={`px-4 py-1.5 text-white font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5 ${
                    evalResult === 'PASSED' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit Mandatory Evaluation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST REUPLOAD MODAL */}
      {isReuploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6">
            <h3 className="font-bold text-sm text-slate-900 mb-1">
              Request Additional / Clearer Document from Parent
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Provide feedback on why the document was rejected or needs re-upload.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Staff Note / Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={reuploadNotes}
                  onChange={(e) => setReuploadNotes(e.target.value)}
                  placeholder="e.g. Scanned copy is blurred or expiration date is cut off. Please re-upload clear high-resolution PDF scan..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReuploadModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReupload}
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Notification to Parent</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW & VERIFICATION VIEWER WITH FEEDBACK BOX (Requirement 6) */}
      {viewingDoc && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{viewingDoc.title}</h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Candidate: {selectedApp.studentName} · {viewingDoc.fileName} ({viewingDoc.fileSize})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Visual Scan Representation */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 mb-3">
                  <FileCheck className="w-8 h-8 text-emerald-700" />
                </div>
                <div className="font-bold text-slate-800 text-sm">{viewingDoc.fileName}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Format: {viewingDoc.fileName.endsWith('.pdf') ? 'Adobe PDF Document' : 'JPEG Image'} · Uploaded: {viewingDoc.uploadDate}
                </div>
                <div className="mt-3 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600">
                  ADEK Compliance Check: White Background / Certified Scanned Copy
                </div>

                {viewingDoc.verificationNotes && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 text-left w-full max-w-md">
                    <strong>Previous Staff Feedback:</strong> {viewingDoc.verificationNotes}
                  </div>
                )}
              </div>

              {/* Feedback Box for Re-upload Request */}
              {viewerFeedbackMode && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs animate-in fade-in">
                  <label className="block font-bold text-rose-900">
                    Mandatory Feedback for Parent Re-upload Request:
                  </label>
                  <textarea
                    rows={3}
                    value={reuploadNotes}
                    onChange={(e) => setReuploadNotes(e.target.value)}
                    placeholder="Enter specific feedback explaining why this document cannot be accepted (e.g. expired ID date, blurred scan, missing back side)..."
                    className="w-full p-2.5 border border-rose-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-rose-600"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setViewerFeedbackMode(false)}
                      className="px-3 py-1 text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!reuploadNotes.trim()}
                      onClick={() => {
                        onRequestReupload(selectedApp.id, viewingDoc.id, reuploadNotes);
                        setViewingDoc(null);
                      }}
                      className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Re-upload Request</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
              <span className={`px-2.5 py-1 rounded font-bold font-mono ${
                viewingDoc.status === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : viewingDoc.status === 'REUPLOAD_REQUESTED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                Current Status: {viewingDoc.status}
              </span>

              <div className="flex items-center gap-2">
                {!viewerFeedbackMode && (
                  <button
                    type="button"
                    onClick={() => setViewerFeedbackMode(true)}
                    className="px-3.5 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Request Re-upload with Feedback</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onVerifyDocument(selectedApp.id, viewingDoc.id, true);
                    setViewingDoc(null);
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify Document as Approved</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
