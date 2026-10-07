export type DataSource = 'mock' | 'firestore';

export const environment = {
  /** 'mock' serves fixtures and shows the Sample data badge; 'firestore' reads real data. */
  dataSource: 'mock' as DataSource,
  /** Where plan approvals happen. Replace with your bot's chat link, for example https://t.me/<your_bot>. */
  telegramUrl: 'https://t.me/',
};
