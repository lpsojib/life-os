import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User,
} from "firebase/auth";

// import { auth } from "@/lib/firebase";
import { auth } from "../../../lib/firebase";

/**
 * Register with Email & Password
 */
export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<User> => {
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
  const provider = new GoogleAuthProvider();

  const credential = await signInWithPopup(auth, provider);

  return credential.user;
};

/**
 * Logout
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};