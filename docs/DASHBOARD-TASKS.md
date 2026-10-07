# Dashboard tasks (Angular)

Stages D0 to D9. Each stage ends with something you can open in the browser. Read `DASHBOARD-DESIGN.md` first. Work in `dashboard/` and keep the bots untouched.

Dependency sketch: D0 -> D1 -> D2 -> D3 -> D4 -> D5 -> D6 -> D7 -> D8. D9 is later.

Rough effort: D0 0.5d, D1 1d, D2 1-2d, D3 1-2d, D4 2d, D5 2d, D6 1-2d, D7 1-2d, D8 1d. About 10 to 14 focused days.

## D0: Setup (0.5d)

- [x] D0-1 Run `scripts/check_prereqs.sh`; install Node and the Angular CLI (`npm install -g @angular/cli`).
- [x] D0-2 Add the `frontend-design` skill to the repo (see `SKILLS-SETUP.md`); confirm Claude Code lists it.
- [x] D0-3 Create the app: `ng new dashboard` inside the repo (standalone, SCSS, no SSR).
- [x] D0-4 Copy the two mockup files into `docs/mockups/` and `DASHBOARD-DESIGN.md` into `docs/`.
- [x] D0-5 Add `dashboard/CLAUDE.md` (provided) and a `dashboard.yml` CI workflow: install, lint, test, build.
- [x] D0-6 `firebase init` for Hosting and the Firestore emulator at the repo root; hosting folder is the Angular build output.

Done when: `ng serve` shows the starter page and CI is green.

## D1: Data contract and mock data (1d)

- [x] D1-1 Reconcile collection and field names with `DESIGN.md` section 12; write `models.ts` (TypeScript interfaces).
- [x] D1-2 `DataService` interface and `MockDataService` with fixtures that match the mockup numbers.
- [x] D1-3 Environment flag to choose mock or Firestore; Sample data badge shown in mock mode.
- [x] D1-4 Unit tests for fixtures (types, sums add up: bot returns match the total).

## D2: Design system (1-2d)

- [x] D2-1 Tokens as CSS custom properties in `styles.scss`; load the three fonts.
- [x] D2-2 App shell: header, nav links, status chips, avatar slot for the signed-in user.
- [x] D2-3 Components: StatTile, VerdictChip, DataTable, ProgressRow, Avatar, SampleDataBadge, EmptyState.
- [x] D2-4 A hidden `/styleguide` route that shows every component with sample inputs.

## D3: Charts (1-2d)

- [x] D3-1 LineChart (multi-series, dashed baseline, optional dashed second line, axis labels, accessible label).
- [x] D3-2 Sparkline and HistogramBars.
- [x] D3-3 Tests: points map to the right coordinates; empty data renders an empty state.

## D4: Overview page (2d)

- [x] D4-1 KPI row (equity, today, open risk meter, trades-today meter, kill switch).
- [x] D4-2 Return-since-start chart with legend.
- [x] D4-3 Awaiting-approval cards, read-only, with SPLIT VERDICT flag and an "Approve in Telegram" link.
- [x] D4-4 Three BotCards with sparklines and link to the bot report.
- [x] D4-5 Open positions and recently closed tables.

## D5: Bot report page (2d)

- [x] D5-1 Header with avatar, status and budget; five KPI tiles.
- [x] D5-2 Paper against backtest chart; R-result histogram.
- [x] D5-3 Go-live checklist driven by the acceptance gates in config, with the verdict box.
- [x] D5-4 Results by setup table; recent trades with both analyst verdicts.

## D6: Real data, auth and rules (1-2d)

- [x] D6-1 `FirestoreDataService` with one-shot reads, 60-second refresh and one listener on `system/status`.
- [x] D6-2 Google sign-in guard and a signed-out page.
- [x] D6-3 `firestore.rules` (owner-only read, no web writes) and emulator tests for the four cases.
- [x] D6-4 Seed the emulator with the mock fixtures so the real service can be tried end to end.

## D7: Polish (1-2d)

- [x] D7-1 Responsive pass at 1360, 768 and 390; tables scroll inside their own box.
- [x] D7-2 Loading, empty and error states on every page; stale-data banner from the heartbeat.
- [x] D7-3 Accessibility pass: keyboard order, labels on icon-only controls, contrast.
- [x] D7-4 Your avatar pictures wired in through `avatarUrl`.

## D8: Deploy (1d)

- [ ] D8-1 `ng build` production; deploy to Firebase Hosting; confirm sign-in on the live URL.
- [ ] D8-2 CI deploy on merge to main (preview channel for pull requests).
- [ ] D8-3 Check the day's read count in the Firebase console stays well under 50,000.

## D9: Later

- [ ] D9-1 Trades list with filters; weekly and monthly report pages.
- [ ] D9-2 Read-only Settings page showing the live config.
- [ ] D9-3 Phone-first approvals view (decide first whether web approvals are allowed at all).
- [ ] D9-4 Optional: pause or halt from the web through a guarded control document the bots poll.
