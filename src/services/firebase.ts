/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword as fbSignInWithEmail,
  createUserWithEmailAndPassword as fbCreateUserWithEmail,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StudentApplication, LetterRequest, UserProfile, UserRole } from '../types/admissions';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must use firestoreDatabaseId specified in firebase-applet-config.json
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId as string);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Official verified Super Admin email address from project environment
export const SUPER_ADMIN_EMAIL = 'mahmoudmohamedett@gmail.com';

// Pre-authorized Admission Staff members
export const DESIGNATED_STAFF_EMAILS = [
  'timonegypt@gmail.com',
  'timonegypt@gmail',
];

export function normalizeEmail(email: string): string {
  if (!email) return '';
  let e = email.trim();
  if (e.toLowerCase().endsWith('@gmail')) {
    e = e + '.com';
  }
  return e;
}

export function isStaffEmail(email?: string | null): boolean {
  if (!email) return false;
  const em = normalizeEmail(email).toLowerCase();
  return DESIGNATED_STAFF_EMAILS.some(
    (s) => normalizeEmail(s).toLowerCase() === em || em.startsWith('timonegypt@')
  );
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const cleanEmail = normalizeEmail(email);
  const result = await fbSignInWithEmail(auth, cleanEmail, pass.trim());
  return result.user;
}

export async function signUpWithEmail(email: string, pass: string, name?: string): Promise<FirebaseUser> {
  const cleanEmail = normalizeEmail(email);
  const result = await fbCreateUserWithEmail(auth, cleanEmail, pass.trim());
  if (name && result.user) {
    try {
      await fbUpdateProfile(result.user, { displayName: name });
    } catch {
      // Non-fatal if display name update fails
    }
  }
  return result.user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const cleanEmail = normalizeEmail(email);
  await fbSendPasswordResetEmail(auth, cleanEmail);
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Helper to determine if a role string denotes administrative privileges
export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === 'admin' || r === 'super_admin' || r === 'super-admin';
}

// Error handling conforming to Firebase Integration guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check as required by guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
    return false;
  }
}

// -------------------------------------------------------------
// UserProfile & Role Operations (Purely Firebase Auth & Firestore)
// -------------------------------------------------------------

export const USER_PROFILE_COLLECTION = 'UserProfile';
export const USERS_COLLECTION = 'users';
export const ADMINS_COLLECTION = 'admins';

/**
 * Loads user profile from Firestore /UserProfile/{uid} (with fallback to /users/{uid}).
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `${USER_PROFILE_COLLECTION}/${uid}`;
  try {
    // 1. Try primary UserProfile collection
    const snap = await getDoc(doc(db, USER_PROFILE_COLLECTION, uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    // 2. Fallback to users collection
    const snapUsers = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (snapUsers.exists()) {
      return snapUsers.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn(`Could not fetch user profile for ${uid}:`, err);
    return null;
  }
}

/**
 * Saves user profile to both /UserProfile and /users for seamless sync.
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `${USER_PROFILE_COLLECTION}/${profile.id}`;
  try {
    await setDoc(doc(db, USER_PROFILE_COLLECTION, profile.id), profile, { merge: true });
    await setDoc(doc(db, USERS_COLLECTION, profile.id), profile, { merge: true });
    if (isAdminRole(profile.role)) {
      await setDoc(doc(db, ADMINS_COLLECTION, profile.id), {
        id: profile.id,
        email: profile.email,
        role: profile.role,
      }, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Synchronizes the logged-in user with Firestore UserProfile collection:
 * - If user email matches SUPER_ADMIN_EMAIL, ensures role is SUPER_ADMIN and records in /admins and /UserProfile.
 * - Otherwise, fetches their existing role from Firestore /UserProfile/{uid}.
 * - If no profile exists yet, registers them as PARENT by default.
 */
export async function syncCurrentUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const isSuperAdminEmail = (user.email || '').toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase();

  const existingProfile = await getUserProfile(user.uid);

  if (isSuperAdminEmail) {
    const adminProfile: UserProfile = {
      id: user.uid,
      email: user.email || SUPER_ADMIN_EMAIL,
      displayName: user.displayName || 'Super Administrator',
      role: 'SUPER_ADMIN',
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
    };

    // Ensure profile is recorded in /UserProfile, /users, and /admins
    await setDoc(doc(db, USER_PROFILE_COLLECTION, user.uid), adminProfile, { merge: true });
    await setDoc(doc(db, USERS_COLLECTION, user.uid), adminProfile, { merge: true });
    await setDoc(doc(db, ADMINS_COLLECTION, user.uid), {
      id: user.uid,
      email: user.email,
      role: 'SUPER_ADMIN',
    }, { merge: true });

    return adminProfile;
  }

  const isStaff = isStaffEmail(user.email);

  if (existingProfile) {
    // If designated as staff but profile is still PARENT, upgrade to ADMIN_STAFF
    if (isStaff && existingProfile.role !== 'ADMIN_STAFF' && !isAdminRole(existingProfile.role)) {
      const updatedProfile: UserProfile = {
        ...existingProfile,
        role: 'ADMIN_STAFF',
        displayName: existingProfile.displayName || 'Admissions Staff (Timon)',
      };
      await setDoc(doc(db, USER_PROFILE_COLLECTION, user.uid), updatedProfile, { merge: true });
      await setDoc(doc(db, USERS_COLLECTION, user.uid), updatedProfile, { merge: true });
      return updatedProfile;
    }

    // If existing role is admin or super admin, make sure admins record is present
    if (isAdminRole(existingProfile.role)) {
      try {
        await setDoc(doc(db, ADMINS_COLLECTION, user.uid), {
          id: user.uid,
          email: user.email || existingProfile.email,
          role: existingProfile.role,
        }, { merge: true });
      } catch {
        // ignore non-fatal
      }
    }
    return existingProfile;
  }

  // New user registration - if designated as Admission Staff, grant ADMIN_STAFF role
  const newProfile: UserProfile = {
    id: user.uid,
    email: user.email || '',
    displayName: user.displayName || (isStaff ? 'Admissions Staff (Timon)' : user.email ? user.email.split('@')[0] : 'Parent User'),
    role: isStaff ? 'ADMIN_STAFF' : 'PARENT',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, USER_PROFILE_COLLECTION, user.uid), newProfile, { merge: true });
  await setDoc(doc(db, USERS_COLLECTION, user.uid), newProfile, { merge: true });
  return newProfile;
}

/**
 * Fetches all user profiles from Firestore (Allowed strictly for Super Admin).
 */
export async function fetchAllUserProfiles(): Promise<UserProfile[]> {
  const path = USER_PROFILE_COLLECTION;
  try {
    const snap = await getDocs(collection(db, USER_PROFILE_COLLECTION));
    const list: UserProfile[] = [];
    snap.forEach((d) => {
      list.push(d.data() as UserProfile);
    });
    if (list.length === 0) {
      // Check secondary users collection
      const snapUsers = await getDocs(collection(db, USERS_COLLECTION));
      snapUsers.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
    }
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

/**
 * Updates a user's role in Firestore. Only authorized for Super Admin.
 */
export async function updateUserRoleInFirestore(uid: string, targetEmail: string, newRole: UserRole): Promise<void> {
  const path = `${USER_PROFILE_COLLECTION}/${uid}`;
  try {
    await updateDoc(doc(db, USER_PROFILE_COLLECTION, uid), { role: newRole });
    try {
      await updateDoc(doc(db, USERS_COLLECTION, uid), { role: newRole });
    } catch {
      // ignore secondary if not exists
    }

    if (isAdminRole(newRole) || newRole === 'ADMIN_STAFF' || newRole === 'REGISTRATION') {
      await setDoc(doc(db, ADMINS_COLLECTION, uid), {
        id: uid,
        email: targetEmail,
        role: newRole,
      }, { merge: true });
    } else {
      // Remove admin record if changed to PARENT
      try {
        await deleteDoc(doc(db, ADMINS_COLLECTION, uid));
      } catch {
        // Ignored if wasn't present
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Application Firestore Operations
// -------------------------------------------------------------

export const APPLICATIONS_COLLECTION = 'applications';
export const LETTERS_COLLECTION = 'letter_requests';

export async function saveApplicationToFirestore(appData: StudentApplication): Promise<void> {
  const path = `${APPLICATIONS_COLLECTION}/${appData.id}`;
  try {
    // Stamp submitting user ID if signed in
    const toSave: StudentApplication = {
      ...appData,
      userId: appData.userId || auth.currentUser?.uid,
    };
    await setDoc(doc(db, APPLICATIONS_COLLECTION, appData.id), toSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteApplicationFromFirestore(appId: string): Promise<void> {
  const path = `${APPLICATIONS_COLLECTION}/${appId}`;
  try {
    await deleteDoc(doc(db, APPLICATIONS_COLLECTION, appId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveLetterRequestToFirestore(req: LetterRequest): Promise<void> {
  const path = `${LETTERS_COLLECTION}/${req.id}`;
  try {
    const toSave = {
      ...req,
      userId: req.userId || auth.currentUser?.uid,
    };
    await setDoc(doc(db, LETTERS_COLLECTION, req.id), toSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to real applications in Firestore based on verified role.
 * - PARENT: Only queries applications belonging to their UID.
 * - STAFF / SUPER ADMIN: Queries all school applications.
 */
export function subscribeToApplications(
  role: UserRole | string,
  onUpdate: (apps: StudentApplication[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const path = APPLICATIONS_COLLECTION;

  const isStaffOrAdmin = isAdminRole(role) || role === 'ADMIN_STAFF' || role === 'REGISTRATION';

  const q = isStaffOrAdmin
    ? collection(db, path)
    : query(collection(db, path), where('userId', '==', auth.currentUser.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: StudentApplication[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as StudentApplication);
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Firestore application listener warning:', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribes to real letter requests in Firestore based on verified role.
 * - PARENT: Only queries letters belonging to their UID.
 * - STAFF / SUPER ADMIN: Queries all student letters.
 */
export function subscribeToLetterRequests(
  role: UserRole | string,
  onUpdate: (letters: LetterRequest[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const path = LETTERS_COLLECTION;

  const isStaffOrAdmin = isAdminRole(role) || role === 'ADMIN_STAFF' || role === 'REGISTRATION';

  const q = isStaffOrAdmin
    ? collection(db, path)
    : query(collection(db, path), where('userId', '==', auth.currentUser.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: LetterRequest[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as LetterRequest);
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Firestore letter listener warning:', error.message);
      if (onError) onError(error);
    }
  );
}
