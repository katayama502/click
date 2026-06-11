import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// プレースホルダ(your_api_key_here 等)が残っている場合はFirebase無効としてローカル動作にフォールバック
const isRealValue = (v: string | undefined): boolean =>
  !!v && !/^(your_|REPLACE|xxx)/i.test(v);

export const firebaseEnabled = !!(
  isRealValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
  isRealValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseEnabled && typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
export default app;
