import { Environment } from './environment.model';

/** Production build: reads the real database. The web config is public; access is enforced by firestore.rules. */
export const environment: Environment = {
  dataSource: 'firestore',
  useEmulator: false,
  firebase: {
    apiKey: 'AIzaSyCRStPMaUtomkMwHDLMZ7cZRLftXq1Oq1w',
    authDomain: 'the-three-stooges.firebaseapp.com',
    projectId: 'the-three-stooges',
    storageBucket: 'the-three-stooges.firebasestorage.app',
    messagingSenderId: '621130941023',
    appId: '1:621130941023:web:7c6aacd70a9ddb5e2191ea',
  },
  allowedEmails: ['m.tanveer.shaikh@gmail.com'],
  telegramUrl: 'https://t.me/',
};
