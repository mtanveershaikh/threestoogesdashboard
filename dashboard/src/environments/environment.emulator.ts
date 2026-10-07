import { environment as production } from './environment';
import { Environment } from './environment.model';

/** `npm run start:emulator`: the real Firestore service against the local emulators, seeded with sample data. */
export const environment: Environment = {
  ...production,
  dataSource: 'firestore',
  useEmulator: true,
  firebase: {
    apiKey: 'demo-key',
    authDomain: 'localhost',
    projectId: 'demo-tradebots',
    storageBucket: '',
    messagingSenderId: '',
    appId: 'demo-app',
  },
};
