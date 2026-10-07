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
  /** Accounts allowed in. Keep in step with firestore.rules, which is what actually enforces it; the app only uses this to pick a screen. */
  allowedEmails: string[];
  /** Where plan approvals happen. Replace with your bot's chat link, for example https://t.me/<your_bot>. */
  telegramUrl: string;
}
