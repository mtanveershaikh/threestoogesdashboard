import { environment as production } from './environment';
import { Environment } from './environment.model';

/** `npm start`: sample data from the fixtures, no network, no sign-in. */
export const environment: Environment = { ...production, dataSource: 'mock' };
