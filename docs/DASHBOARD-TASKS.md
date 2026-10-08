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

- [x] D8-1 `ng build` production; deploy to Firebase Hosting; confirm sign-in on the live URL. (Live at https://the-three-stooges.web.app; sign-in confirmed by the owner.)
- [x] D8-2 CI deploy on merge to main (preview channel for pull requests). (First live deploy from CI succeeded on the merge of PR #2.)
- [ ] D8-3 Check the day's read count in the Firebase console stays well under 50,000.

## D9: Later

- [x] D9-1 Trades list with filters; weekly and monthly report pages. (Done as D10-4 and D10-5.)
- [x] D9-2 Read-only Settings page showing the live config. (Done as D10-7.)
- [x] D9-5 Audit view: timeline of audit events for a plan or trade, filter by action, paged reads, links from the trade journal. (Built on `develop` at `/audit`; tested locally, not deployed.)
- [ ] D9-3 Phone-first approvals view (decide first whether web approvals are allowed at all).
- [ ] D9-4 Optional: pause or halt from the web through a guarded control document the bots poll.

## D10: Features the mockups show that are not built yet (about 5 days) (all done; merged to `main` and deployed on 7 October 2026)

Found by rendering the two mockups next to the app on 7 October 2026. Look and feel was judged fine; these are missing features. Work in this order. Each page ships with unit tests, a demo-build entry in `e2e/smoke.mjs`, and sample data in the mock service. All of it stays read-only.

Dependency sketch: D10-1 to D10-3 are independent. D10-4 to D10-6 each need the Trades or Rollups queries. D10-7 needs your bots to publish a config document. D10-8 comes last, as each page appears.

### Quick wins (about 1 day)

- [x] D10-1 "8 weeks / All time" toggle on the Overview. Default stays the last 8 weeks; "All time" fetches every rollup once, on click, and refreshes slowly. The chart axis labels switch from weeks to months when the range is long. Done when: both ranges render from mock data, the toggle is keyboard-operable and announces the current choice, and a test shows "All time" is not fetched until clicked (read budget).
- [x] D10-2 Download report on the bot page. A button that saves a CSV made in the browser: bot stats, paper against backtest, go-live gates and recent trades. No server call and no write. Done when: the file opens in a spreadsheet, numbers carry their signs, and a test checks the CSV content for each bot.
- [x] D10-3 Caption under the R histogram, written from the data (for example "Most trades lose 1R. A few reach 3R and pay for the rest."). Done when: the sentence follows the data (most common result, share of trades at the target) and an empty histogram shows no caption.

### New pages (about 3.5 days)

- [x] D10-4 Trades page at `/trades`. Every closed trade, newest first, with filters for bot, win or loss, exit type, date range and stock search, a result summary for the filtered set, and a CSV download. Paged reads, never a listener. Done when: filters combine, the URL keeps the filter state so a view can be shared, and the page has loading, empty and error states.
- [x] D10-5 Reports page at `/reports`. Weekly and monthly summaries computed from rollups and trades: return, trades, win rate, average R, best and worst bot. Done when: totals match the Overview for the same period (test), and the period picker works with the keyboard.
- [x] D10-6 Per-bot trades link: "See all trades" on each bot report opens `/trades` filtered to that bot.
- [x] D10-7 Settings page at `/settings`, read-only: limits, go-live gates, costs and each strategy's budget, universe, reward to risk, time stop and parameters. The bots publish `system/config`, whose format is in `docs/BOT-DATA-CONTRACT.md`. Add `SystemConfig` to `models.ts`, `DataService` and the mock fixtures first. Done when: the page shows only what the document holds, says when the document is missing, secrets can never appear (the contract forbids them), and nothing on it is editable.
- [x] D10-9 Understand backtest-only bots. Add `backtest` to the system mode and `BACKTEST_ONLY` to the bot status; show "Backtest only" instead of "Active" and "Paper trading"; hide the paper sections and show the backtest summary and curve when a bot has no paper trades yet. Done when: a bot with a backtest and no paper trades has a complete, honest page (test with a new mock bot state), and the Overview explains that paper trading has not started. See "Backtest-only bots" in `docs/BOT-DATA-CONTRACT.md`. (Done. Try it locally or on the demo with `?scenario=backtest`, for example https://the-three-stooges-demo.web.app/?scenario=backtest once the demo is redeployed.)
- [x] D10-10 (added later) Pagination on the Trades page: 25 rows a page by default (10, 25, 50 or 100), Previous and Next, numbered pages with gaps for long lists, and the page and size kept in the address. The summary and the CSV still cover every matching trade, a new filter goes back to page 1, and a page past the end shows the last page. Merged to `main` and deployed on 7 October 2026 (PR #4).
- [x] D10-8 Add Trades, Reports and Settings to the main nav, one at a time as each page ships, with `aria-current` on the active link. Done when: the nav matches the mockup and the keyboard order test in `e2e/smoke.mjs` still passes.

### Decided against (not tasks)

- Approve plan and Reject buttons: replaced by the "Approve in Telegram" link. See D9-3 if this is ever revisited.
- Pause bot button: it would write to the database. See D9-4.

## Open items (as of 7 October 2026)

What is still outstanding after D0 to D8. Items marked "owner" need you; the rest I can do.

### Before the data is real

- [ ] O-1 Configure the bots to write what the dashboard reads (full format in `docs/BOT-DATA-CONTRACT.md`): `system/status`, `bots/{id}`, `daily_rollups/{date}`, `plans`, `positions` (with `open: true`), `trades`, `setup_stats`, and `bot_reports/{id}`. The last one is new and was proposed by the dashboard; nothing writes it yet. (owner, with the bots)
- [ ] O-2 Reconcile field names with the bots' real documents. D1-1 was done against section 7 of the design doc; `DESIGN.md` section 12 is not in this repo, so the match is unverified. Bot document ids must be `breakout`, `pullback` and `reversion`, or the ids in the dashboard change.
- [ ] O-3 Open the live site as each of the five accounts and confirm the data loads (the empty states and error messages were tested, but only the owner has signed in). (owner and friends)
- [x] O-4 Replace the Telegram placeholder: `telegramUrl` in `dashboard/src/environments/environment.ts` was `https://t.me/` and is now `https://t.me/thethreestoogesbot` (in `environment.base.ts`). (Done; deployed on 7 October 2026, PR #5.) (owner: send the bot link)
- [ ] O-5 Check the day's real Firestore read count after a full day of use (this is D8-3). Estimate is about 30,000 against a 50,000 limit; if it goes above about 25,000, slow `REFRESH_MS`. (owner: console, Firestore, Usage)

### Housekeeping

- [x] O-6 Merge `develop` into `main`. (Done through PR #3, merge commit `7a0cd058`; CI deployed the real site and the demo.)
- [ ] O-7 Delete the merged branch `feature/threestooges` on GitHub, and the local `backup/before-trailer-removal`.
- [ ] O-8 Delete `~/.secrets/dashboard-deploy.json` now that the GitHub secret is set. The deploy key appeared in a chat session; it can only deploy Hosting, but delete it and rotate it if you want to be tidy.
- [x] O-9 Update `docs/DASHBOARD-DESIGN.md`: it still says `@angular/fire` (the app uses the `firebase` SDK, because Angular Fire does not support Angular 22), puts avatars in `src/assets/avatars/` (they are in `dashboard/public/avatars/`), and lists one allowed email (it is a list of five). (Done: design doc now matches the build.)
- [x] O-10 Replace the default Angular text in `dashboard/README.md` with a pointer to the root README. (Done.)
- [ ] O-11 Replace the three placeholder avatar SVGs in `dashboard/public/avatars/` with your own pictures.
- [x] O-12 Optional: deploy the demo site from CI as well (today it is published by hand with `npm run build:demo` and `firebase deploy --only hosting:demo`). (Done in `dashboard-deploy.yml`; it first runs on the next merge to `main`.)

### Quality gaps found along the way

- [ ] O-13 Screen-reader test (VoiceOver or NVDA). Keyboard order, focus rings, accessible names and axe are now automated in `npm run e2e`; a human listening pass is still not done.
- [x] O-14 The stale-data banner uses weekdays 9:30 to 16:00 New York time and ignores market holidays, so it can warn on a holiday. (Done: NYSE holidays and early closes for 2026 and 2027 are in `staleness.ts`; check the dates against the NYSE calendar and extend yearly.)
- [ ] O-15 Try the Firestore emulator in a browser end to end (sign in with the Auth emulator pop-up). The rules and service were tested in the emulator, but the pop-up flow was not.
- [ ] O-16 The nav "Bots" link always opens Wasif. Decide whether to add a Bots overview page, or point it at the Overview's bot cards.
- [x] O-17 The mockup's "8 weeks / All time" toggle on the overview was left out. (Done as D10-1.)
- [x] O-18 Page components are not yet covered by an end-to-end browser test; checks so far are unit tests plus manual runs in headless Chrome. (Done: `npm run e2e` drives real Chrome over the demo build and runs in CI.)

### Decisions kept (not tasks)

- The old bot service-account key was shown in an earlier session and is not rotated, by choice. If the bots' service account is ever shared, rotate it.
- The sample data keeps the 5,000 dollar total budget and "Nasdaq 100" for all three bots, though the bots' config has budgets of 1,000, 1,500 and 1,500 dollars and different universes. Real data will show the true figures.
- The real site shows only real data. The sample-data version runs locally (`npm start`) and on the demo site.
