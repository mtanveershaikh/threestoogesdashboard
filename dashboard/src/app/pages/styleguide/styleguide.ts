import { Component } from '@angular/core';
import { MOCK_BOTS, MOCK_POSITIONS } from '../../data/mock-fixtures';
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
  imports: [StatTile, VerdictChip, ProgressRow, Avatar, SampleDataBadge, EmptyState, DataTable],
  templateUrl: './styleguide.html',
  styleUrl: './styleguide.scss',
})
export class Styleguide {
  protected readonly bots = MOCK_BOTS;
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
