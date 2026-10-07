export type DataSource = 'mock' | 'firestore';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface Environment {
  /** 'mock' serves fixtures; 'firestore' reads the database (real, or the emulator). */
  dataSource: DataSource;
  /** Talk to the local Firestore and Auth emulators instead of the cloud. Emulator data is sample data. */
  useEmulator: boolean;
  /** Public web config: Firebase console, Project settings, Your apps. Not a secret. */
  firebase: FirebaseWebConfig;
  /** The one account allowed in. The Firestore rules enforce this; the app only uses it to pick a screen. */
  allowedEmail: string;
  /** Where plan approvals happen. Replace with your bot's chat link, for example https://t.me/<your_bot>. */
  telegramUrl: string;
}
