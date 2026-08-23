"use client";

import {
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";

import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";

import {
  getStorage,
} from "firebase/storage";

/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,

  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,

  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,

  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,

  messagingSenderId:
    process.env
      .NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,

  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

/* =========================================================
   INITIALIZE FIREBASE APP
   ========================================================= */

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

/* =========================================================
   INITIALIZE AUTH
   ========================================================= */

let auth: Auth;

if (typeof window !== "undefined") {
  try {
    /*
     * Browser-এর জন্য local persistence।
     *
     * Login session browser-এ থাকবে।
     * Offline অবস্থাতেও cached session ব্যবহার
     * করা সম্ভব হবে।
     */
    auth = initializeAuth(app, {
      persistence:
        browserLocalPersistence,
    });
  } catch {
    /*
     * যদি Auth আগে থেকেই initialize করা থাকে,
     * তাহলে existing Auth instance ব্যবহার করবে।
     */
    auth = getAuth(app);
  }
} else {
  /*
   * Server-side fallback.
   */
  auth = getAuth(app);
}

/* =========================================================
   EXPORT AUTH
   ========================================================= */

export { auth };

/* =========================================================
   FIRESTORE
   ========================================================= */

export const db =
  getFirestore(app);

/* =========================================================
   STORAGE
   ========================================================= */

export const storage =
  getStorage(app);

/* =========================================================
   DEFAULT APP
   ========================================================= */

export default app;