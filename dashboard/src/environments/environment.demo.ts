import { BASE } from './environment.base';
import { Environment } from './environment.model';

/** The public demo site: sample data only, no database and no sign-in. Never reads the real Firestore. */
export const environment: Environment = { ...BASE, dataSource: 'mock', useEmulator: false };
