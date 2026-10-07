import { BASE } from './environment.base';
import { Environment } from './environment.model';

/** Production build: reads the real database. */
export const environment: Environment = { ...BASE, dataSource: 'firestore', useEmulator: false };
