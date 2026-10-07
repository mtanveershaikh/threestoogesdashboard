export type DataSource = 'mock' | 'firestore';

export const environment = {
  /** 'mock' serves fixtures and shows the Sample data badge; 'firestore' reads real data. */
  dataSource: 'mock' as DataSource,
};
