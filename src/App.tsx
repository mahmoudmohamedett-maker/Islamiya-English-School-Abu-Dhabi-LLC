/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  StudentApplication,
  LetterRequest,
  UserRole,
  PaymentPlan,
  PaymentMethod,
  AssessmentInterview,
  GradeLevel,
  UserProfile,
} from './types/admissions';
import {
  loadApplications,
  saveApplications,
  loadLetters,
  saveLetters,
} from './data/mockApplications';
import { OFFICIAL_FEE_SCHEDULE, calculateFeeBreakdown, SCHOOL_INFO } from './data/feeSchedule';
import { Navbar } from './components/Navbar';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { StaffAdmissions } from './components/admin/StaffAdmissions';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { RegistrationDatabase } from './components/admin/RegistrationDatabase';
import { AnalyticsDashboard } from './components/admin/AnalyticsDashboard';
import { AuthPage } from './components/auth/AuthPage';
import { Mail, X } from 'lucide-react';
import {
  testConnection,
  subscribeToApplications,
  subscribeToLetterRequests,
  saveApplicationToFirestore,
  deleteApplicationFromFirestore,
  saveLetterRequestToFirestore,
  syncCurrentUserProfile,
  logOut,
  auth,
  SUPER_ADMIN_EMAIL,
  isAdminRole,
} from './services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('PARENT');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('tracker');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Simulated Email & System Alert Banner
  const [systemAlert, setSystemAlert] = useState<{
    id: string;
    title: string;
    recipient: string;
    copies?: string[];
    message: string;
    type: 'EMAIL' | 'SYSTEM';
  } | null>(null);

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Strictly sync with Firebase Auth and Firestore UserProfile
  useEffect(() => {
    testConnection().catch(console.warn);

    let unsubApps: () => void = () => {};
    let unsubLetters: () => void = () => {};

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      unsubApps();
      unsubLetters();

      if (user) {
        try {
          // Strictly load/synchronize the verified UserProfile from Firestore
          const profile = await syncCurrentUserProfile(user);
          setUserProfile(profile);
          setCurrentRole(profile.role);
          setIsAuthenticated(true);

          // Route immediately to authorized default tab
          if (isAdminRole(profile.role)) {
            setActiveTab('super-approvals');
          } else if (profile.role === 'ADMIN_STAFF') {
            setActiveTab('staff-review');
          } else if (profile.role === 'REGISTRATION') {
            setActiveTab('reg-database');
          } else {
            setActiveTab('tracker');
          }

          // Real-time Firestore sync strictly filtered for verified role
          unsubApps = subscribeToApplications(profile.role, (firestoreApps) => {
            setApplications(firestoreApps || []);
            if (firestoreApps && firestoreApps.length > 0) {
              setSelectedAppId((prev) => (prev ? prev : firestoreApps[0].id));
            }
          });

          unsubLetters = subscribeToLetterRequests(profile.role, (firestoreLetters) => {
            setLetters(firestoreLetters || []);
          });
        } catch (err) {
          console.error('Error synchronizing user profile with Firestore:', err);
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        setUserProfile(null);
        setCurrentRole('PARENT');
        setIsAuthenticated(false);
        setApplications([]);
        setLetters([]);
        setIsAuthLoading(false);
      }
    });

    return () => {
      unsubApps();
      unsubLetters();
      unsubAuth();
    };
  }, []);

  // Helper to persist application mutations to Firestore (and local backup)
  const updateApps = (updatedList: StudentApplication[], singleToSync?: StudentApplication) => {
    setApplications(updatedList);
    saveApplications(updatedList);
    if (auth.currentUser) {
      if (singleToSync) {
        saveApplicationToFirestore(singleToSync).catch(console.warn);
      } else {
        updatedList.forEach((a) => saveApplicationToFirestore(a).catch(console.warn));
      }
    }
  };

  const updateLetters = (updatedList: LetterRequest[], singleToSync?: LetterRequest) => {
    setLetters(updatedList);
    saveLetters(updatedList);
    if (auth.currentUser) {
      if (singleToSync) {
        saveLetterRequestToFirestore(singleToSync).catch(console.warn);
      } else {
        updatedList.forEach((l) => saveLetterRequestToFirestore(l).catch(console.warn));
      }
    }
  };

  const triggerAlert = (
    title: string,
    recipient: string,
    message: string,
    copies?: string[]
  ) => {
    setSystemAlert({
      id: Date.now().toString(),
      title,
      recipient,
      copies,
      message,
      type: 'EMAIL',
    });
    setTimeout(() => {
      setSystemAlert((prev) => (prev?.title === title ? null : prev));
    }, 9000);
  };

  const handleSignOut = async () => {
    await logOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    setFirebaseUser(null);
    setApplications([]);
    setLetters([]);
    setCurrentRole('PARENT');
    setActiveTab('tracker');
  };

  // 1. Parent Submits New Application (Saved directly to Firestore)
  const handleSubmitNewApplication = (newAppPayload: Partial<StudentApplication>) => {
    const count = applications.length + 1;
    const appNo = `IES-2027-${String(count).padStart(4, '0')}`;
    const grade = (newAppPayload.gradeApplying || 'KG-1') as GradeLevel;

    const newApp: StudentApplication = {
      id: `app-${Date.now()}`,
      userId: firebaseUser?.uid,
      applicationNo: appNo,
      academicYear: '2027-2028',
      studentName: newAppPayload.studentName || 'Student Name',
      dob: newAppPayload.dob || '2022-01-01',
      gender: newAppPayload.gender || 'MALE',
      nationality: newAppPayload.nationality || 'United Arab Emirates',
      emiratesId: newAppPayload.emiratesId || '784-2022-0000000-1',
      gradeApplying: grade,
      firstLanguage: newAppPayload.firstLanguage || 'Arabic & English',
      hasSpecialNeeds: false,
      hasSiblingInSchool: newAppPayload.hasSiblingInSchool || false,
      siblingId: newAppPayload.siblingId,
      siblingName: newAppPayload.siblingName,
      siblingGrade: newAppPayload.siblingGrade,
      fatherName: newAppPayload.fatherName || 'Parent Name',
      fatherPhone: newAppPayload.fatherPhone || '+971 50 000 0000',
      fatherEmail: newAppPayload.fatherEmail || firebaseUser?.email || 'parent@domain.ae',
      fatherEmiratesId: newAppPayload.fatherEmiratesId || '784-1985-0000000-1',
      motherName: newAppPayload.motherName || 'Mother Name',
      motherPhone: newAppPayload.motherPhone || '+971 50 000 0000',
      motherEmail: newAppPayload.motherEmail || '',
      residentialAddress: newAppPayload.residentialAddress || 'Abu Dhabi, UAE',
      city: 'Abu Dhabi',
      isAccountActivated: false,
      status: 'PENDING_DOCS',
      submissionDate: new Date().toISOString().slice(0, 10),
      documents: [
        {
          id: `doc-${Date.now()}-1`,
          type: 'STUDENT_PHOTO',
          title: 'Recent photograph of student',
          mandatory: true,
          fileName: 'student_photo.jpg',
          fileSize: '420 KB',
          uploadDate: new Date().toISOString().slice(0, 10),
          status: 'PENDING',
        },
        {
          id: `doc-${Date.now()}-2`,
          type: 'EMIRATES_ID',
          title: 'Copy of Emirates ID of the student',
          mandatory: true,
          fileName: 'emirates_id_scan.pdf',
          fileSize: '780 KB',
          uploadDate: new Date().toISOString().slice(0, 10),
          status: 'PENDING',
        },
      ],
      timeline: [
        {
          id: `t-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          title: 'Application Submitted',
          description: 'Parent submitted registration and uploaded mandatory ADEK documents.',
          actor: newAppPayload.fatherName || 'Parent',
          role: 'PARENT',
          status: 'PENDING_DOCS',
        },
      ],
    };

    const updated = [newApp, ...applications];
    updateApps(updated, newApp);
    setSelectedAppId(newApp.id);
    setActiveTab('tracker');

    triggerAlert(
      'Application Received (AY 2027-2028)',
      newApp.fatherEmail,
      `Your application ${appNo} for ${newApp.studentName} (${grade}) has been received and stored in Firestore.`
    );
  };

  // 2. Admin Staff: Verify Single Document
  const handleVerifyDocument = (appId: string, docId: string, verified: boolean) => {
    const updated = applications.map((app) => {
      if (app.id !== appId) return app;
      const updatedDocs = app.documents.map((d) =>
        d.id === docId ? { ...d, status: (verified ? 'VERIFIED' : 'REJECTED') as any } : d
      );
      return { ...app, documents: updatedDocs };
    });
    updateApps(updated, updated.find((a) => a.id === appId));
  };

  // 3. Admin Staff: Verify All Documents & Qualify for Interview
  const handleVerifyAllDocuments = (appId: string) => {
    const updated = applications.map((app) => {
      if (app.id !== appId) return app;
      return {
        ...app,
        status: 'DOCS_VERIFIED' as const,
        documents: app.documents.map((d) => ({ ...d, status: 'VERIFIED' as const })),
        timeline: [
          ...app.timeline,
          {
            id: `t-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            title: 'Documents Verified',
            description: 'All mandatory ADEK files certified by Admissions Staff.',
            actor: 'Admissions Staff',
            role: 'ADMIN_STAFF' as const,
            status: 'DOCS_VERIFIED' as const,
          },
        ],
      };
    });
    updateApps(updated, updated.find((a) => a.id === appId));

    const app = applications.find((a) => a.id === appId);
    if (app) {
      triggerAlert(
        'Documents Verified · Ready for Assessment Interview',
        app.fatherEmail,
        `All submitted documents for ${app.studentName} have been verified. Our staff will schedule the assessment interview shortly.`
      );
    }
  };

  // 4. Admin Staff: Request Document Re-upload
  const handleRequestReupload = (appId: string, docId: string, notes: string) => {
    const updated = applications.map((app) => {
      if (app.id !== appId) return app;
      return {
        ...app,
        status: 'DOCS_REUPLOAD_REQ' as const,
        documents: app.documents.map((d) =>
          d.id === docId ? { ...d, status: 'REUPLOAD_REQUESTED' as const, verificationNotes: notes } : d
        ),
        timeline: [
          ...app.timeline,
          {
            id: `t-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            title: 'Additional Documentation Requested',
            description: notes,
            actor: 'Admissions Staff',
            role: 'ADMIN_STAFF' as const,
            status: 'DOCS_REUPLOAD_REQ' as const,
          },
        ],
      };
    });
    updateApps(updated, updated.find((a) => a.id === appId));

    const app = applications.find((a) => a.id === appId);
    if (app) {
      triggerAlert(
        'Action Required: Document Re-Upload Requested',
        app.fatherEmail,
        `Admissions staff reviewed your files and requested an updated copy: "${notes}". Please log in to your portal to re-upload.`
      );
    }
  };

  // Parent Re-uploads Document
  const handleReuploadDocument = (appId: string, docId: string, file: File) => {
    const updated = applications.map((app) => {
      if (app.id !== appId) return app;
      return {
        ...app,
        status: 'PENDING_DOCS' as const,
        documents: app.documents.map((d) =>
          d.id === docId
            ? {
                ...d,
                fileName: file.name,
                fileSize: `${Math.round(file.size / 1024)} KB`,
                uploadDate: new Date().toISOString().slice(0, 10),
                status: 'PENDING' as const,
                verificationNotes: undefined,
              }
            : d
        ),
      };
    });
    updateApps(updated, updated.find((a) => a.id === appId));

    triggerAlert(
      'Document Re-uploaded by Parent',
      'admissions@islamiya.ae',
      `Parent re-uploaded file for review on application ${appId}.`
    );
  };

  // 5. Admin Staff: Schedule Interview Appointment
  const handleScheduleInterview = (appId: string, interview: AssessmentInterview) => {
    const updated = applications.map((app) => {
      if (app.id !== appId) return app;
      return {
        ...app,
        status: 'INTERVIEW_SCHEDULED' as const,
        interview,
        timeline: [
          ...app.timeline,
          {
            id: `t-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            title: 'Interview Appointment Scheduled',
            description: `Booked for ${interview.date} at ${interview.time} (${interview.venue}) with ${interview.interviewer}.`,
            actor: 'Admissions Staff',
            role: 'ADMIN_STAFF' as const,
            status: 'INTERVIEW_SCHEDULED' as const,
          },
        ],
      };
    });
    updateApps(updated, updated.find((a) => a.id === appId));

    const app = applications.find((a) => a.id === appId);
    if (app) {
      triggerAlert(
        'Assessment Interview Appointment Confirmed',
        app.fatherEmail,
        `Assessment appointment confirmed for ${app.studentName} on ${interview.date} at ${interview.time}. Venue: ${interview.venue}. Interviewer: ${interview.interviewer}.`
      );
    }
  };

  // 6. Admin Staff: Complete Evaluation (Pass/Fail with mandatory feedback)
  const handleCompleteEvaluation = (
    appId: string,
    result: 'PASSED' | 'FAILED',
    feedback: string,
    score: number
  ) => {
    const updated = applications.map((app) => {
      if (app.id !== appId) return app;
      const currentInt = app.interview || { attended: true };
      const newInt: AssessmentInterview = {
        ...currentInt,
        attended: true,
        status: result,
        feedback,
        aptitudeScore: score,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admissions Assessment Committee',
      };
      const newStatus = result === 'PASSED' ? ('INTERVIEW_PASSED' as const) : ('INTERVIEW_FAILED' as const);

      return {
        ...app,
        status: newStatus,
        interview: newInt,
        timeline: [
          ...app.timeline,
          {
            id: `t-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            title: `Assessment Evaluation: ${result}`,
            description: `Score: ${score}%. Evaluator Feedback: "${feedback}"`,
            actor: 'Assessment Committee',
            role: 'ADMIN_STAFF' as const,
            status: newStatus,
          },
        ],
      };
    });
    updateApps(updated, updated.find((a) => a.id === appId));

    const app = applications.find((a) => a.id === appId);
    if (app) {
      if (result === 'PASSED') {
        triggerAlert(
          'Assessment Interview Result: PASSED',
          app.fatherEmail,
          `Congratulations! ${app.studentName} has passed the placement assessment with ${score}%. File has been referred to the Principal / Super Admin for final seat allocation.`
        );
      } else {
        triggerAlert(
          'Assessment Evaluation Notice',
          app.fatherEmail,
          `Assessment evaluation completed for ${app.studentName}. Mandatory Evaluator Feedback: "${feedback}".`
        );
      }
    }
  };

  // 7. Super Admin: Final Approval (Issues credentials + 15-day payment countdown)
  const handleApproveApplication = (appId: string, remarks?: string) => {
    if (currentRole !== 'SUPER_ADMIN') {
      alert('Access Denied: Only Super Admin can approve applications.');
      return;
    }
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 15);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    const updated = applications.map((app) => {
      if (app.id !== appId) return app;
      const username = `${app.studentName.toLowerCase().replace(/\s+/g, '.').slice(0, 14)}.ies`;
      const tempPassword = `IES2027@${Math.floor(1000 + Math.random() * 9000)}`;
      const gradeFees = OFFICIAL_FEE_SCHEDULE[app.gradeApplying];

      return {
        ...app,
        status: 'SUPER_ADMIN_APPROVED' as const,
        studentUsername: username,
        studentPasswordTemp: tempPassword,
        isAccountActivated: true,
        superAdminDecision: {
          decision: 'APPROVED' as const,
          decisionDate: today.toISOString().slice(0, 10),
          approvedBy: 'Dr. D. A. Nazar (Principal)',
          remarks: remarks || 'Approved for admission.',
        },
        payment: {
          plan: 'THREE_INSTALLMENTS' as const,
          method: 'CARD' as const,
          includeBus: true,
          tuitionFee: gradeFees.totalTuition,
          booksFee: gradeFees.textBooks,
          uniformFee: gradeFees.uniform,
          busFee: gradeFees.busFee,
          totalAnnualFee: gradeFees.totalWithBus,
          paidAmount: 0,
          balanceAmount: gradeFees.totalWithBus,
          firstInstallment: gradeFees.firstInstallment + gradeFees.textBooks + gradeFees.uniform + Math.round(gradeFees.busFee / 3),
          secondInstallment: gradeFees.secondInstallment + Math.round(gradeFees.busFee / 3),
          thirdInstallment: gradeFees.thirdInstallment + Math.round(gradeFees.busFee / 3),
          approvalDate: today.toISOString().slice(0, 10),
          paymentDueDate: dueDateStr,
          isPaid: false,
        },
        timeline: [
          ...app.timeline,
          {
            id: `t-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            title: 'Super Admin Final Approval & Credentials Issued',
            description: `Principal granted seat admission. Student login credentials generated. 15-day fee deadline set for ${dueDateStr}.`,
            actor: 'Dr. D. A. Nazar (Principal)',
            role: 'SUPER_ADMIN' as const,
            status: 'SUPER_ADMIN_APPROVED' as const,
          },
        ],
      };
    });
    updateApps(updated, updated.find((a) => a.id === appId));

    const app = applications.find((a) => a.id === appId);
    if (app) {
      const username = `${app.studentName.toLowerCase().replace(/\s+/g, '.').slice(0, 14)}.ies`;
      triggerAlert(
        'FINAL ADMISSION APPROVAL & SYSTEM CREDENTIALS (AY 2027-2028)',
        app.fatherEmail,
        `Congratulations! Final admission for ${app.studentName} in ${app.gradeApplying} is APPROVED. Your portal login credentials: Username: ${username} | Password: [Dispatched]. CRITICAL: Please settle the enrollment fees within 15 days (by ${dueDateStr}) to secure your seat.`,
        ['accounts@islamiya.ae', 'registration@islamiya.ae']
      );
    }
  };

  // 8. Super Admin: Place on Waiting List
  const handleWaitlistApplication = (appId: string, remarks?: string) => {
    if (currentRole !== 'SUPER_ADMIN') return;
    const updated = applications.map((app) => {
      if (app.id !== appId) return app;
      return {
        ...app,
        status: 'WAITING_LIST' as const,
        superAdminDecision: {
          decision: 'WAITING_LIST' as const,
          decisionDate: new Date().toISOString().slice(0, 10),
          approvedBy: 'Dr. D. A. Nazar (Principal)',
          remarks: remarks || 'Placed on official ADEK waiting list.',
        },
        timeline: [
          ...app.timeline,
          {
            id: `t-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            title: 'Allocated to Official Waiting List',
            description: remarks || 'Candidate placed on official ADEK certified waiting list.',
            actor: 'Dr. D. A. Nazar',
            role: 'SUPER_ADMIN' as const,
            status: 'WAITING_LIST' as const,
          },
        ],
      };
    });
    updateApps(updated, updated.find((a) => a.id === appId));

    const app = applications.find((a) => a.id === appId);
    if (app) {
      triggerAlert(
        'Admissions Waiting List Notice (AY 2027-2028)',
        app.fatherEmail,
        `Notice for ${app.studentName}: Your child has successfully passed the assessment and has been placed on the official certified ADEK Waiting List for ${app.gradeApplying}. You will be contacted immediately if a seat becomes available.`
      );
    }
  };

  // 9. Super Admin: Reject Application
  const handleRejectApplication = (appId: string, remarks?: string) => {
    if (currentRole !== 'SUPER_ADMIN') return;
    const updated = applications.map((app) => {
      if (app.id !== appId) return app;
      return {
        ...app,
        status: 'REJECTED' as const,
        superAdminDecision: {
          decision: 'REJECTED' as const,
          decisionDate: new Date().toISOString().slice(0, 10),
          approvedBy: 'Dr. D. A. Nazar (Principal)',
          remarks: remarks || 'Application not accepted.',
        },
      };
    });
    updateApps(updated, updated.find((a) => a.id === appId));
  };

  // 10. Super Admin: Terminate Student Account
  const handleTerminateStudent = (appId: string, reason: string) => {
    if (currentRole !== 'SUPER_ADMIN') return;
    const updated = applications.map((app) => {
      if (app.id !== appId) return app;
      return {
        ...app,
        status: 'TERMINATED' as const,
        isAccountActivated: false,
        timeline: [
          ...app.timeline,
          {
            id: `t-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            title: 'Student Account Terminated',
            description: `Reason: ${reason}`,
            actor: 'Super Admin',
            role: 'SUPER_ADMIN' as const,
            status: 'TERMINATED' as const,
          },
        ],
      };
    });
    updateApps(updated, updated.find((a) => a.id === appId));

    triggerAlert(
      'Official Notice: Student Enrollment Termination',
      'accounts@islamiya.ae',
      `Student record ${appId} terminated by Super Admin. Reason: ${reason}. System access revoked.`,
      ['registration@islamiya.ae']
    );
  };

  // 11. Parent: Process Payment (Generates Invoice & Uniform/Books Voucher)
  const handleProcessPayment = (
    appId: string,
    plan: PaymentPlan,
    method: PaymentMethod,
    includeBus: boolean
  ) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const breakdown = calculateFeeBreakdown(app.gradeApplying, includeBus, plan);
    const invoiceNo = `INV-2027-${Math.floor(1000 + Math.random() * 9000)}`;
    const voucherCode = `VCH-IES-${Math.floor(1000 + Math.random() * 9000)}`;
    const studentId = app.studentId || `IES-27-${Math.floor(1000 + Math.random() * 9000)}`;
    const gradeFees = OFFICIAL_FEE_SCHEDULE[app.gradeApplying];

    const updated = applications.map((a) => {
      if (a.id !== appId) return a;
      return {
        ...a,
        studentId,
        status: 'ENROLLED_ACTIVE' as const,
        payment: {
          plan,
          method,
          includeBus,
          tuitionFee: gradeFees.totalTuition,
          booksFee: gradeFees.textBooks,
          uniformFee: gradeFees.uniform,
          busFee: includeBus ? SCHOOL_INFO.fixedBusFee : 0,
          totalAnnualFee: breakdown.total,
          paidAmount: breakdown.dueNow,
          balanceAmount: breakdown.total - breakdown.dueNow,
          firstInstallment: breakdown.firstInstallment,
          secondInstallment: breakdown.secondInstallment,
          thirdInstallment: breakdown.thirdInstallment,
          approvalDate: a.payment?.approvalDate || new Date().toISOString().slice(0, 10),
          paymentDueDate: a.payment?.paymentDueDate || '',
          isPaid: true,
          paidDate: new Date().toISOString().slice(0, 10),
          transactionRef: `TXN-DIB-${Date.now().toString().slice(-8)}`,
          invoiceNumber: invoiceNo,
          voucherCode,
        },
        timeline: [
          ...a.timeline,
          {
            id: `t-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            title: 'Tuition Settled & Enrolled',
            description: `Payment of AED ${breakdown.dueNow.toLocaleString()} authorized via ${method}. Official Tax Invoice ${invoiceNo} and Supplies Voucher ${voucherCode} generated.`,
            actor: a.fatherName,
            role: 'PARENT' as const,
            status: 'ENROLLED_ACTIVE' as const,
          },
        ],
      };
    });

    updateApps(updated, updated.find((a) => a.id === appId));

    // Multi-copy email alert
    triggerAlert(
      `Official Tuition Tax Invoice & Bookstore Voucher (${invoiceNo})`,
      app.fatherEmail,
      `Payment received for ${app.studentName} (${app.gradeApplying}). Your child is officially enrolled for AY 2027-2028. Attached: Digital Tax Invoice & Books/Uniform Voucher ${voucherCode}.`,
      ['ies.schoolfee@islamia.ae (Accounts DEPT)', 'islamia@islamia.ae (Registration Team)']
    );
  };

  // 12. Parent: Request Official Letter
  const handleRequestLetter = (
    reqData: Omit<LetterRequest, 'id' | 'requestDate' | 'status'>
  ) => {
    const newReq: LetterRequest = {
      ...reqData,
      id: `let-${Date.now()}`,
      userId: firebaseUser?.uid,
      requestDate: new Date().toISOString().slice(0, 10),
      status: 'UNDER_REVIEW',
    };
    const updated = [newReq, ...letters];
    updateLetters(updated, newReq);

    triggerAlert(
      'Student Document Request Received',
      'islamia@islamia.ae (Registration Desk)',
      `Parent of ${newReq.studentName} requested an official ${newReq.letterType.replace(/_/g, ' ')}. Status: Under Review.`
    );
  };

  // 13. Registration Team: Process Letter
  const handleProcessLetter = (
    letterId: string,
    status: 'APPROVED' | 'READY_FOR_PICKUP',
    location?: string,
    notes?: string
  ) => {
    const updated = letters.map((l) => {
      if (l.id !== letterId) return l;
      return {
        ...l,
        status,
        processedDate: new Date().toISOString().slice(0, 10),
        collectionLocation: location || 'School Registration Department, Counter 2',
        documentRefNumber: `IES/REG/2027/DOC-${Math.floor(1000 + Math.random() * 9000)}`,
        adminNotes: notes,
      };
    });
    updateLetters(updated, updated.find((l) => l.id === letterId));

    const letter = letters.find((l) => l.id === letterId);
    if (letter) {
      triggerAlert(
        `Letter Status Update: Ready for Collection`,
        'Parent Portal',
        `Your requested ${letter.letterType.replace(/_/g, ' ')} for ${letter.studentName} has been processed and signed. Please visit ${location || 'School Registration Department'} for collection.`
      );
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-900 text-amber-400 font-serif font-black text-xl flex items-center justify-center shadow-md animate-pulse mb-3">
          IES
        </div>
        <div className="text-sm font-bold text-slate-800">Verifying Credentials...</div>
        <div className="text-xs text-slate-500 mt-1">Authenticating session with Firebase & Firestore</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        onFirebaseAuthenticated={async (user) => {
          const profile = await syncCurrentUserProfile(user);
          setUserProfile(profile);
          setCurrentRole(profile.role);
          setIsAuthenticated(true);
        }}
        onStartNewApplication={() => {
          setActiveTab('apply');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Authentic Institutional Top Navbar - Simulation bar removed */}
      <Navbar
        currentRole={currentRole}
        activeTab={activeTab}
        onTabChange={(tab) => {
          // Strictly protect admin and staff routes based on verified Firestore role
          if (tab.startsWith('super-') && !isAdminRole(currentRole)) {
            return;
          }
          if (tab.startsWith('staff-') && currentRole !== 'ADMIN_STAFF' && !isAdminRole(currentRole)) {
            return;
          }
          if (tab.startsWith('reg-') && currentRole !== 'REGISTRATION' && !isAdminRole(currentRole)) {
            return;
          }
          setActiveTab(tab);
        }}
        onSignOut={handleSignOut}
        userEmail={userProfile?.email || firebaseUser?.email || ''}
        userDisplayName={userProfile?.displayName || firebaseUser?.displayName || ''}
      />

      {/* Real-time Email & Notification Toast Alert */}
      {systemAlert && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{systemAlert.title}</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                  To: {systemAlert.recipient}
                </div>
                {systemAlert.copies && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    CC: {systemAlert.copies.join(' · ')}
                  </div>
                )}
                <p className="text-slate-300 mt-1.5 leading-relaxed text-[11px]">
                  {systemAlert.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSystemAlert(null)}
              className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ROLE 1: PARENT / STUDENT PORTAL */}
        {(!isAdminRole(currentRole) && currentRole !== 'ADMIN_STAFF' && currentRole !== 'REGISTRATION') && (
          <ParentDashboard
            applications={applications}
            letters={letters}
            selectedAppId={selectedAppId}
            onSelectAppId={(id) => setSelectedAppId(id)}
            onSubmitNewApplication={handleSubmitNewApplication}
            onReuploadDocument={handleReuploadDocument}
            onProcessPayment={handleProcessPayment}
            onRequestLetter={handleRequestLetter}
            activeSubTab={
              activeTab === 'tracker' || activeTab === 'apply' || activeTab === 'fees' || activeTab === 'letters'
                ? (activeTab as any)
                : 'tracker'
            }
            onChangeSubTab={(sub) => setActiveTab(sub)}
          />
        )}

        {/* ROLE 2: ADMISSIONS STAFF PORTAL */}
        {currentRole === 'ADMIN_STAFF' && (
          <StaffAdmissions
            applications={applications}
            onVerifyDocument={handleVerifyDocument}
            onVerifyAllDocuments={handleVerifyAllDocuments}
            onRequestReupload={handleRequestReupload}
            onScheduleInterview={handleScheduleInterview}
            onCompleteEvaluation={handleCompleteEvaluation}
          />
        )}

        {/* ROLE 3: SUPER ADMIN PORTAL (Restricted strictly to user registered as admin in Firestore UserProfile) */}
        {isAdminRole(currentRole) && (
          <SuperAdminDashboard
            applications={applications}
            onApproveApplication={handleApproveApplication}
            onWaitlistApplication={handleWaitlistApplication}
            onRejectApplication={handleRejectApplication}
            onTerminateStudent={handleTerminateStudent}
            currentRole={currentRole}
            activeSubTab={
              activeTab === 'super-settings'
                ? 'settings'
                : activeTab === 'super-analytics'
                ? 'analytics'
                : activeTab === 'super-roles'
                ? 'roles'
                : 'approvals'
            }
            onChangeSubTab={(tab) => {
              if (tab === 'settings') setActiveTab('super-settings');
              else if (tab === 'analytics') setActiveTab('super-analytics');
              else if (tab === 'roles') setActiveTab('super-roles');
              else setActiveTab('super-approvals');
            }}
          />
        )}

        {/* Security fallback: Attempting to access Super Admin without admin role */}
        {activeTab.startsWith('super-') && !isAdminRole(currentRole) && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              ✕
            </div>
            <h3 className="text-base font-bold text-red-900 mb-1">Access Restricted · منطقة محمية</h3>
            <p className="text-xs text-red-700 leading-relaxed mb-4">
              The Super Admin panel is restricted exclusively to verified administrator accounts registered as <code className="font-mono bg-red-100 px-1 py-0.5 rounded text-red-900 font-bold">admin</code> in the Firestore <code className="font-mono bg-red-100 px-1 py-0.5 rounded text-red-900 font-bold">UserProfile</code> collection.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('tracker')}
              className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-colors"
            >
              Return to My Portal
            </button>
          </div>
        )}

        {/* ROLE 4: REGISTRATION & RECORDS TEAM PORTAL */}
        {currentRole === 'REGISTRATION' && (
          <RegistrationDatabase
            applications={applications}
            letters={letters}
            onProcessLetter={handleProcessLetter}
            activeSubTab={activeTab === 'reg-letters' ? 'letters' : 'database'}
            onChangeSubTab={(tab) => {
              if (tab === 'letters') setActiveTab('reg-letters');
              else setActiveTab('reg-database');
            }}
          />
        )}

        {/* Analytics View for Super Admin tab if clicked */}
        {isAdminRole(currentRole) && activeTab === 'super-analytics' && (
          <div className="mt-6">
            <AnalyticsDashboard applications={applications} letters={letters} />
          </div>
        )}
      </main>

      {/* Clean Institutional Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
            <div>
              <div className="text-white font-bold text-sm tracking-wide">
                Islamiya English School Abu Dhabi L.L.C.
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                P.O. Box: 2157, Abu Dhabi, U.A.E. · Tel: {SCHOOL_INFO.tel} · Email: {SCHOOL_INFO.email}
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              Licensed by Abu Dhabi Department of Education and Knowledge (ADEK)
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              Academic Year 2027-2028 · Official Online Admissions & Student Records Hub
            </div>
            <div className="flex items-center gap-4">
              <span>British Curriculum & UAE Ministry of Education Syllabus</span>
              <span>·</span>
              <span>Protected by Firestore ABAC Role Verification</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
