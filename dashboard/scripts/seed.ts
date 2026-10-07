import { Firestore, doc, writeBatch } from 'firebase/firestore';
import {
  MOCK_BOTS, MOCK_PLANS, MOCK_POSITIONS, MOCK_REPORTS, MOCK_ROLLUPS, MOCK_SETUPS, MOCK_STATUS, MOCK_TRADES,
} from '../src/app/data/mock-fixtures';

/** Writes the mock fixtures into Firestore using the collection names from the data contract. */
export async function seedFirestore(db: Firestore): Promise<void> {
  const batch = writeBatch(db);
  const put = (path: string, data: object) => batch.set(doc(db, path), data);

  put('system/status', MOCK_STATUS);
  for (const b of MOCK_BOTS) put(`bots/${b.id}`, b);
  for (const r of MOCK_ROLLUPS) put(`daily_rollups/${r.date}`, r);
  for (const p of MOCK_PLANS) put(`plans/${p.id}`, p);
  for (const p of MOCK_POSITIONS) put(`positions/${p.id}`, { ...p, open: true });
  for (const t of MOCK_TRADES) put(`trades/${t.id}`, t);
  for (const s of MOCK_SETUPS) put(`setup_stats/${s.id}`, s);
  for (const [id, report] of Object.entries(MOCK_REPORTS)) put(`bot_reports/${id}`, report);

  await batch.commit();
}
