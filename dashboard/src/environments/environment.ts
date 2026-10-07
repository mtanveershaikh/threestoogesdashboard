import { Environment } from './environment.model';

/** Production build: reads the real database. Fill in `firebase` from the console before deploying. */
export const environment: Environment = {
  dataSource: 'firestore',
  useEmulator: false,
  firebase: {
    apiKey: '',
    authDomain: 'the-three-stooges.firebaseapp.com',
    projectId: 'the-three-stooges',
    storageBucket: 'the-three-stooges.firebasestorage.app',
    messagingSenderId: '',
    appId: '',
  },
  allowedEmail: 'm.tanveer.shaikh@gmail.com',
  telegramUrl: 'https://t.me/',
};
