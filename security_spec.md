# Security Specification & Threat Model
## Islamiya English School Abu Dhabi Admissions Portal

### 1. Data Invariants
1. **Application Identity & Ownership Invariant**: A student admission application submitted by an authenticated user (`userId`) must strictly have `userId == request.auth.uid`. A student/parent cannot create or modify applications belonging to other parents or students.
2. **Immutability of Key Attributes**: Once submitted, `id`, `academicYear` ('2027-2028'), `submittedAt`, and `userId` cannot be tampered with or modified.
3. **Privilege Boundary & Action Integrity**: Only authorized administrative staff (Admissions Staff, Super Admin, Registration Team) or the system can update administrative decision fields (`status`, `interview`, `payment`, `tuitionPaid`, `credentials`). Unprivileged users cannot self-approve applications or elevate their own status.
4. **Document ID Sanitization**: All Firestore document IDs must adhere to safe format regex `^[a-zA-Z0-9_\-]+$` and length <= 128 chars.
5. **PII Isolation**: Applicant contact data (parent phone, email, Emirates ID) can only be read by the submitting user or authorized school administrators (`isAdmin()`).
6. **Letter Request Invariant**: Official letter requests must be linked to an existing application, and only the application owner or authorized registration staff may read or process them.

---

### 2. The "Dirty Dozen" Payloads (Adversarial Payloads Designed to Fail)

1. **Payload 1 (Identity Spoofing on Application Creation)**:
   A malicious user attempts to create an application with `userId: "victim-uid-999"` instead of their authenticated UID.
   ```json
   {
     "id": "IES-2027-HACK",
     "userId": "victim-uid-999",
     "applicantName": "Attacker Impersonation",
     "gradeApplying": "KG-1",
     "academicYear": "2027-2028",
     "parentName": "Attacker",
     "parentEmail": "attacker@fake.com",
     "status": "PENDING_DOCS"
   }
   ```
   *Expected Outcome*: PERMISSION_DENIED.

2. **Payload 2 (Self-Elevation to Super Admin Status)**:
   A regular parent attempts an update to bypass document verification and set their status straight to `SUPER_ADMIN_APPROVED`.
   ```json
   {
     "status": "SUPER_ADMIN_APPROVED"
   }
   ```
   *Expected Outcome*: PERMISSION_DENIED.

3. **Payload 3 (Self-Marking Tuition Paid Without Settlement)**:
   A parent user attempts to flip `tuitionPaid: true` without staff/payment authorization.
   ```json
   {
     "tuitionPaid": true
   }
   ```
   *Expected Outcome*: PERMISSION_DENIED.

4. **Payload 4 (Junk Character / ID Poisoning Attack)**:
   Attacker attempts to create a document with a 2KB junk character string or path traversal ID.
   ```
   Target Path: /applications/../../etc/passwd%00<1024-chars-junk>
   ```
   *Expected Outcome*: PERMISSION_DENIED (`isValidId` rejects length > 128 or non-matching regex).

5. **Payload 5 (Shadow Update / Ghost Field Injection)**:
   An update payload contains an unauthorized field injection like `systemRole: "SUPER_ADMIN"` or `bypassFee: true`.
   ```json
   {
     "applicantName": "Valid Name",
     "systemRole": "SUPER_ADMIN"
   }
   ```
   *Expected Outcome*: PERMISSION_DENIED (`hasOnly()` fails).

6. **Payload 6 (Oversized Field / Denial-of-Wallet Attack)**:
   Attacker submits a 500KB string in `applicantName` to inflate storage and egress costs.
   ```json
   {
     "applicantName": "A".repeat(500000)
   }
   ```
   *Expected Outcome*: PERMISSION_DENIED (`maxLength` / size check enforces max 128 chars).

7. **Payload 7 (Unauthenticated Read Attempt on User Dossiers)**:
   An unauthenticated guest (`request.auth == null`) requests `/applications/IES-2027-0101`.
   *Expected Outcome*: PERMISSION_DENIED.

8. **Payload 8 (Cross-Parent Application Read / Query Scraping)**:
   Parent B (`uid: "parent-b"`) attempts to read Parent A's application `/applications/IES-2027-0101` where `userId: "parent-a"`.
   *Expected Outcome*: PERMISSION_DENIED.

9. **Payload 9 (Self-Assignment of Admin Record in `/admins`)**:
   A normal user attempts to write their own UID into `/admins/{request.auth.uid}` with `role: "SUPER_ADMIN"`.
   ```json
   {
     "id": "attacker-uid",
     "email": "attacker@evil.com",
     "role": "SUPER_ADMIN"
   }
   ```
   *Expected Outcome*: PERMISSION_DENIED (writes to `/admins` strictly denied to standard clients).

10. **Payload 10 (Tampering with Submitted Timestamp)**:
    An applicant tries to modify the immutable `submittedAt` timestamp to an earlier date.
    ```json
    {
      "submittedAt": "2020-01-01T00:00:00Z"
    }
    ```
    *Expected Outcome*: PERMISSION_DENIED.

11. **Payload 11 (Fabricated Assessment Pass Score by Parent)**:
    Applicant injects an interview assessment object with `result: "PASS"` and custom feedback without staff evaluation.
    ```json
    {
      "interview": {
        "status": "COMPLETED",
        "result": "PASS",
        "evaluatorNotes": "Self granted pass"
      }
    }
    ```
    *Expected Outcome*: PERMISSION_DENIED (only staff / admin role can modify `interview`).

12. **Payload 12 (Unauthorized Letter Request Fulfillment)**:
    A student/parent attempts to mark their own letter request as `ACCEPTED_READY_FOR_PICKUP` or modify `adminNotes`.
    ```json
    {
      "status": "ACCEPTED_READY_FOR_PICKUP",
      "adminNotes": "Approved by myself"
    }
    ```
    *Expected Outcome*: PERMISSION_DENIED.

---

### 3. Test Runner Specification (`firestore.rules.test.ts`)
The test runner validates that each of the 12 attack vectors fails with `PERMISSION_DENIED` and that legitimate flows succeed.
