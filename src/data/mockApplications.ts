/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentApplication, LetterRequest } from '../types/admissions';

// Completely empty initial states - No fake mock data
export const INITIAL_APPLICATIONS: StudentApplication[] = [];
export const INITIAL_LETTERS: LetterRequest[] = [];

const STORAGE_KEYS = {
  APPLICATIONS: 'ies_admissions_applications_live_v3',
  LETTERS: 'ies_admissions_letters_live_v3',
};

export function loadApplications(): StudentApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading applications from localStorage', e);
    return [];
  }
}

export function saveApplications(apps: StudentApplication[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  } catch (e) {
    console.error('Error saving applications to localStorage', e);
  }
}

export function loadLetters(): LetterRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LETTERS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading letters from localStorage', e);
    return [];
  }
}

export function saveLetters(letters: LetterRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(letters));
  } catch (e) {
    console.error('Error saving letters to localStorage', e);
  }
}

export function resetToSampleData(): { applications: StudentApplication[]; letters: LetterRequest[] } {
  localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
  localStorage.removeItem(STORAGE_KEYS.LETTERS);
  return { applications: [], letters: [] };
}
