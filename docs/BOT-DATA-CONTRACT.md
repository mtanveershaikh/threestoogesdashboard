# What the bots must write to Firestore

The dashboard only reads. This is everything it expects to find, so you can configure the bots to write it. The TypeScript source of truth is `dashboard/src/app/data/models.ts`; if this file and that one ever disagree, the code wins and this file is wrong.

Project: `the-three-stooges`, default database. The bots write with the Admin SDK (a service account), which bypasses the security rules. The dashboard reads with the signed-in user's account.

## Rules for every document

- Field names are exactly as written below, camelCase, case-sensitive.
- **Percent** values are plain numbers: `4.2` means 4.2%, `-1.8` means minus 1.8%. Never `0.042`.
- **R multiples** are plain numbers: `0.21` means +0.21R.
- **Money** is a number in US dollars (`5127`, not `"$5,127"`).
- **Dates** are `yyyy-mm-dd` strings in US market (New York) time.
- **Timestamps** are ISO 8601 strings in UTC, for example `"2026-10-07T12:00:00Z"`.
- Never write `undefined` or `NaN`. Leave an optional field out instead.
- Bot ids are lowercase and fixed: `breakout`, `pullback`, `reversion`. They are document ids, in URLs, and in every `botId` field.
- Do not write to a document the dashboard does not list here. Extra fields are ignored, but a wrong type on a listed field breaks a page.

## Collections

| Path | One document per | Written when | Needed for |
| --- | --- | --- | --- |
| `system/status` | the whole system (single doc) | every minute, or on every change | Overview tiles, stale-data banner |
| `system/config` | the whole system (single doc) | on every config change | Settings page (new) |
| `bots/{botId}` | bot | after every closed trade, and on status change | bot cards, report headers and KPIs |
| `daily_rollups/{yyyy-mm-dd}` | trading day | at the close, and updated through the day | return chart |
| `plans/{planId}` | proposed trade | on create and on every status change | "Awaiting your approval" |
| `positions/{positionId}` | open or closed position | on open, on update, on close | open positions table |
| `trades/{tradeId}` | closed trade | when a trade closes | recent trades, Trades page (new) |
| `setup_stats/{botId}_{setupId}` | setup | after each trade of that setup | "Results by setup" |
| `bot_reports/{botId}` | bot | after each backtest run and after each trade | go-live checklist, backtest card |

Plan and position documents: remove or change `status` when they are finished. The dashboard shows only plans with `status` `PROPOSED` or `ARMED`, and only positions with `open: true`.

### `system/status`

```json
{
  "mode": "paper",
  "week": 8,
  "startingCapital": 5000,
  "equity": 5127,
  "returnSinceStartPct": 2.5,
  "todayPnl": 14,
  "todayPct": 0.3,
  "openRiskPct": 2.1,
  "openRiskLimitPct": 4,
  "tradesToday": 2,
  "tradeCap": 10,
  "killSwitch": { "state": "ARMED", "drawdownPct": -1.8, "limitPct": -10 },
  "lastHeartbeat": "2026-10-07T12:00:00Z"
}
```

`mode` is `paper` or `live` today (see "Backtest-only bots" below). `killSwitch.state` is `ARMED` or `TRIPPED`. `lastHeartbeat` must move forward every minute or so: if it is more than 10 minutes old during US market hours, the dashboard shows a "data may be out of date" warning.

### `system/config` (new, read-only Settings page)

Publish the config the bots are actually running, so the Settings page shows facts and not a copy that can drift. The dashboard shows exactly what is here and nothing else, so leave out anything you do not want to show.

```json
{
  "configVersion": "9f3c2a1",
  "updatedAt": "2026-10-07T12:00:00Z",
  "mode": "paper",
  "startingCapital": 4000,
  "limits": {
    "riskPerTradePct": 1,
    "openRiskLimitPct": 4,
    "tradeCapPerDay": 10,
    "dailyLossLimitPct": 2,
    "killSwitchDrawdownPct": -10
  },
  "costs": { "costR": 0.03 },
  "goLiveGates": {
    "minClosedTrades": 100,
    "minAvgR": 0.15,
    "minProfitFactor": 1.3,
    "maxDrawdownPct": 20,
    "minProfitableWeeksPct": 60,
    "maxPaperBacktestGapR": 0.15
  },
  "strategies": [
    {
      "id": "breakout_v1",
      "botId": "breakout",
      "bot": "wasif",
      "status": "backtest_only",
      "universe": "nasdaq100",
      "budgetUsd": 1000,
      "rewardToRisk": 3,
      "timeStopDays": 10,
      "params": { "high_lookback": 55, "volume_ratio": 1.5, "trend_sma": 200, "stop_atr": 1.5, "breakeven_at_r": 1.0 }
    },
    {
      "id": "pullback_v1",
      "botId": "pullback",
      "bot": "waseem",
      "status": "backtest_only",
      "universe": "nyse_top300",
      "budgetUsd": 1500,
      "rewardToRisk": 3,
      "timeStopDays": 15,
      "params": { "fast_sma": 50, "slow_sma": 200, "rsi_len": 14, "rsi_dip": 45, "stop_atr": 1.5, "breakeven_at_r": 1.0 }
    },
    {
      "id": "meanrev_v1",
      "botId": "reversion",
      "bot": "nawaz",
      "status": "backtest_only",
      "universe": "both",
      "budgetUsd": 1500,
      "rewardToRisk": 2,
      "timeStopDays": 5,
      "params": { "rsi_len": 2, "rsi_max": 10, "trend_sma": 200, "stop_atr": 2.0 }
    }
  ]
}
```

Notes:

- `strategies` is your YAML, one entry per strategy. Keep your own names inside `params`; the page shows them as they are. `botId` is the new field that ties a strategy to the dashboard's fixed bot ids (`breakout`, `pullback`, `reversion`).
- `strategies[].status` is one of `backtest_only`, `paper`, `live`, `paused`.
- `strategies[].universe` can be your config names (`nasdaq100`, `nyse_top300`, `both`); the page writes them out as words.
- `goLiveGates` holds the thresholds the go-live checklist is measured against. The checklist's "at least 1.3" wording should come from these numbers, not be typed twice.
- `limits.openRiskLimitPct`, `limits.tradeCapPerDay` and `limits.killSwitchDrawdownPct` must agree with `system/status` (`openRiskLimitPct`, `tradeCap`, `killSwitch.limitPct`).
- The sum of the strategy budgets should equal `startingCapital` (4,000 for your three: 1,000 + 1,500 + 1,500).
- Do not put secrets, API keys or account numbers anywhere in this document. Every allowed viewer can read all of it.

### `bots/{botId}`

```json
{
  "name": "Wasif",
  "strategy": "Breakout momentum",
  "color": "#F2B84B",
  "budget": 1000,
  "status": "ACTIVE",
  "avatarUrl": "avatars/breakout.svg",
  "returnPct": 4.2,
  "winRatePct": 30,
  "avgR": 0.21,
  "profitFactor": 1.3,
  "tradeCount": 20,
  "openCount": 1,
  "targetRR": 3,
  "maxDrawdownPct": 6.1,
  "universe": "Nasdaq 100",
  "timeStopDays": 10,
  "avgHoldDays": 4.8
}
```

`status` is `ACTIVE`, `PAUSED` or `HALTED`. `color`: use `#F2B84B` (breakout), `#5BB8FF` (pullback), `#B49CFF` (reversion). `avatarUrl` is optional. `maxDrawdownPct` is positive. `budget` must match the strategy's `budgetUsd` in `system/config`.

### `daily_rollups/{yyyy-mm-dd}`

```json
{
  "date": "2026-10-07",
  "equity": 5127.25,
  "totalReturnPct": 2.55,
  "botReturnPct": { "breakout": 4.2, "pullback": 2.9, "reversion": -0.6 }
}
```

Return is cumulative since the start, in percent of that bot's own budget (and of total capital for `totalReturnPct`). One document per trading day; the dashboard reads the latest 60.

### `plans/{planId}`

```json
{
  "symbol": "ORNX", "botId": "breakout", "status": "PROPOSED",
  "entry": 48.2, "stop": 45.9, "target": 55.1, "rewardToRisk": 3,
  "fundamental": { "verdict": "BUY", "score": 74 },
  "technical": { "verdict": "BUY", "score": 68 },
  "splitVerdict": false,
  "note": "55-day high on 1.9x volume",
  "shares": 8, "positionUsd": 386
}
```

`status` is `PROPOSED` or `ARMED`. `verdict` is `BUY`, `HOLD` or `AVOID`. `splitVerdict` is `true` when the two analysts disagree.

### `positions/{positionId}`

```json
{ "symbol": "TMPL", "botId": "pullback", "entry": 112.4, "last": 118.05, "stop": 108.2, "rMultiple": 1.3, "open": true }
```

`open` must be `true` for an open position and `false` (or the document removed) once closed. `rMultiple` is the open result so far.

### `trades/{tradeId}`

```json
{
  "closedAt": "2026-10-06", "symbol": "DRFT", "botId": "breakout",
  "exitReason": "TARGET", "rMultiple": 3.0, "pnlUsd": 60,
  "fundamental": { "verdict": "BUY", "score": 71 },
  "technical": { "verdict": "BUY", "score": 66 }
}
```

`exitReason` is `TARGET`, `STOP`, `TIME_STOP` or `BREAKEVEN_STOP`. `fundamental` and `technical` are optional. `rMultiple` and `pnlUsd` are after costs and slippage.

### `setup_stats/{botId}_{setupId}`

```json
{ "botId": "breakout", "name": "55-day high, volume above 1.5x", "trades": 9, "winRatePct": 44, "avgR": 0.6, "state": "ACTIVE" }
```

`state` is `ACTIVE` or `WATCHING`. While `WATCHING`, add `"tradesToGo": 9`.

### `bot_reports/{botId}`

```json
{
  "botId": "breakout",
  "gates": [
    { "id": "avg-r", "name": "Average per trade", "rule": "at least +0.15R",
      "status": "MET", "result": "+0.21R", "progressPct": 100, "detail": "After costs and slippage." }
  ],
  "rHistogram": [ { "label": "-1", "count": 10 }, { "label": "-0.5", "count": 2 }, { "label": "0", "count": 2 },
                  { "label": "+0.5", "count": 0 }, { "label": "+1", "count": 1 }, { "label": "+2", "count": 1 }, { "label": "+3", "count": 4 } ],
  "backtestReturnPct": [0.0, 0.4, 0.9],
  "backtest": {
    "periodStart": "2026-08-13", "periodEnd": "2026-10-07", "trades": 42, "winRatePct": 36, "avgR": 0.28,
    "profitFactor": 1.5, "maxDrawdownPct": 3.1, "avgHoldDays": 4.4, "returnPct": 11.8, "costR": 0.03
  }
}
```

- `gates[].status` is `MET`, `PENDING` or `FAILED`. `result` is text without the "Met" word (`"+0.21R"`, `"20 of 100"`); the dashboard adds the word. `progressPct` is 0 to 100.
- Write one gate per `goLiveGates` entry, in this order: closed trades, average per trade, profit factor, largest drawdown, profitable weeks, paper close to backtest.
- `backtestReturnPct` has one number per `daily_rollups` day in the window, in order.
- `backtest` and `backtestReturnPct` are the output of the backtest harness. The dashboard shows them next to the paper results.

## Backtest-only bots

Your config marks all three strategies `backtest_only`: there are no paper trades yet. The dashboard today assumes a paper run. These are the values the bots should write now, and what the dashboard does with them:

| Where | Today | Backtest-only |
| --- | --- | --- |
| `system/status.mode` | `paper` or `live` | also `backtest` |
| `bots/{id}.status` | `ACTIVE`, `PAUSED`, `HALTED` | also `BACKTEST_ONLY` |
| `daily_rollups`, `trades`, `positions`, `plans` | paper results | leave empty until paper trading starts |
| `bot_reports/{id}` | gates and backtest | write `backtest` and `backtestReturnPct` now; gates say `PENDING` |

The dashboard now understands this (D10-9). To see what it looks like with sample data, open the demo or `npm start` with `?scenario=backtest` on the address, for example `http://localhost:4200/?scenario=backtest`.

## Smallest set that shows something

1. `system/status`
2. `bots/breakout`, `bots/pullback`, `bots/reversion`
3. `daily_rollups` for at least a few days
4. `bot_reports/{botId}` with `backtest`

Everything else degrades to a clear "nothing here yet" message.

## How to check what you wrote

- Open the Firestore Data page in the Firebase console and compare each document with the examples above.
- Open https://the-three-stooges.web.app and sign in. A wrong or missing field shows as an empty section or a plain error message.
- Production needs the trades index (`botId` ascending, `closedAt` descending) from `firestore.indexes.json`. It is already deployed.
