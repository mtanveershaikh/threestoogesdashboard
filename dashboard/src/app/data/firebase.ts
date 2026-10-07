import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

function firebaseApp(): FirebaseApp {
  if (!app) {
    if (!environment.firebase.apiKey) {
      throw new Error('Firebase web config is empty. Fill in `firebase` in src/environments/environment.ts (Firebase console, Project settings, Your apps).');
    }
    app = getApps()[0] ?? initializeApp(environment.firebase);
  }
  return app;
}

export function firestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(firebaseApp());
    if (environment.useEmulator) connectFirestoreEmulator(db, 'localhost', 8080);
  }
  return db;
}

export function firebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(firebaseApp());
    if (environment.useEmulator) connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  }
  return auth;
}
