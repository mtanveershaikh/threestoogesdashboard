import { FirebaseWebConfig } from './environment.model';

/**
 * Values every build shares. Edit the Firebase web config, the allow-list and the Telegram link here.
 *
 * Every other environment file imports this one, never `environment.ts`: the build swaps `environment.ts` for the
 * development, demo and emulator files, so a file that imported it would end up importing itself and lose every
 * value it did not set on its own.
 */
export const BASE = {
  /** The web config is public; access is enforced by firestore.rules. */
  firebase: {
    apiKey: 'AIzaSyCRStPMaUtomkMwHDLMZ7cZRLftXq1Oq1w',
    authDomain: 'the-three-stooges.firebaseapp.com',
    projectId: 'the-three-stooges',
    storageBucket: 'the-three-stooges.firebasestorage.app',
    messagingSenderId: '621130941023',
    appId: '1:621130941023:web:7c6aacd70a9ddb5e2191ea',
  } satisfies FirebaseWebConfig,
  /** Keep in step with firestore.rules, which is what actually enforces it. */
  allowedEmails: [
    'm.tanveer.shaikh@gmail.com',
    'gulfam886@gmail.com',
    'er.waseemhyder@gmail.com',
    'wasif.fmukadam@gmail.com',
    'herman.shafiq@gmail.com',
  ],
  /** Where plan approvals happen: the chat with the bot your backend uses. Never put the bot token here. */
  telegramUrl: 'https://t.me/thethreestoogesbot',
};
