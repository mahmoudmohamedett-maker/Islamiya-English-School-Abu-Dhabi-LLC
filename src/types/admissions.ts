/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'PARENT' | 'ADMIN_STAFF' | 'SUPER_ADMIN' | 'REGISTRATION' | 'admin' | 'parent';

export type GradeLevel =
  | 'KG-1'
  | 'KG-2'
  | 'Grade 1'
  | 'Grade 2'
  | 'Grade 3'
  | 'Grade 4'
  | 'Grade 5'
  | 'Grade 6'
  | 'Grade 7'
  | 'Grade 8'
  | 'Grade 9'
  | 'Grade 10'
  | 'Grade 11'
  | 'Grade 12';

export type ApplicationStatus =
  | 'PENDING_DOCS'        // Newly submitted, waiting for admin staff to verify documents
  | 'DOCS_REUPLOAD_REQ'   // Admin requested clearer/new documents
  | 'DOCS_VERIFIED'       // Documents approved, ready for assessment interview
  | 'INTERVIEW_SCHEDULED' // Interview date & time set
  | 'INTERVIEW_PASSED'    // Student completed interview & passed, awaiting super-admin approval
  | 'INTERVIEW_FAILED'    // Student completed interview & failed with mandatory feedback
  | 'WAITING_LIST'        // Super Admin placed on waitlist
  | 'SUPER_ADMIN_APPROVED'// Super Admin gave final approval, account credentials sent, payment pending
  | 'PAYMENT_PENDING'     // 15-day countdown active for tuition checkout
  | 'ENROLLED_ACTIVE'     // Paid, digital invoice + voucher issued, student active
  | 'REJECTED'            // Application rejected
  | 'TERMINATED';         // Account terminated by super admin

export type DocumentType =
  | 'STUDENT_PHOTO'
  | 'EMIRATES_ID'
  | 'PASSPORT'
  | 'BIRTH_CERTIFICATE'
  | 'VACCINATION_CARD'
  | 'PREVIOUS_ACADEMIC_RESULT';

export interface UploadedDoc {
  id: string;
  type: DocumentType;
  title: string;
  mandatory: boolean;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  uploadDate: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'REUPLOAD_REQUESTED';
  verificationNotes?: string;
}

export interface AssessmentInterview {
  date?: string;
  time?: string;
  venue?: string;
  interviewer?: string;
  attended: boolean;
  status?: 'SCHEDULED' | 'PASSED' | 'FAILED';
  feedback?: string; // MANDATORY feedback when marking pass/fail
  psychologicalReadiness?: number; // 1-5
  aptitudeScore?: number; // 1-100
  updatedAt?: string;
  updatedBy?: string;
}

export interface SuperAdminDecision {
  decision: 'APPROVED' | 'WAITING_LIST' | 'REJECTED';
  decisionDate: string;
  approvedBy: string;
  remarks?: string;
}

export type PaymentPlan = 'FULL' | 'TWO_INSTALLMENTS' | 'THREE_INSTALLMENTS';
export type PaymentMethod = 'CARD' | 'GOOGLE_PAY' | 'SAMSUNG_PAY';

export interface PaymentRecord {
  plan: PaymentPlan;
  method: PaymentMethod;
  includeBus: boolean;
  tuitionFee: number;
  booksFee: number;
  uniformFee: number;
  busFee: number;
  totalAnnualFee: number;
  paidAmount: number;
  balanceAmount: number;
  firstInstallment: number;
  secondInstallment: number;
  thirdInstallment: number;
  approvalDate: string;
  paymentDueDate: string; // 15 days from approval
  isPaid: boolean;
  paidDate?: string;
  transactionRef?: string;
  invoiceNumber?: string;
  voucherCode?: string;
}

export type LetterType =
  | 'RECOMMENDATION'
  | 'ENROLLMENT_CERTIFICATE'
  | 'STATEMENT_OF_RESULTS'
  | 'NOC'
  | 'TRANSFER_CERTIFICATE';

export interface LetterRequest {
  id: string;
  userId?: string;
  applicationId: string;
  studentName: string;
  studentId: string;
  grade: GradeLevel;
  letterType: LetterType;
  purpose: string;
  requestDate: string;
  status: 'UNDER_REVIEW' | 'APPROVED' | 'READY_FOR_PICKUP';
  processedDate?: string;
  collectionLocation?: string;
  documentRefNumber?: string;
  adminNotes?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
  role: UserRole;
  status: ApplicationStatus;
}

export interface StudentApplication {
  id: string;
  userId?: string;
  applicationNo: string; // e.g. "IES-2027-0104"
  studentId?: string;    // e.g. "STU-27-0941"
  academicYear: string;  // "2027-2028"
  
  // Student Personal Info
  studentName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE';
  nationality: string;
  emiratesId: string;
  gradeApplying: GradeLevel;
  firstLanguage: string;
  hasSpecialNeeds: boolean;
  specialNeedsDetails?: string;

  // Sibling Priority
  hasSiblingInSchool: boolean;
  siblingId?: string;
  siblingName?: string;
  siblingGrade?: string;

  // Parent/Guardian Info
  fatherName: string;
  fatherPhone: string;
  fatherEmail: string;
  fatherEmiratesId: string;
  motherName: string;
  motherPhone: string;
  motherEmail: string;
  residentialAddress: string;
  city: string; // "Abu Dhabi"

  // Generated Credentials for approved login
  studentUsername?: string;
  studentPasswordTemp?: string;
  isAccountActivated: boolean;

  // Lifecycle
  status: ApplicationStatus;
  submissionDate: string;
  documents: UploadedDoc[];
  interview?: AssessmentInterview;
  superAdminDecision?: SuperAdminDecision;
  payment?: PaymentRecord;
  timeline: TimelineEvent[];
}

export interface GradeFeeInfo {
  grade: GradeLevel;
  firstInstallment: number;
  secondInstallment: number;
  thirdInstallment: number;
  totalTuition: number;
  textBooks: number;
  uniform: number;
  busFee: number;
  totalWithBus: number;
  totalWithoutBus: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  studentId?: string;
  createdAt: string;
}
