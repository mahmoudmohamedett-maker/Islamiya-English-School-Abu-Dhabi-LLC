/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentApplication, LetterRequest } from '../types/admissions';
import { SCHOOL_INFO } from '../data/feeSchedule';

export function exportApplicationsToCSV(applications: StudentApplication[]): void {
  const headers = [
    'Application No',
    'Student ID',
    'Academic Year',
    'Student Name',
    'Date of Birth',
    'Gender',
    'Nationality',
    'Emirates ID',
    'Grade Applying',
    'Sibling In School',
    'Father Name',
    'Father Phone',
    'Father Email',
    'Mother Name',
    'Residential Address',
    'Status',
    'Submission Date',
    'Interview Status',
    'Interview Score',
    'Interview Feedback',
    'Super Admin Decision',
    'Total Fee (AED)',
    'Paid Amount (AED)',
    'Payment Method',
    'Invoice No',
    'Voucher Code',
  ];

  const rows = applications.map((app) => [
    app.applicationNo,
    app.studentId || 'N/A',
    app.academicYear,
    `"${app.studentName.replace(/"/g, '""')}"`,
    app.dob,
    app.gender,
    app.nationality,
    app.emiratesId,
    app.gradeApplying,
    app.hasSiblingInSchool ? `Yes (${app.siblingId || ''})` : 'No',
    `"${app.fatherName.replace(/"/g, '""')}"`,
    app.fatherPhone,
    app.fatherEmail,
    `"${app.motherName.replace(/"/g, '""')}"`,
    `"${app.residentialAddress.replace(/"/g, '""')}"`,
    app.status,
    app.submissionDate,
    app.interview?.status || 'N/A',
    app.interview?.aptitudeScore ?? 'N/A',
    `"${(app.interview?.feedback || '').replace(/"/g, '""')}"`,
    app.superAdminDecision?.decision || 'N/A',
    app.payment?.totalAnnualFee ?? '0',
    app.payment?.paidAmount ?? '0',
    app.payment?.method || 'N/A',
    app.payment?.invoiceNumber || 'N/A',
    app.payment?.voucherCode || 'N/A',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `IES_Admissions_Registry_AY2027-2028_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printInvoice(app: StudentApplication): void {
  if (!app.payment) return;
  const p = app.payment;
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Official Tuition Invoice - ${p.invoiceNumber || app.applicationNo}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0f4c3a; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { color: #0f4c3a; margin: 0 0 4px 0; font-size: 24px; text-transform: uppercase; }
          .header h2 { color: #475569; margin: 0 0 8px 0; font-size: 16px; direction: rtl; }
          .header p { margin: 2px 0; font-size: 12px; color: #64748b; }
          .badge { display: inline-block; padding: 4px 12px; border: 1px solid #16a34a; color: #15803d; font-weight: bold; font-size: 12px; border-radius: 4px; margin-top: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 13px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 6px; }
          .box h4 { margin: 0 0 8px 0; color: #0f4c3a; font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          th { background: #0f4c3a; color: white; text-align: left; padding: 10px; font-weight: 600; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px; }
          .amount { text-align: right; font-family: monospace; }
          .total-row { font-weight: bold; background: #f1f5f9; }
          .bank-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; font-size: 12px; margin-bottom: 24px; }
          .footer { font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${SCHOOL_INFO.name}</h1>
          <h2>${SCHOOL_INFO.nameArabic}</h2>
          <p>${SCHOOL_INFO.poBox} | Tel: ${SCHOOL_INFO.tel} | Email: ${SCHOOL_INFO.feeEmail}</p>
          <p>Licensed by Abu Dhabi Department of Education and Knowledge (ADEK)</p>
          <span class="badge">OFFICIAL TAX & REGISTRATION RECEIPT</span>
        </div>

        <div class="grid">
          <div class="box">
            <h4>Student Details</h4>
            <p><strong>Name:</strong> ${app.studentName}</p>
            <p><strong>Student ID:</strong> ${app.studentId || 'PENDING'}</p>
            <p><strong>Application No:</strong> ${app.applicationNo}</p>
            <p><strong>Grade:</strong> ${app.gradeApplying} (AY 2027-2028)</p>
            <p><strong>Emirates ID:</strong> ${app.emiratesId}</p>
          </div>
          <div class="box">
            <h4>Payment Particulars</h4>
            <p><strong>Invoice Number:</strong> ${p.invoiceNumber || 'INV-2027-PENDING'}</p>
            <p><strong>Date of Payment:</strong> ${p.paidDate || new Date().toISOString().slice(0, 10)}</p>
            <p><strong>Payment Plan:</strong> ${p.plan === 'FULL' ? 'Full Settlement' : p.plan === 'TWO_INSTALLMENTS' ? '2 Installments' : '3 Termly Installments'}</p>
            <p><strong>Transaction Ref:</strong> ${p.transactionRef || 'N/A'}</p>
            <p><strong>Payment Method:</strong> ${p.method}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fee Description</th>
              <th>Installment / Terms</th>
              <th class="amount">Amount (AED)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Annual Tuition Fee (${app.gradeApplying})</td>
              <td>${p.plan === 'THREE_INSTALLMENTS' ? 'Term 1 Settlement' : p.plan === 'TWO_INSTALLMENTS' ? '1st Half' : 'Full Year'}</td>
              <td class="amount">${p.tuitionFee.toLocaleString()}.00</td>
            </tr>
            <tr>
              <td>ADEK Approved Text Books</td>
              <td>Academic Year 2027-2028 Package</td>
              <td class="amount">${p.booksFee.toLocaleString()}.00</td>
            </tr>
            <tr>
              <td>School Uniform Set (Voucher issued)</td>
              <td>Regular & PE Uniform</td>
              <td class="amount">${p.uniformFee.toLocaleString()}.00</td>
            </tr>
            ${
              p.includeBus
                ? `<tr>
                    <td>School Bus Transportation (Optional)</td>
                    <td>Annual Two-Way Route Abu Dhabi</td>
                    <td class="amount">${p.busFee.toLocaleString()}.00</td>
                  </tr>`
                : ''
            }
            <tr class="total-row">
              <td colspan="2">Total Annual Assessed</td>
              <td class="amount">${p.totalAnnualFee.toLocaleString()}.00</td>
            </tr>
            <tr class="total-row" style="color: #15803d; font-size: 14px;">
              <td colspan="2">TOTAL AMOUNT PAID TODAY</td>
              <td class="amount">${p.paidAmount.toLocaleString()}.00</td>
            </tr>
            ${
              p.balanceAmount > 0
                ? `<tr style="color: #b45309;">
                    <td colspan="2">Remaining Installments Balance</td>
                    <td class="amount">${p.balanceAmount.toLocaleString()}.00</td>
                  </tr>`
                : ''
            }
          </tbody>
        </table>

        <div class="footer">
          <p>This is a computer-generated official receipt approved by Islamiya English School Abu Dhabi Accounts & Registration Office.</p>
          <p>Copies dispatched to: Parent/Guardian, Accounts Department, and Student Academic Registry.</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 350);
}

export function printVoucher(app: StudentApplication): void {
  if (!app.payment) return;
  const p = app.payment;
  const printWindow = window.open('', '_blank', 'width=750,height=800');
  if (!printWindow) return;

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Books & Uniform Collection Voucher - ${p.voucherCode || app.applicationNo}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #1e293b; }
          .ticket { border: 2px dashed #0f4c3a; padding: 24px; border-radius: 8px; background: #fff; position: relative; }
          .header { text-align: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 16px; }
          .header h2 { color: #0f4c3a; margin: 0 0 4px 0; }
          .header p { margin: 0; font-size: 12px; color: #64748b; }
          .voucher-tag { background: #0f4c3a; color: white; display: inline-block; padding: 6px 16px; font-weight: bold; border-radius: 4px; font-size: 14px; margin: 10px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; font-size: 13px; }
          .barcode-box { text-align: center; margin: 20px 0; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
          .code { font-family: monospace; font-size: 20px; letter-spacing: 4px; font-weight: bold; color: #0f4c3a; }
          .items { margin-bottom: 20px; font-size: 13px; }
          .items ul { margin: 8px 0; padding-left: 20px; }
          .items li { margin-bottom: 4px; }
          .instructions { font-size: 11px; color: #64748b; background: #fffbeb; border: 1px solid #fef3c7; padding: 10px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h2>${SCHOOL_INFO.name}</h2>
            <p>Academic Year 2027-2028 | Student Supplies Store</p>
            <div class="voucher-tag">OFFICIAL BOOKS & UNIFORM COLLECTION VOUCHER</div>
          </div>

          <div class="grid">
            <div>
              <p><strong>Student Name:</strong> ${app.studentName}</p>
              <p><strong>Student ID:</strong> ${app.studentId || 'PENDING'}</p>
              <p><strong>Grade Level:</strong> ${app.gradeApplying}</p>
              <p><strong>Emirates ID:</strong> ${app.emiratesId}</p>
            </div>
            <div>
              <p><strong>Voucher Code:</strong> ${p.voucherCode || 'VCH-IES-7729'}</p>
              <p><strong>Date Issued:</strong> ${p.paidDate || new Date().toISOString().slice(0, 10)}</p>
              <p><strong>Invoice Ref:</strong> ${p.invoiceNumber || 'INV-2027-PAID'}</p>
              <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">AUTHORIZED / PAID</span></p>
            </div>
          </div>

          <div class="barcode-box">
            <div class="code">*${p.voucherCode || 'VCH-IES-7729'}*</div>
            <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Scan at School Store Counter for Instant Verification</p>
          </div>

          <div class="items">
            <strong>Authorized Items for Immediate Issuance:</strong>
            <ul>
              <li><strong>Complete Grade Set of Text Books:</strong> Value AED ${p.booksFee}.00</li>
              <li><strong>Official School Uniform Set:</strong> 2x Regular Shirts/Pants or Tunics, 1x PE Kit, 1x School Crest Tie/Scarf - Value AED ${p.uniformFee}.00</li>
              <li><strong>Student Academic Diary & Portal Access Card</strong></li>
            </ul>
          </div>

          <div class="instructions">
            <strong>Store Collection Timings & Rules:</strong>
            <p style="margin: 4px 0;">Monday through Thursday: 08:30 AM to 01:30 PM | Friday: 08:30 AM to 11:30 AM.</p>
            <p style="margin: 4px 0;">Location: School Main Campus, Building B (Ground Floor Bookstore). Present this printed voucher or digital QR on your phone along with the Student's Emirates ID.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 350);
}

export function printLetter(req: LetterRequest, app?: StudentApplication): void {
  const printWindow = window.open('', '_blank', 'width=800,height=950');
  if (!printWindow) return;

  const letterTitles: Record<string, string> = {
    RECOMMENDATION: 'LETTER OF RECOMMENDATION',
    ENROLLMENT_CERTIFICATE: 'CERTIFICATE OF CONTINUATION OF STUDY & ENROLLMENT',
    STATEMENT_OF_RESULTS: 'OFFICIAL STATEMENT OF ACADEMIC RESULTS',
    NOC: 'NO OBJECTION CERTIFICATE (NOC)',
    TRANSFER_CERTIFICATE: 'TRANSFER & CONTINUATION CERTIFICATE',
  };

  const title = letterTitles[req.letterType] || 'OFFICIAL ATTESTED LETTER';

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${req.studentName}</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; margin: 40px; color: #0f172a; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #0f4c3a; padding-bottom: 16px; margin-bottom: 30px; }
          .header h1 { color: #0f4c3a; margin: 0; font-size: 26px; }
          .header h2 { color: #334155; margin: 4px 0; font-size: 18px; direction: rtl; }
          .header p { margin: 2px 0; font-size: 12px; font-family: sans-serif; color: #64748b; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; font-family: sans-serif; }
          .title { text-align: center; font-size: 20px; font-weight: bold; text-decoration: underline; margin-bottom: 30px; }
          .body { font-size: 16px; text-align: justify; margin-bottom: 40px; }
          .body p { margin-bottom: 16px; }
          .sign-grid { display: flex; justify-content: space-between; margin-top: 60px; font-size: 14px; font-family: sans-serif; }
          .sign-box { text-align: center; width: 220px; border-top: 1px solid #94a3b8; padding-top: 8px; }
          .seal { border: 2px solid #0f4c3a; width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 10px; color: #0f4c3a; font-weight: bold; margin: 0 auto; text-transform: uppercase; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 11px; text-align: center; font-family: sans-serif; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${SCHOOL_INFO.name}</h1>
          <h2>${SCHOOL_INFO.nameArabic}</h2>
          <p>${SCHOOL_INFO.poBox} | Tel: ${SCHOOL_INFO.tel} | Web: ${SCHOOL_INFO.website}</p>
          <p>Affiliated to British Curriculum & Approved by ADEK (Abu Dhabi)</p>
        </div>

        <div class="meta-row">
          <div><strong>Ref:</strong> ${req.documentRefNumber || 'IES/REG/2027/DOC-7729'}</div>
          <div><strong>Date:</strong> ${req.processedDate || new Date().toISOString().slice(0, 10)}</div>
        </div>

        <div class="title">${title}</div>

        <div class="body">
          <p><strong>TO WHOM IT MAY CONCERN,</strong></p>
          
          <p>
            This is to certify that <strong>${req.studentName}</strong> (Student ID: <strong>${req.studentId}</strong>) 
            ${app?.emiratesId ? `bearing Emirates Identity Card No. <strong>${app.emiratesId}</strong>` : ''} 
            is a bonafide and actively enrolled student at <strong>Islamiya English School Abu Dhabi</strong> for the 
            Academic Year <strong>2027-2028</strong>, pursuing studies in <strong>${req.grade}</strong>.
          </p>

          <p>
            ${
              req.letterType === 'RECOMMENDATION'
                ? `During the period of enrollment, the student has demonstrated exemplary conduct, academic enthusiasm, and outstanding participation in school curricula. This letter is issued with our highest commendation for: <em>${req.purpose}</em>.`
                : req.letterType === 'NOC'
                ? `The School Administration has No Objection whatsoever to the student participating in and completing the following requested undertaking: <em>${req.purpose}</em>.`
                : req.letterType === 'STATEMENT_OF_RESULTS'
                ? `The student has successfully fulfilled all continuous assessments, examinations, and ADEK mandated standards for their current curriculum with high distinction. Statement requested for: <em>${req.purpose}</em>.`
                : `This certificate is issued upon the official request of the student's legal guardian for the following stated purpose: <em>${req.purpose}</em>.`
            }
          </p>

          <p>
            This document is valid for official submission to governmental departments, diplomatic missions, embassies, educational authorities, and athletic federations across the United Arab Emirates and abroad.
          </p>
        </div>

        <div class="sign-grid">
          <div class="sign-box">
            <strong>Head of Student Affairs</strong><br />
            Registration Department
          </div>
          <div class="seal">
            Islamiya English School<br />
            * Abu Dhabi *<br />
            Official Seal
          </div>
          <div class="sign-box">
            <strong>Dr. D. A. Nazar</strong><br />
            Principal & Director
          </div>
        </div>

        <div class="footer">
          <p>Official document issued by Islamiya English School Abu Dhabi Registration Department.</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 350);
}
