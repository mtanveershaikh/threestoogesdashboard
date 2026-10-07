import { BASE } from './environment.base';
import { Environment } from './environment.model';

/** `npm start`: sample data from the fixtures, no network, no sign-in. */
export const environment: Environment = { ...BASE, dataSource: 'mock', useEmulator: false };
