# Refinement Plan: Islamiya English School Admission System

This plan details the updates to address the 11 specific enhancements requested for the Islamiya English School Abu Dhabi (AY 2027-2028) admissions platform.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The 11 requirements have been analyzed and mapped to concrete component and schema changes. All changes strictly preserve ADEK compliance and responsive design.

- **Main Authentication Gate**: Unauthenticated users land directly on a clean, minimal Login or Sign-Up page (toggle between Parent and Staff sign-in) with the "Demo Quick Logins" box removed.
- **Privacy & Role Isolation**: Evaluator identity and evaluator feedback notes are stripped from Parent views and made visible exclusively to the Super Admin.
- **Registration Team Scope**: All financial fields (tuition paid, invoice/voucher particulars, finance analytics) are completely removed from Registration & Records views, focusing purely on student records, dossier documents, and letter processing.
- **Payment Access Rule**: Fee checkout will only unlock once an applicant's status has been formally set to `SUPER_ADMIN_APPROVED` or `PAYMENT_PENDING`.

---

### 1. Overview of the 11 Requested Enhancements

1. **Clean Login / Sign-Up Main Page**:
   - Replace open auto-login with a dedicated, minimal full-page landing view featuring Sign In and Sign Up modes.
   - Completely remove the "Demo Quick Logins" box.
   - Provide seamless role-switch access inside the portal once authenticated.
2. **Removal of Bank Details**:
   - Remove all mentions of "Dubai Islamic Bank" and "IBAN: AE 050240010520746272701" from headers, fee schedules, footers, and invoices.
3. **All 6 ADEK Documents Mandatory**:
   - Update document definitions so all 6 documents are mandatory: Recent Student Photo, Student Emirates ID, Passport, Birth Certificate, Vaccination Card, and Previous Academic Result.
   - Enforce mandatory validation in the parent onboarding form and staff verification checklists.
4. **Nationality Country Dropdown**:
   - Replace the plain text input for Nationality with a comprehensive `<select>` dropdown populated with countries (United Arab Emirates defaulted, GCC countries, Arab nations, and international options).
5. **Fee Checkout Gated Behind Super-Admin Approval**:
   - The Tuition & Fees Settlement Portal will only display when an applicant is in `SUPER_ADMIN_APPROVED`, `PAYMENT_PENDING`, or `ENROLLED_ACTIVE` status.
   - Before approval, parents see an informational card stating fees unlock after Super-Admin approval.
6. **Admissions Staff Document Viewer & Re-upload Feedback**:
   - Add a full Document Preview Modal allowing Admissions Staff to inspect each submitted file with metadata and visual preview.
   - Provide a dedicated feedback input box for requesting re-upload with reasons sent directly to the parent.
7. **Remove "Assessment Evaluator" from Parent Page**:
   - Remove evaluator names/interviewer identities from the Assessment Interview card on the Parent portal.
8. **Student ID Prefix Changed from "STU" to "IES"**:
   - Update ID generation and all pre-seeded records from `STU-27-XXXX` to `IES-27-XXXX`.
9. **Remove Evaluator Feedback from Parent Page**:
   - Completely remove the official Evaluator Assessment Feedback from the Parent & Student view; display it strictly in the Super-Admin Executive Review queue.
10. **Remove All Finance-Related Data from Registration & Records**:
    - In `RegistrationDatabase.tsx`, remove the "Tuition Paid" column, revenue metrics, financial filters, and payment/voucher summaries from student dossiers.
11. **Remove "Recommended" from Payment Plan**:
    - Remove the `"Recommended"` badge/label from the 3 Termly Installments option in the payment checkout.

---

### 2. Technical Architecture & File Modifications

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Entry Point / Auth State Gate                         │
│                    (index.html / App.tsx / AuthPage)                        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     Unauthenticated View      │             │      Authenticated Portal     │
├───────────────────────────────┤             ├───────────────────────────────┤
│ • Clean Login & Sign-Up Gate  │             │ • Parent Portal (Gated Fees,  │
│ • No Demo Quick Logins Box    │             │   all 6 docs mandatory,       │
│ • Minimalist School Branding  │             │   evaluator info hidden)      │
│ • Parent vs Staff Toggle      │             │ • Admissions Staff (Document  │
└───────────────────────────────┘             │   Viewer + Feedback Drawer)   │
                                              │ • Super Admin (Evaluator      │
                                              │   Feedback + Final Approval)  │
                                              │ • Registration (Zero Finance) │
                                              └───────────────────────────────┘
```

#### Affected Files:
- `src/data/feeSchedule.ts`: Remove bank details; update descriptions.
- `src/types/admissions.ts`: Ensure all 6 document types are marked mandatory; update student ID types.
- `src/data/mockApplications.ts`: Update all student IDs to `IES-27-XXXX`, mark all 6 documents mandatory, remove bank references.
- `src/components/auth/AuthPage.tsx`: Dedicated full-page minimal login / sign-up component without demo quick-logins box.
- `src/components/parent/ParentDashboard.tsx`: Add countries select, make all 6 docs mandatory, hide fees until Super Admin approval, remove evaluator name & feedback, remove "Recommended" tag from payment plans.
- `src/components/admin/StaffAdmissions.tsx`: Add document visual preview modal with re-upload feedback box.
- `src/components/admin/SuperAdminDashboard.tsx`: Ensure evaluator feedback is displayed clearly in Super Admin approval queue.
- `src/components/admin/RegistrationDatabase.tsx`: Strip all finance references, columns, and voucher boxes from registration registry and dossiers.
- `src/utils/exportUtils.ts`: Update student ID prefix to `IES`, remove bank details from invoice.
- `src/App.tsx`: Integrate full-page login gate when logged out, update simulated alert text.

---

### 3. Verification & Validation Steps
1. Test clean login/signup landing page with no demo login clutter.
2. Confirm bank name and IBAN are absent from all screens and printable documents.
3. Verify all 6 documents are mandatory in new application submission and staff reviews.
4. Verify country dropdown in student nationality field.
5. Verify tuition payment section only shows for Super-Admin approved applicants.
6. Verify Admissions staff document preview and re-upload feedback functionality.
7. Confirm evaluator name and feedback are hidden from Parent portal and visible in Super Admin portal.
8. Verify all student IDs display `IES-27-XXXX`.
9. Confirm Registration & Records page contains zero financial metrics or columns.
10. Confirm "Recommended" is removed from the payment plans.
11. Run `compile_applet` and `lint_applet` to ensure clean build.
