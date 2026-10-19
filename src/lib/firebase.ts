import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with custom databaseId if configured and enable robust polling
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });

// Google Sign-In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    return { success: false, error: error.message };
  }
};

// Sign Out
export const logoutFromFirebase = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Sign-out error:', error);
    return { success: false, error: error.message };
  }
};

// Connection Validation Test (as required by Firestore skill)
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connection verified successfully.');
    return true;
  } catch (error: any) {
    if (error?.name === 'AbortError' || (typeof error?.message === 'string' && error.message.includes('aborted'))) {
      // Abort is a normal cancellation on unmount or hot-reload, ignore gracefully
      return false;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore: Client appears to be offline or network is limited.');
    } else {
      console.log('Firestore connection status checked.');
    }
    return false;
  }
}

// Initial connection test on load with unhandled rejection safeguard
if (typeof window !== 'undefined') {
  // Run asynchronously without blocking or throwing uncaught rejection
  setTimeout(() => {
    testFirestoreConnection().catch(() => {});
  }, 500);
}
