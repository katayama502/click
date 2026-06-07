import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseEnabled } from '../firebase';

type UserInfo = {
  uid: string;
  email: string;
  displayName: string | null;
};

function toUserInfo(user: { uid: string; email: string | null; displayName: string | null }): UserInfo {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName,
  };
}

export async function fbSignIn(
  email: string,
  password: string
): Promise<UserInfo | null> {
  if (!firebaseEnabled || !auth) return null;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return toUserInfo(credential.user);
}

export async function fbSignUp(
  email: string,
  password: string,
  displayName: string
): Promise<UserInfo | null> {
  if (!firebaseEnabled || !auth) return null;
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  return toUserInfo({ ...credential.user, displayName });
}

export async function fbSignInGoogle(): Promise<UserInfo | null> {
  if (!firebaseEnabled || !auth) return null;
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  return toUserInfo(credential.user);
}

export async function fbSignOut(): Promise<void> {
  if (!firebaseEnabled || !auth) return;
  await signOut(auth);
}

export function fbOnAuthChange(
  callback: (user: UserInfo | null) => void
): () => void {
  if (!firebaseEnabled || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    callback(user ? toUserInfo(user) : null);
  });
}
