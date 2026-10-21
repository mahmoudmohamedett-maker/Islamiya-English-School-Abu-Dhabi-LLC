/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StudentApplication, LetterRequest } from '../../types/admissions';
import { OFFICIAL_FEE_SCHEDULE } from '../../data/feeSchedule';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Users,
  DollarSign,
  GraduationCap,
  CheckCircle,
  Clock,
  Bus,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  applications: StudentApplication[];
  letters: LetterRequest[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  applications,
  letters,
}) => {
  const total = applications.length;

  // Funnel counts
  const stage1 = applications.length;
  const stage2 = applications.filter((a) => a.status !== 'PENDING_DOCS' && a.status !== 'DOCS_REUPLOAD_REQ').length;
  const stage3 = applications.filter((a) => a.interview?.status === 'PASSED' || a.status === 'SUPER_ADMIN_APPROVED' || a.status === 'PAYMENT_PENDING' || a.status === 'ENROLLED_ACTIVE').length;
  const stage4 = applications.filter((a) => a.status === 'SUPER_ADMIN_APPROVED' || a.status === 'PAYMENT_PENDING' || a.status === 'ENROLLED_ACTIVE').length;
  const stage5 = applications.filter((a) => a.status === 'ENROLLED_ACTIVE').length;

  // Financial calculations
  const totalCollected = applications.reduce((sum, a) => sum + (a.payment?.paidAmount || 0), 0);
  const totalAnnualPotential = applications.reduce((sum, a) => sum + (a.payment?.totalAnnualFee || 0), 0);
  const busCount = applications.filter((a) => a.payment?.includeBus).length;
  const siblingCount = applications.filter((a) => a.hasSiblingInSchool).length;

  // Plan Distribution
  const planFull = applications.filter((a) => a.payment?.plan === 'FULL').length;
  const planTwo = applications.filter((a) => a.payment?.plan === 'TWO_INSTALLMENTS').length;
  const planThree = applications.filter((a) => a.payment?.plan === 'THREE_INSTALLMENTS').length;

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Registered Applicants</span>
            <Users className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">AY 2027-2028 Pipeline</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Enrolled & Paid Students</span>
            <CheckCircle className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800">{stage5}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {total > 0 ? `${Math.round((stage5 / total) * 100)}% conversion rate` : '0%'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Tuition & Fees Collected</span>
            <DollarSign className="w-4 h-4 text-blue-800" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            AED {totalCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Audited Dubai Islamic Bank
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Bus Transit Subscriptions</span>
            <Bus className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900">{busCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            AED {(busCount * 3510).toLocaleString()} route revenue
          </div>
        </div>
      </div>

      {/* ADMISSION FUNNEL CONVERSION TOOL */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-800" />
              <span>Real-Time Admissions Conversion Funnel</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live funnel velocity from initial parent submission to fee settlement and voucher issuance.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {[
            { label: '1. Applications Submitted (Parent Profiles)', count: stage1, color: 'bg-slate-700', percent: 100 },
            { label: '2. Documents Certified & Verified (ADEK Compliant)', count: stage2, color: 'bg-blue-700', percent: total > 0 ? Math.round((stage2 / total) * 100) : 0 },
            { label: '3. Assessment Interview Attended & Passed', count: stage3, color: 'bg-purple-700', percent: total > 0 ? Math.round((stage3 / total) * 100) : 0 },
            { label: '4. Super Admin Final Seat Approval', count: stage4, color: 'bg-amber-700', percent: total > 0 ? Math.round((stage4 / total) * 100) : 0 },
            { label: '5. Tuition Paid & Active Enrolled (Completed)', count: stage5, color: 'bg-emerald-700', percent: total > 0 ? Math.round((stage5 / total) * 100) : 0 },
          ].map((step, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-baseline font-medium text-slate-800">
                <span>{step.label}</span>
                <span className="font-mono font-bold text-slate-900">
                  {step.count} ({step.percent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${step.color} transition-all duration-500`}
                  style={{ width: `${step.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Grade Capacity Breakdown + Payment Plans Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grade Enrolment Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-800" />
            <span>Grade-Wise Capacity Allocation</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Seat utilization across Kindergarten, Primary, and Secondary sections.
          </p>

          <div className="space-y-2.5 text-xs">
            {['KG-1', 'KG-2', 'Grade 1', 'Grade 4', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 10', 'Grade 11'].map((g) => {
              const countInGrade = applications.filter((a) => a.gradeApplying === g).length;
              const maxGradeCapacity = 100;
              const pct = Math.min(100, Math.round((countInGrade / 10) * 100));
              return (
                <div key={g} className="flex items-center gap-3">
                  <span className="w-16 font-bold text-slate-800 shrink-0">{g}</span>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-700 h-full rounded-full"
                      style={{ width: `${Math.max(10, pct)}%` }}
                    />
                  </div>
                  <span className="w-14 text-right font-mono font-bold text-slate-700 shrink-0">
                    {countInGrade} apps
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Plan Distribution & Performance */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-700" />
              <span>Parent Payment Plan Preferences</span>
            </h3>
            <p className="text-xs text-slate-500">
              Breakdown of how admitted parents choose to settle school fees.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900">3 Termly Installments (ADEK Default)</div>
                <div className="text-[11px] text-slate-500">Separated across Term 1, 2, and 3</div>
              </div>
              <span className="font-mono font-bold text-base text-purple-900">{planThree} families</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900">Full Annual Single Settlement</div>
                <div className="text-[11px] text-slate-500">100% upfront tuition & supplies</div>
              </div>
              <span className="font-mono font-bold text-base text-emerald-900">{planFull} families</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900">2 Installments (Semi-Annual)</div>
                <div className="text-[11px] text-slate-500">Split into two semester settlements</div>
              </div>
              <span className="font-mono font-bold text-base text-blue-900">{planTwo} families</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Sibling Priority Ratio:</span>
            <span className="font-bold text-slate-900 font-mono">
              {siblingCount} of {total} ({total > 0 ? Math.round((siblingCount / total) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
