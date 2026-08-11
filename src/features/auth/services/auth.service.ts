import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";

import { auth } from "../../../lib/firebase";

/**
 * Keep Firebase login session in the browser.
 *
 * User will remain logged in after:
 * - Page refresh
 * - Browser close/reopen
 * - Development server restart
 *
 * User will be logged out only after explicitly calling logoutUser().
 */
const enableAuthPersistence = async (): Promise<void> => {
  await setPersistence(auth, browserLocalPersistence);
};

/**
 * Register with Email & Password
 */
export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<User> => {
  await enableAuthPersistence();

  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await updateProfile(credential.user, {
    displayName: name,
  });

  return credential.user;
};

/**
 * Login with Email & Password
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  await enableAuthPersistence();

  const credential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return credential.user;
};

/**
 * Login with Google
 */
export const loginWithGoogle = async (): Promise<User> => {
  await enableAuthPersistence();

  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(
    auth,
    provider
  );

  return result.user;
};

/**
 * Logout
 *
 * The user will be logged out only when
 * this function is called.
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};