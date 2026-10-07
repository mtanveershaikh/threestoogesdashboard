import { Component } from '@angular/core';
import { HistogramBars } from '../../charts/histogram-bars';
import { LineChart, LineSeries } from '../../charts/line-chart';
import { Sparkline } from '../../charts/sparkline';
import { MOCK_BOTS, MOCK_REPORTS, MOCK_ROLLUPS, MOCK_POSITIONS } from '../../data/mock-fixtures';
import { Avatar } from '../../shared/avatar';
import { Column, DataTable } from '../../shared/data-table';
import { EmptyState } from '../../shared/empty-state';
import { arrowOf, signedR, toneOf } from '../../shared/format';
import { ProgressRow } from '../../shared/progress-row';
import { SampleDataBadge } from '../../shared/sample-data-badge';
import { StatTile } from '../../shared/stat-tile';
import { VerdictChip } from '../../shared/verdict-chip';

/** Every shared component with sample inputs. Reached at /styleguide; not in the nav. */
@Component({
  selector: 'app-styleguide',
  imports: [StatTile, VerdictChip, ProgressRow, Avatar, SampleDataBadge, EmptyState, DataTable, LineChart, Sparkline, HistogramBars],
  templateUrl: './styleguide.html',
  styleUrl: './styleguide.scss',
})
export class Styleguide {
  protected readonly bots = MOCK_BOTS;
  protected readonly histogram = MOCK_REPORTS.breakout.rHistogram;
  protected readonly weeks = Array.from({ length: 8 }, (_, i) => `Week ${i + 1}`);
  protected readonly series: LineSeries[] = [
    ...MOCK_BOTS.map((b) => ({ name: b.name.replace(' Bot', ''), color: b.color, values: MOCK_ROLLUPS.map((r) => r.botReturnPct[b.id]) })),
    { name: 'Total', color: 'var(--text)', width: 2.75, values: MOCK_ROLLUPS.map((r) => r.totalReturnPct) },
    { name: 'Backtest', color: 'var(--text-muted)', dashed: true, values: MOCK_REPORTS.breakout.backtestReturnPct },
  ];
  protected readonly sparkValues = (id: string) => MOCK_ROLLUPS.map((r) => r.botReturnPct[id as 'breakout']);
  protected readonly columns: Column[] = [
    { key: 'symbol', label: 'Stock', mono: true },
    { key: 'bot', label: 'Bot' },
    { key: 'entry', label: 'Entry', align: 'right', mono: true },
    { key: 'last', label: 'Last', align: 'right', mono: true },
    { key: 'result', label: 'Result', align: 'right', mono: true },
  ];
  protected readonly rows = MOCK_POSITIONS.map((p) => ({
    symbol: p.symbol,
    bot: MOCK_BOTS.find((b) => b.id === p.botId)?.name,
    entry: p.entry.toFixed(2),
    last: p.last.toFixed(2),
    resultNum: p.rMultiple,
    result: `${arrowOf(p.rMultiple)} ${signedR(p.rMultiple)}`.trim(),
  }));
  protected readonly toneOf = toneOf;
}
