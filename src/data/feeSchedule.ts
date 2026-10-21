/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GradeFeeInfo, GradeLevel, PaymentPlan } from '../types/admissions';

export const SCHOOL_INFO = {
  name: 'Islamiya English School Abu Dhabi L.L.C.',
  nameArabic: 'المدرسة الإسلامية الإنجليزية أبوظبي ذ.م.م.',
  academicYear: '2027-2028',
  tel: '+971 2 6417773',
  fax: '+971 2 6418958',
  email: 'islamia@islamia.ae',
  feeEmail: 'ies.schoolfee@islamia.ae',
  website: 'www.islamiya.ae',
  poBox: 'P.O. Box: 2157, Abu Dhabi, U.A.E.',
  fixedUniformFee: 300,
  fixedBusFee: 3510,
};

export const OFFICIAL_FEE_SCHEDULE: Record<GradeLevel, GradeFeeInfo> = {
  'KG-1': {
    grade: 'KG-1',
    firstInstallment: 2600,
    secondInstallment: 2565,
    thirdInstallment: 2565,
    totalTuition: 7630,
    textBooks: 345,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 12085,
    totalWithoutBus: 8275,
  },
  'KG-2': {
    grade: 'KG-2',
    firstInstallment: 2755,
    secondInstallment: 2755,
    thirdInstallment: 2750,
    totalTuition: 8260,
    textBooks: 509,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 12579,
    totalWithoutBus: 9069,
  },
  'Grade 1': {
    grade: 'Grade 1',
    firstInstallment: 2755,
    secondInstallment: 2755,
    thirdInstallment: 2750,
    totalTuition: 8260,
    textBooks: 565,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 12635,
    totalWithoutBus: 9125,
  },
  'Grade 2': {
    grade: 'Grade 2',
    firstInstallment: 2755,
    secondInstallment: 2755,
    thirdInstallment: 2750,
    totalTuition: 8260,
    textBooks: 627,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 12697,
    totalWithoutBus: 9187,
  },
  'Grade 3': {
    grade: 'Grade 3',
    firstInstallment: 2790,
    secondInstallment: 2785,
    thirdInstallment: 2785,
    totalTuition: 8360,
    textBooks: 636,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 12806,
    totalWithoutBus: 9296,
  },
  'Grade 4': {
    grade: 'Grade 4',
    firstInstallment: 2895,
    secondInstallment: 2893,
    thirdInstallment: 2892,
    totalTuition: 8680,
    textBooks: 831,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 13321,
    totalWithoutBus: 9811,
  },
  'Grade 5': {
    grade: 'Grade 5',
    firstInstallment: 2895,
    secondInstallment: 2893,
    thirdInstallment: 2892,
    totalTuition: 8680,
    textBooks: 866,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 13356,
    totalWithoutBus: 9846,
  },
  'Grade 6': {
    grade: 'Grade 6',
    firstInstallment: 2895,
    secondInstallment: 2893,
    thirdInstallment: 2892,
    totalTuition: 8680,
    textBooks: 831,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 13321,
    totalWithoutBus: 9811,
  },
  'Grade 7': {
    grade: 'Grade 7',
    firstInstallment: 2895,
    secondInstallment: 2893,
    thirdInstallment: 2892,
    totalTuition: 8680,
    textBooks: 976,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 13466,
    totalWithoutBus: 9956,
  },
  'Grade 8': {
    grade: 'Grade 8',
    firstInstallment: 3640,
    secondInstallment: 3640,
    thirdInstallment: 3640,
    totalTuition: 10920,
    textBooks: 1650,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 16380,
    totalWithoutBus: 12870,
  },
  'Grade 9': {
    grade: 'Grade 9',
    firstInstallment: 3640,
    secondInstallment: 3640,
    thirdInstallment: 3640,
    totalTuition: 10920,
    textBooks: 1650,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 16380,
    totalWithoutBus: 12870,
  },
  'Grade 10': {
    grade: 'Grade 10',
    firstInstallment: 3610,
    secondInstallment: 3610,
    thirdInstallment: 3610,
    totalTuition: 10830,
    textBooks: 1500,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 16140,
    totalWithoutBus: 12630,
  },
  'Grade 11': {
    grade: 'Grade 11',
    firstInstallment: 5365,
    secondInstallment: 5365,
    thirdInstallment: 5360,
    totalTuition: 16090,
    textBooks: 2160,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 22060,
    totalWithoutBus: 18550,
  },
  'Grade 12': {
    grade: 'Grade 12',
    firstInstallment: 5365,
    secondInstallment: 5365,
    thirdInstallment: 5360,
    totalTuition: 16090,
    textBooks: 2160,
    uniform: 300,
    busFee: 3510,
    totalWithBus: 22060,
    totalWithoutBus: 18550,
  },
};

export function calculateFeeBreakdown(grade: GradeLevel, includeBus: boolean, plan: PaymentPlan) {
  const info = OFFICIAL_FEE_SCHEDULE[grade];
  const bus = includeBus ? info.busFee : 0;
  const grandTotal = info.totalTuition + info.textBooks + info.uniform + bus;
  
  // Mandatory books and uniform are settled in Term 1 / initial payment
  const initialSupplies = info.textBooks + info.uniform;
  const busPerTerm = includeBus ? Math.round(bus / 3) : 0;
  const busTerm1 = busPerTerm;
  const busTerm2 = busPerTerm;
  const busTerm3 = bus - (busTerm1 + busTerm2);

  if (plan === 'FULL') {
    return {
      total: grandTotal,
      firstInstallment: grandTotal,
      secondInstallment: 0,
      thirdInstallment: 0,
      dueNow: grandTotal,
      description: 'Single full settlement (Tuition, Books, Uniform, ' + (includeBus ? 'Bus Transportation' : 'Self-transport') + ')',
    };
  } else if (plan === 'TWO_INSTALLMENTS') {
    // 50% split of tuition + supplies in 1st half
    const halfTuition = Math.round(info.totalTuition / 2);
    const first = halfTuition + initialSupplies + (includeBus ? Math.round(bus / 2) : 0);
    const second = grandTotal - first;
    return {
      total: grandTotal,
      firstInstallment: first,
      secondInstallment: second,
      thirdInstallment: 0,
      dueNow: first,
      description: '2 Installments: Term 1 (with Books & Uniform) + Term 2/3 remainder',
    };
  } else {
    // 3 Termly Installments as per official document
    const first = info.firstInstallment + initialSupplies + busTerm1;
    const second = info.secondInstallment + busTerm2;
    const third = info.thirdInstallment + busTerm3;
    return {
      total: grandTotal,
      firstInstallment: first,
      secondInstallment: second,
      thirdInstallment: third,
      dueNow: first,
      description: '3 Termly Installments (Term 1 includes Text Books & Uniform voucher)',
    };
  }
}
