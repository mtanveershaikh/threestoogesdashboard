# Dashboard design (Angular)

Companion to `DESIGN.md`. This file covers the web dashboard only: what it shows, where the data comes from, and how it is built. Task list: `DASHBOARD-TASKS.md`. Visual reference: `docs/mockups/` (two `.dc.html` screens built with sample data).

## 1. Purpose and scope

The dashboard is where you review how the three bots are doing: equity, risk, each bot's results, open positions and closed trades. It never places or approves trades.

Version 1 is read-only. Approvals stay in Telegram (the plan-approval flow in `DESIGN.md` section 10). The mockup shows Approve, Reject and Pause buttons; in version 1 these become read-only cards with an "Approve in Telegram" link. Writing from the web is a later decision because it adds a second path that can move money.

## 2. Repo layout (one repo, two apps)

Use one git repo with a separate folder per app. Python and Angular have different toolchains, so they never share a folder, but they share the Firestore schema, the docs and the Firebase config.

```
tradebots/
  bot/                    Python 3.12 app (src/tradebots, tests, pyproject.toml)
  dashboard/              Angular app (this file)
  docs/                   DESIGN.md, TASKS.md, DASHBOARD-DESIGN.md, DASHBOARD-TASKS.md
    mockups/              Main.dc.html, BotDetail.dc.html (visual reference)
  scripts/                check_prereqs.sh and smoke scripts
  firebase.json           Hosting (dashboard/dist/...) and Firestore emulator config
  firestore.rules         shared rules, owner-only
  firestore.indexes.json
  .firebaserc
  .claude/skills/         frontend-design skill (see SKILLS-SETUP.md)
  CLAUDE.md               root instructions for Claude Code
  .github/workflows/      bot.yml and dashboard.yml (separate CI per app)
```

`TASKS.md` task S0-1 assumed the Python project at the repo root; place it in `bot/` instead. Everything else in that file still applies.

## 3. Stack decisions

| Area | Choice | Why |
| --- | --- | --- |
| Framework | Current Angular, standalone components, signals, built-in control flow | No NgModules; simple reactive state |
| Styling | SCSS with CSS custom properties from the tokens below | Matches the mockup; no UI library to fight |
| Charts | Small hand-written SVG components (line, bars, sparkline, progress) | The data is tiny and the mockup is already SVG |
| Data | `@angular/fire` reading Firestore | Same database as the bots |
| Auth | Firebase Auth, Google sign-in, one allowed account | Single user; rules enforce it |
| Hosting | Firebase Hosting | Same project, free tier |
| Tests | The default Angular test runner, plus Firestore emulator tests for rules | Keep tooling default |

## 4. Design tokens (from the mockup)

| Token | Value |
| --- | --- |
| Page background | `#0D1117` |
| Card background / border | `#151B23` / `#232C38` |
| Inset background | `#0F141B` |
| Text / muted text | `#E8ECF1` / `#9AA6B5` |
| Gain / loss | `#43D9A0` / `#FF7A7A` |
| Warning | `#F2B84B` |
| Bot colors | Breakout `#F2B84B`, Pullback `#5BB8FF`, Reversion `#B49CFF` |
| Fonts | Space Grotesk (headings, large numbers), IBM Plex Sans (body), IBM Plex Mono (figures) |
| Radius | 12px cards, 8px buttons and chips, 999px pills |
| Page width | 1280px maximum, 32px side padding |

Rules: never show gain or loss by color alone (always a sign or a word); body text at least 13px, labels at least 11px; touch targets at least 44px; every page works at phone width (cards stack, tables scroll inside their own box).

## 5. Screens

1. **Overview** (`/`): equity, today's result, open risk against the limit, trades today against the cap, kill switch status; return-since-start line chart; plans awaiting approval (read-only); three bot cards; open positions; recently closed trades.
2. **Bot report** (`/bots/:id`): header with avatar, status and budget; KPI tiles (return, average R, win rate, profit factor, max drawdown); paper against backtest chart; R-result histogram; go-live checklist; results by setup; recent trades with both analyst verdicts.
3. **Later:** Trades list with filters, Reports (weekly and monthly), Settings (read-only view of config), and a phone-first approvals view.

## 6. Components

Shell (header, nav, status chips), StatTile, BotCard, PlanCard, LineChart, Sparkline, HistogramBars, ProgressRow (for risk meters and checklist), DataTable, VerdictChip, Avatar (image or dashed placeholder), SampleDataBadge, StaleDataBanner, EmptyState.

## 7. Data contract

The dashboard reads documents the bots already write. Names below are proposed; reconcile them with `DESIGN.md` section 12 at task D1 and keep one source of truth in `dashboard/src/app/data/models.ts`.

| Collection / document | Used for | Read style |
| --- | --- | --- |
| `system/status` | Equity, day result, open risk, trades today, kill switch, last heartbeat | One document, live listener |
| `daily_rollups/{yyyy-mm-dd}` | Return chart, per-bot daily equity, weekly results | One-shot query, last 60 days |
| `bots/{botId}` | Name, strategy, budget, status, avatar URL, headline stats | One-shot |
| `plans` where status is PROPOSED or ARMED | Awaiting-approval cards | One-shot, refresh every 60 s |
| `positions` where open | Open positions table | One-shot, refresh every 60 s |
| `trades` ordered by close time, limit 20 | Recent trades, with analyst verdicts | One-shot |
| `setup_stats/{botId}_{setupId}` | Results by setup, memory-screen state | One-shot |

Read budget: the free Spark plan allows 50,000 reads a day. Use one-shot reads and a 60-second refresh, and a single listener on `system/status` only. Never listen to `trades` or `plans`.

Staleness: if `system/status.lastHeartbeat` is older than 10 minutes during market hours, show the stale-data banner.

## 8. Mock data mode

Build the UI before the bots exist. Define a `DataService` interface and two implementations: `MockDataService` (JSON fixtures that match the contract exactly, taken from the mockup numbers) and `FirestoreDataService`. A flag in `environment.ts` picks one. In mock mode, always show the Sample data badge so sample numbers are never mistaken for results.

## 9. Auth and rules

Sign in with Google. Firestore rules allow read only for your own account and deny all writes from the web app. The bots write with a service account, which bypasses rules.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /{doc=**} {
      allow read: if request.auth != null
                  && request.auth.token.email == '<YOUR_EMAIL>';
      allow write: if false;
    }
  }
}
```

Test these rules in the emulator: signed out is denied, another account is denied, your account can read, nobody can write.

## 10. Avatars

Each bot has an `avatarUrl` on its `bots/{botId}` document. When it is empty, show the dashed circle placeholder in the bot's color. Your picks go in `dashboard/src/assets/avatars/` (or Firebase Storage later) and are referenced by name; no code change needed.

## 11. Definition of done for any screen

Matches the mockup at 1360px and at 390px; works with mock data and with the emulator; loading, empty and error states exist; no console errors; keyboard reachable; contrast checked; a component test for each reusable component.
