/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  StudentApplication,
  LetterRequest,
  GradeLevel,
  PaymentPlan,
  PaymentMethod,
  LetterType,
  DocumentType,
} from '../../types/admissions';
import { OFFICIAL_FEE_SCHEDULE, calculateFeeBreakdown, SCHOOL_INFO } from '../../data/feeSchedule';
import { printInvoice, printVoucher, printLetter } from '../../utils/exportUtils';
import {
  FileText,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  Upload,
  User,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Plus,
  Send,
  Building,
  Lock,
  GraduationCap,
} from 'lucide-react';

const COUNTRIES = [
  'United Arab Emirates',
  'Saudi Arabia',
  'Oman',
  'Kuwait',
  'Bahrain',
  'Qatar',
  'Egypt',
  'Jordan',
  'Syria',
  'Lebanon',
  'Palestine',
  'Iraq',
  'Yemen',
  'Sudan',
  'Morocco',
  'Tunisia',
  'Algeria',
  'India',
  'Pakistan',
  'Bangladesh',
  'Sri Lanka',
  'Philippines',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'South Africa',
  'Other',
];

interface ParentDashboardProps {
  applications: StudentApplication[];
  letters: LetterRequest[];
  selectedAppId: string;
  onSelectAppId: (id: string) => void;
  onSubmitNewApplication: (newApp: Partial<StudentApplication>) => void;
  onReuploadDocument: (appId: string, docId: string, file: File) => void;
  onProcessPayment: (appId: string, plan: PaymentPlan, method: PaymentMethod, includeBus: boolean) => void;
  onRequestLetter: (req: Omit<LetterRequest, 'id' | 'requestDate' | 'status'>) => void;
  activeSubTab?: 'tracker' | 'apply' | 'fees' | 'letters';
  onChangeSubTab?: (tab: 'tracker' | 'apply' | 'fees' | 'letters') => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  applications,
  letters,
  selectedAppId,
  onSelectAppId,
  onSubmitNewApplication,
  onReuploadDocument,
  onProcessPayment,
  onRequestLetter,
  activeSubTab = 'tracker',
  onChangeSubTab,
}) => {
  const currentApp = applications.find((a) => a.id === selectedAppId) || applications[0];

  // Payment Form States
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan>('THREE_INSTALLMENTS');
  const [includeBus, setIncludeBus] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState(false);

  // New Application Wizard Form States
  const [formData, setFormData] = useState({
    studentName: '',
    dob: '2022-05-14',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    nationality: 'United Arab Emirates',
    emiratesId: '784-2022-1234567-1',
    gradeApplying: 'KG-1' as GradeLevel,
    firstLanguage: 'Arabic & English',
    hasSpecialNeeds: false,
    hasSiblingInSchool: false,
    siblingId: '',
    siblingName: '',
    siblingGrade: '',
    fatherName: '',
    fatherPhone: '+971 50 ',
    fatherEmail: '',
    fatherEmiratesId: '784-1985-7654321-1',
    motherName: '',
    motherPhone: '+971 50 ',
    motherEmail: '',
    residentialAddress: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  // Letter Request Form States
  const [letterType, setLetterType] = useState<LetterType>('ENROLLMENT_CERTIFICATE');
  const [letterPurpose, setLetterPurpose] = useState('');
  const [letterSuccessNotice, setLetterSuccessNotice] = useState(false);

  // Calculate fees for current application
  const gradeFees = currentApp ? OFFICIAL_FEE_SCHEDULE[currentApp.gradeApplying] : OFFICIAL_FEE_SCHEDULE['KG-1'];
  const breakdown = currentApp ? calculateFeeBreakdown(currentApp.gradeApplying, includeBus, selectedPlan) : null;

  // Real-time Stage Progress mapping
  const getStageNumber = (status: string): number => {
    switch (status) {
      case 'PENDING_DOCS':
      case 'DOCS_REUPLOAD_REQ':
        return 1;
      case 'DOCS_VERIFIED':
        return 2;
      case 'INTERVIEW_SCHEDULED':
        return 3;
      case 'INTERVIEW_PASSED':
      case 'INTERVIEW_FAILED':
        return 4;
      case 'WAITING_LIST':
      case 'SUPER_ADMIN_APPROVED':
      case 'PAYMENT_PENDING':
        return 5;
      case 'ENROLLED_ACTIVE':
        return 6;
      default:
        return 1;
    }
  };

  const currentStage = currentApp ? getStageNumber(currentApp.status) : 1;
  const isSuperAdminApproved = currentApp && (
    currentApp.status === 'SUPER_ADMIN_APPROVED' ||
    currentApp.status === 'PAYMENT_PENDING' ||
    currentApp.status === 'ENROLLED_ACTIVE'
  );

  // Handle Payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApp) return;
    setIsProcessingPayment(true);
    setTimeout(() => {
      onProcessPayment(currentApp.id, selectedPlan, paymentMethod, includeBus);
      setIsProcessingPayment(false);
      setPaymentSuccessToast(true);
      setTimeout(() => setPaymentSuccessToast(false), 6000);
    }, 1200);
  };

  // Handle Letter Submission
  const handleLetterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApp || !letterPurpose.trim()) return;
    onRequestLetter({
      applicationId: currentApp.id,
      studentName: currentApp.studentName,
      studentId: currentApp.studentId || currentApp.applicationNo,
      grade: currentApp.gradeApplying,
      letterType,
      purpose: letterPurpose,
    });
    setLetterPurpose('');
    setLetterSuccessNotice(true);
    setTimeout(() => setLetterSuccessNotice(false), 5000);
  };

  // Handle New App Submission
  const handleNewAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitNewApplication({
      ...formData,
      status: 'PENDING_DOCS',
    });
    if (onChangeSubTab) onChangeSubTab('tracker');
  };

  return (
    <div className="space-y-6">
      {/* Quick Applicant Selector Strip */}
      {applications.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
              {currentApp?.studentName.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{currentApp?.studentName || 'Select Student'}</span>
                <span className="text-xs text-slate-500 font-mono">({currentApp?.studentId || currentApp?.applicationNo})</span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Grade: {currentApp?.gradeApplying}</span>
                <span>·</span>
                <span>AY 2027-2028</span>
                <span>·</span>
                <span className="font-semibold text-emerald-800 uppercase tracking-wider">{currentApp?.status.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>

          {/* Switch among applicant profiles */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Applicant Record:</label>
            <select
              value={currentApp?.id}
              onChange={(e) => onSelectAppId(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
            >
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.studentName} — {a.gradeApplying} ({a.status.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 15-Day Payment Warning Banner (Only after Super Admin approval) */}
      {(currentApp?.status === 'PAYMENT_PENDING' || currentApp?.status === 'SUPER_ADMIN_APPROVED') && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 shadow-sm text-amber-900 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-200/80 rounded-lg shrink-0 text-amber-900">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-amber-950 uppercase tracking-wide">
                  Action Required: 15-Day Seat Confirmation & Fee Settlement Window
                </h4>
                <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded font-mono font-bold text-xs">
                  Due by: {currentApp.payment?.paymentDueDate || 'Within 15 Days'}
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                Congratulations! <strong>{currentApp.studentName}</strong> has been officially approved for admission in <strong>{currentApp.gradeApplying}</strong> for AY 2027-2028 by the Super Admin.
                As per official ADEK school regulations, you must select your payment plan and complete the enrollment fee within <strong>15 days</strong>.
                If payment is not completed within 15 days, the reserved admission seat will be automatically forfeited and the profile deleted to allocate the seat to the waiting list.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <a
                  href="#payment-section"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Proceed to Fee Settlement</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => onChangeSubTab && onChangeSubTab('tracker')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'tracker'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Live Application Tracker
        </button>
        <button
          type="button"
          onClick={() => onChangeSubTab && onChangeSubTab('fees')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'fees'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Fee Schedule & Plans
        </button>
        <button
          type="button"
          onClick={() => onChangeSubTab && onChangeSubTab('letters')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'letters'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Student Letters & Certificates
        </button>
        <button
          type="button"
          onClick={() => onChangeSubTab && onChangeSubTab('apply')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'apply'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          + Submit New Child Application
        </button>
      </div>

      {/* EMPTY STATE WHEN NO APPLICATION EXISTS */}
      {activeSubTab === 'tracker' && !currentApp && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No Application Registered · لم يتم تقديم طلب بعد
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            You do not have an active student application submitted for Academic Year 2027-2028. Click the button below to start your child's registration and upload the required ADEK documents.
          </p>
          <button
            type="button"
            onClick={() => onChangeSubTab && onChangeSubTab('apply')}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            + Begin Student Registration (AY 2027-2028)
          </button>
        </div>
      )}

      {/* TAB 1: LIVE APPLICATION TRACKER */}
      {activeSubTab === 'tracker' && currentApp && (
        <div className="space-y-6">
          {/* Visual Progress Bar (6 Steps) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-6">
              Application Progress Tracker · AY 2027-2028
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 relative">
              {[
                { step: 1, title: '1. Submitted', desc: 'Online Profile & Docs' },
                { step: 2, title: '2. Document Review', desc: 'ADEK Compliance' },
                { step: 3, title: '3. Assessment', desc: 'Interview Appointment' },
                { step: 4, title: '4. Evaluation', desc: 'Readiness Assessment' },
                { step: 5, title: '5. Executive Decision', desc: 'Approval / Waitlist' },
                { step: 6, title: '6. Enrollment & Active', desc: 'Payment & Vouchers' },
              ].map((s) => {
                const isCompleted = currentStage > s.step || (s.step === 6 && currentApp.status === 'ENROLLED_ACTIVE');
                const isCurrent = currentStage === s.step && currentApp.status !== 'ENROLLED_ACTIVE';
                return (
                  <div
                    key={s.step}
                    className={`p-3 rounded-lg border transition-all ${
                      isCompleted
                        ? 'border-emerald-300 bg-emerald-50/60 text-emerald-950'
                        : isCurrent
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20 text-emerald-900 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono">STEP 0{s.step}</span>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      ) : isCurrent ? (
                        <Clock className="w-4 h-4 text-emerald-700 animate-spin" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{s.title}</div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{s.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Current Stage Detailed Callout */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500">Current Application Status:</span>
                <div className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>
                    {currentApp.status === 'PENDING_DOCS' && 'Pending Initial Document Verification by Staff'}
                    {currentApp.status === 'DOCS_REUPLOAD_REQ' && 'Action Needed: Additional / Clearer Documents Requested'}
                    {currentApp.status === 'DOCS_VERIFIED' && 'Documents Verified · Ready for Assessment Interview Scheduling'}
                    {currentApp.status === 'INTERVIEW_SCHEDULED' && 'Assessment Interview Scheduled · Review Appointment Details Below'}
                    {currentApp.status === 'INTERVIEW_PASSED' && 'Assessment Completed: PASSED · Awaiting Super Admin Final Review'}
                    {currentApp.status === 'INTERVIEW_FAILED' && 'Assessment Completed: Not Passed Benchmarks'}
                    {currentApp.status === 'WAITING_LIST' && 'Official ADEK Waiting List Allocated · Quota Cap Reached'}
                    {currentApp.status === 'PAYMENT_PENDING' && 'Approved by Super Admin · 15-Day Payment Window Active'}
                    {currentApp.status === 'SUPER_ADMIN_APPROVED' && 'Approved by Super Admin · Credentials Issued · Settle Fees'}
                    {currentApp.status === 'ENROLLED_ACTIVE' && 'Officially Enrolled & Active Student (AY 2027-2028)'}
                    {currentApp.status === 'REJECTED' && 'Application Not Approved'}
                  </span>
                </div>
              </div>

              {currentApp.status === 'ENROLLED_ACTIVE' && currentApp.payment && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printInvoice(currentApp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Tax Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => printVoucher(currentApp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Uniform & Books Voucher</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interview Details Card - Evaluator Name and Feedback Removed for Parent Privacy */}
          {currentApp.interview && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-800" />
                  <h4 className="font-bold text-slate-900 text-sm">Assessment Interview Details</h4>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded font-mono ${
                  currentApp.interview.status === 'PASSED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentApp.interview.status === 'FAILED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {currentApp.interview.status || 'SCHEDULED'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 block">Date & Time:</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {currentApp.interview.date} at {currentApp.interview.time}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 block">Venue / Room:</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {currentApp.interview.venue}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 block">Attendance Status:</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {currentApp.interview.attended ? 'Attended & Completed' : 'Pending Attendance'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ADEK Document Vault - ALL 6 MANDATORY */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">ADEK Document Vault & Verification Status</h4>
                <p className="text-xs text-slate-500">All 6 documents are mandatory per ADEK and school admissions requirements.</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {currentApp.documents.filter((d) => d.status === 'VERIFIED').length} of {currentApp.documents.length} Verified
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {currentApp.documents.map((doc) => (
                <div key={doc.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{doc.title}</span>
                        <span className="text-[10px] text-rose-800 font-bold bg-rose-50 border border-rose-200 px-1.5 rounded">
                          MANDATORY
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {doc.fileName} · {doc.fileSize} · Uploaded on {doc.uploadDate}
                      </div>
                      {doc.verificationNotes && (
                        <div className="text-amber-800 text-[11px] mt-1 bg-amber-50/70 p-1.5 rounded border border-amber-200">
                          <strong>Staff Note:</strong> {doc.verificationNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium font-mono ${
                      doc.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.status === 'REUPLOAD_REQUESTED'
                        ? 'bg-rose-100 text-rose-800 font-bold'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.status.replace(/_/g, ' ')}
                    </span>

                    {doc.status === 'REUPLOAD_REQUESTED' && (
                      <label className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold cursor-pointer shadow-2xs">
                        <Upload className="w-3 h-3" />
                        <span>Re-upload Document</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              onReuploadDocument(currentApp.id, doc.id, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Payment Checkout - ONLY DISPLAYED AFTER SUPER-ADMIN APPROVAL */}
          <div id="payment-section">
            {!isSuperAdminApproved ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs flex items-center gap-4">
                <div className="p-3 bg-slate-100 text-slate-500 rounded-xl shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Tuition & Fees Settlement Portal (AY 2027-2028)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Tuition and fee settlement will become active and available only <strong>after your application receives official approval from the Super Admin</strong>.
                    Once approved, you will receive your student portal credentials and a 15-day window to complete the fee payment plan.
                  </p>
                </div>
              </div>
            ) : currentApp.status === 'ENROLLED_ACTIVE' ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                      <span>Tuition Settled & Officially Enrolled</span>
                    </div>
                    <p className="text-xs text-emerald-900 mt-1">
                      Invoice: <strong>{currentApp.payment?.invoiceNumber}</strong> · Books & Uniform Voucher: <strong>{currentApp.payment?.voucherCode}</strong>
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      A copy of this digital invoice has been automatically dispatched to the school <strong>Accounts Department</strong> and the <strong>Registration Team</strong>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => printInvoice(currentApp)}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View / Print Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => printVoucher(currentApp)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Collection Voucher</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h4 className="font-bold text-slate-900 text-base">
                    Tuition & Fees Settlement Portal (AY 2027-2028)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select payment schedule and complete enrollment for <strong>{currentApp.studentName}</strong> ({currentApp.gradeApplying}).
                  </p>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  {/* 1. Payment Plan Selection (Full, 2 installments, 3 installments) - 'Recommended' tag removed */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      1. Select Payment Plan (School operates 3 academic terms)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        {
                          plan: 'FULL' as PaymentPlan,
                          title: '1. Full Annual Payment',
                          desc: 'Pay full tuition + supplies in 1 settlement',
                        },
                        {
                          plan: 'TWO_INSTALLMENTS' as PaymentPlan,
                          title: '2. Two (2) Installments',
                          desc: '50% split per semester',
                        },
                        {
                          plan: 'THREE_INSTALLMENTS' as PaymentPlan,
                          title: '3. Three (3) Termly Installments',
                          desc: 'Term 1, Term 2 & Term 3 schedule',
                        },
                      ].map((p) => (
                        <label
                          key={p.plan}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedPlan === p.plan
                              ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <input
                              type="radio"
                              name="paymentPlan"
                              checked={selectedPlan === p.plan}
                              onChange={() => setSelectedPlan(p.plan)}
                              className="text-emerald-800 focus:ring-emerald-700 mt-0.5"
                            />
                          </div>
                          <div className="font-bold text-slate-900 text-xs mt-2">{p.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 2. Optional Bus Transportation Checkbox */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeBus}
                          onChange={(e) => setIncludeBus(e.target.checked)}
                          className="rounded text-emerald-800 focus:ring-emerald-700"
                        />
                        <span>Include School Bus Transportation Service (Optional)</span>
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5 ml-5">
                        Two-way air-conditioned bus transit covering Abu Dhabi routes.
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900 shrink-0">
                      +AED {SCHOOL_INFO.fixedBusFee.toLocaleString()}.00 / year
                    </span>
                  </div>

                  {/* 3. Fee Breakdown */}
                  {breakdown && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <div className="bg-slate-100/70 px-4 py-2.5 font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                        <span>Itemized ADEK Fee Schedule ({currentApp.gradeApplying})</span>
                        <span className="font-mono">Total Annual: AED {breakdown.total.toLocaleString()}.00</span>
                      </div>
                      <div className="p-4 space-y-2 bg-white">
                        <div className="flex justify-between text-slate-600">
                          <span>Total Tuition Fee:</span>
                          <span className="font-mono font-medium">AED {gradeFees.totalTuition.toLocaleString()}.00</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Approved Text Books Package:</span>
                          <span className="font-mono font-medium">AED {gradeFees.textBooks.toLocaleString()}.00</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Uniform Set (Voucher included):</span>
                          <span className="font-mono font-medium">AED {gradeFees.uniform.toLocaleString()}.00</span>
                        </div>
                        {includeBus && (
                          <div className="flex justify-between text-slate-600">
                            <span>Bus Transportation Fee:</span>
                            <span className="font-mono font-medium">AED {SCHOOL_INFO.fixedBusFee.toLocaleString()}.00</span>
                          </div>
                        )}

                        <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">DUE TODAY FOR ENROLLMENT ACTIVATION:</span>
                            <span className="text-[11px] text-slate-500">{breakdown.description}</span>
                          </div>
                          <span className="text-xl font-bold font-mono text-emerald-800">
                            AED {breakdown.dueNow.toLocaleString()}.00
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Payment Methods */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      3. Select Payment Method
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { id: 'CARD' as PaymentMethod, name: 'Online Debit / Credit Card', icon: '💳' },
                        { id: 'GOOGLE_PAY' as PaymentMethod, name: 'Google Pay', icon: '🟢' },
                        { id: 'SAMSUNG_PAY' as PaymentMethod, name: 'Samsung Pay', icon: '🔵' },
                      ].map((m) => (
                        <label
                          key={m.id}
                          className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                            paymentMethod === m.id
                              ? 'border-emerald-600 bg-emerald-50/50'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payMethod"
                            checked={paymentMethod === m.id}
                            onChange={() => setPaymentMethod(m.id)}
                            className="text-emerald-800 focus:ring-emerald-700"
                          />
                          <span className="text-base">{m.icon}</span>
                          <span className="text-xs font-medium text-slate-900">{m.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Submit Payment Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 max-w-sm">
                      Protected by 256-bit encryption. An instant tax invoice and bookstore collection voucher will be delivered upon authorization.
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Authorizing Payment Gateway...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Confirm & Settle AED {breakdown?.dueNow.toLocaleString()}.00</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FEE SCHEDULE & PLANS INFO */}
      {activeSubTab === 'fees' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Official ADEK Approved Fee Schedule (AY 2027-2028)
            </h3>
            <p className="text-xs text-slate-500">
              All tuition, textbooks, uniform, and bus transportation fees per official school notification.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Grade Level</th>
                  <th className="py-2.5 px-3 text-right">1st Installment</th>
                  <th className="py-2.5 px-3 text-right">2nd Installment</th>
                  <th className="py-2.5 px-3 text-right">3rd Installment</th>
                  <th className="py-2.5 px-3 text-right">Total Tuition</th>
                  <th className="py-2.5 px-3 text-right">Text Books</th>
                  <th className="py-2.5 px-3 text-right">Uniform</th>
                  <th className="py-2.5 px-3 text-right">Bus Fee</th>
                  <th className="py-2.5 px-3 text-right bg-emerald-50 text-emerald-950">Total Fees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.values(OFFICIAL_FEE_SCHEDULE).map((item) => (
                  <tr key={item.grade} className="hover:bg-slate-50/80 transition-colors font-mono">
                    <td className="py-2 px-3 font-sans font-bold text-slate-900">{item.grade}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{item.firstInstallment.toLocaleString()}.00</td>
                    <td className="py-2 px-3 text-right text-slate-600">{item.secondInstallment.toLocaleString()}.00</td>
                    <td className="py-2 px-3 text-right text-slate-600">{item.thirdInstallment.toLocaleString()}.00</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{item.totalTuition.toLocaleString()}.00</td>
                    <td className="py-2 px-3 text-right text-slate-600">{item.textBooks.toLocaleString()}.00</td>
                    <td className="py-2 px-3 text-right text-slate-600">{item.uniform.toLocaleString()}.00</td>
                    <td className="py-2 px-3 text-right text-slate-600">{item.busFee.toLocaleString()}.00</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-800 bg-emerald-50/50">
                      {item.totalWithBus.toLocaleString()}.00
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT LETTERS & CERTIFICATES */}
      {activeSubTab === 'letters' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Official Student Letters & Attestation Requests
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Request verified certificates, recommendation letters, or statement of results for <strong>{currentApp?.studentName}</strong>.
              </p>
            </div>

            {letterSuccessNotice && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Your request has been submitted to the Registration Department. Status is currently <strong>Under Review</strong>.</span>
              </div>
            )}

            <form onSubmit={handleLetterSubmit} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Letter / Certificate Type
                </label>
                <select
                  value={letterType}
                  onChange={(e) => setLetterType(e.target.value as LetterType)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                >
                  <option value="ENROLLMENT_CERTIFICATE">Certificate of Continuation / Enrollment (To Whom It May Concern)</option>
                  <option value="RECOMMENDATION">Letter of Recommendation (Principal / Academic Commendation)</option>
                  <option value="STATEMENT_OF_RESULTS">Official Statement of Academic Results / Transcript</option>
                  <option value="NOC">No Objection Certificate (NOC - Visa / Travel / Sports)</option>
                  <option value="TRANSFER_CERTIFICATE">Transfer Certificate (TC - Inter-school)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purpose of Request / Destination Authority
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. For Golden Visa renewal submission to Abu Dhabi ICP, or British Council Olympiad application..."
                  value={letterPurpose}
                  onChange={(e) => setLetterPurpose(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Letter Request to Registration</span>
              </button>
            </form>
          </div>

          {/* Letter Requests List */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-900 mb-4">
              Your Submitted Letter Requests & Collection Status
            </h4>

            {letters.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">
                No active letter requests submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {letters.map((req) => (
                  <div key={req.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{req.letterType.replace(/_/g, ' ')}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          req.status === 'READY_FOR_PICKUP'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status === 'READY_FOR_PICKUP' ? 'READY FOR PICKUP' : req.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mt-1">
                        <strong>Purpose:</strong> {req.purpose}
                      </p>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Requested: {req.requestDate} · Student: {req.studentName} ({req.grade})
                      </div>
                      {req.collectionLocation && (
                        <div className="text-emerald-900 bg-emerald-50 border border-emerald-200 p-2 rounded mt-1.5 text-xs">
                          <strong>Collection Instructions:</strong> {req.collectionLocation}
                          {req.adminNotes && ` · ${req.adminNotes}`}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => printLetter(req, currentApp)}
                        className="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Print Attested Copy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: NEW APPLICATION ONBOARDING FORM WITH ALL 6 MANDATORY DOCS AND COUNTRY SELECT */}
      {activeSubTab === 'apply' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-base font-bold text-slate-900">
              New Student Admission Onboarding (AY 2027-2028)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Please enter student credentials and upload all 6 mandatory documents adhering to ADEK circular standards.
            </p>
          </div>

          <form onSubmit={handleNewAppSubmit} className="space-y-6">
            {/* Step 1: Student Information */}
            <div>
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-700" />
                <span>1. Student Identity & Placement</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name (as per Passport)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sultan Ahmed Al Nuaimi"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grade Level Applying For</label>
                  <select
                    value={formData.gradeApplying}
                    onChange={(e) => setFormData({ ...formData, gradeApplying: e.target.value as GradeLevel })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700 bg-white"
                  >
                    {Object.keys(OFFICIAL_FEE_SCHEDULE).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Emirates ID Number</label>
                  <input
                    type="text"
                    required
                    placeholder="784-YYYY-XXXXXXX-Z"
                    value={formData.emiratesId}
                    onChange={(e) => setFormData({ ...formData, emiratesId: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700 bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                {/* Country Selection Dropdown for Nationality (Requirement 4) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nationality (Select Country)</label>
                  <select
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700 bg-white"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sibling Priority Checkbox */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <label className="flex items-center gap-2 font-semibold text-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasSiblingInSchool}
                  onChange={(e) => setFormData({ ...formData, hasSiblingInSchool: e.target.checked })}
                  className="rounded text-emerald-800"
                />
                <span>Candidate has a sibling currently enrolled at Islamiya English School (Priority Admission)</span>
              </label>

              {formData.hasSiblingInSchool && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Sibling Student ID (e.g. IES-24-0312)"
                    value={formData.siblingId}
                    onChange={(e) => setFormData({ ...formData, siblingId: e.target.value })}
                    className="p-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Sibling Full Name"
                    value={formData.siblingName}
                    onChange={(e) => setFormData({ ...formData, siblingName: e.target.value })}
                    className="p-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Sibling Grade"
                    value={formData.siblingGrade}
                    onChange={(e) => setFormData({ ...formData, siblingGrade: e.target.value })}
                    className="p-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              )}
            </div>

            {/* Step 2: Parent / Guardian Details */}
            <div>
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-700" />
                <span>2. Parent / Guardian Contact Details</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Father's Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmed Sultan Al Nuaimi"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Father's Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.fatherPhone}
                    onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Father's Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.ae"
                    value={formData.fatherEmail}
                    onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mother's Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Mother's name"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mother's Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.motherPhone}
                    onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Residential Address (Abu Dhabi)</label>
                  <input
                    type="text"
                    required
                    placeholder="Sector, Street, Villa / Building No."
                    value={formData.residentialAddress}
                    onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: ALL 6 DOCUMENTS ARE MANDATORY (Requirement 3) */}
            <div>
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>3. Upload Mandatory Documents (All 6 Documents Required by ADEK Rules)</span>
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                All 6 documents are mandatory. Upload soft copies in JPEG or PDF format, not exceeding 1 MB each.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  { id: 'STUDENT_PHOTO', title: '1. Recent Photograph of the Student' },
                  { id: 'EMIRATES_ID', title: '2. Copy of Emirates ID of the Student' },
                  { id: 'PASSPORT', title: '3. Copy of Passport' },
                  { id: 'BIRTH_CERTIFICATE', title: '4. Copy of Birth Certificate' },
                  { id: 'VACCINATION_CARD', title: '5. Copy of Vaccination Card' },
                  { id: 'PREVIOUS_ACADEMIC_RESULT', title: '6. Copy of Previous Academic Result' },
                ].map((item) => (
                  <div key={item.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{item.title}</span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 rounded">
                          MANDATORY
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {uploadedFiles[item.id] ? uploadedFiles[item.id].name : 'No file selected (Required)'}
                      </span>
                    </div>

                    <label className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer font-medium text-[11px] flex items-center gap-1">
                      <Upload className="w-3 h-3 text-slate-500" />
                      <span>Browse</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadedFiles({ ...uploadedFiles, [item.id]: e.target.files[0] });
                          }
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>Submit Application to Admissions Review</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
