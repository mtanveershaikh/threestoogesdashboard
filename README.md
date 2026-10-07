# The Three Stooges

A private, read-only web dashboard for three trading bots. It shows how each bot is doing on paper, how that compares with its backtest, and what is waiting for approval.

Live: https://the-three-stooges.web.app (sign-in required)

Demo with sample data, no sign-in: https://the-three-stooges-demo.web.app

## The bots

| Bot | Strategy | Reward to risk | Time stop |
| --- | --- | --- | --- |
| Wasif | Breakout momentum | 1:3 | 10 days |
| Waseem | Trend pullback | 1:3 | 15 days |
| Nawaz | Mean reversion | 1:2 | 5 days |

The bots themselves live elsewhere. They write their results to Firestore, and this dashboard only reads them.

## What it shows

- **Overview:** equity, today's result, open risk against its limit, trades today against the cap, kill switch, return since start for each bot, plans awaiting approval, open positions and recently closed trades.
- **Bot report:** return, average R, win rate, profit factor and drawdown; paper against backtest, side by side; the go-live checklist with a verdict; results by setup; recent trades with both analyst verdicts; a Download report button (a CSV made in the browser).
- **Trades:** every closed trade, newest first, with filters (bot, win or loss, exit, dates, stock) kept in the web address so a view can be shared, a summary of what is shown, and a CSV download.
- **Reports:** weekly and monthly summaries that add up to the Overview total.
- **Settings:** a read-only view of the limits, go-live thresholds and strategy settings the bots are running (published by the bots in `system/config`; see [docs/BOT-DATA-CONTRACT.md](docs/BOT-DATA-CONTRACT.md)).
- **Backtest-only bots:** while no paper trading has started, every page says so and shows the backtest instead. Add `?scenario=backtest` to the address in sample-data mode to see it.
- Gains and losses always carry a sign and an arrow, not only color. The pages work from phone width up.

## Read-only by design

Nothing in the app writes to the database or places or approves a trade. Plan cards link to Telegram, where approvals happen. The Firestore rules deny every write from the web and allow reads only for an allow-list of Google accounts.

## Stack

Angular 22 (standalone components, signals), SCSS with CSS custom properties, hand-written SVG charts, Firebase Hosting, Firestore and Google sign-in. No UI library and no chart library. Tests use the Angular test runner (Vitest) and the Firestore emulator.

## Repository layout

```
dashboard/          the Angular app
  src/app/data/     data contract, DataService, mock fixtures, Firestore service
  src/app/pages/    overview, bot report, signed-out page, styleguide
  src/app/shared/   reusable components (tiles, tables, chips, banner)
  src/app/charts/   line chart, sparkline, histogram
  rules-tests/      Firestore rules and service tests (run in the emulator)
  scripts/          emulator seeding and config check
docs/               design spec, task list, mockups, deploy runbook
firestore.rules     who can read the data
firebase.json       hosting and emulator setup
.github/workflows/  CI (lint, test, build) and deploy
```

## Run it locally

You need Node and npm. CI uses Node 24, and Node 26 also works. Everything below runs from the `dashboard/` folder.

```
cd dashboard
npm install
npm start
```

Open http://localhost:4200. This runs in **mock mode**: sample data, no network, no sign-in, and a "Sample data" badge on every page. The numbers are made up. Try `/bots/breakout`, `/bots/pullback` and `/bots/reversion`, and `/styleguide` for every component.

### Run against the Firestore emulator

This uses the real data service and sign-in screen, with sample data in a local database. It needs Java 21 and the Firebase CLI (`npm install -g firebase-tools`). Use three terminals, all in `dashboard/`:

```
npm run emulators        # starts the local Firestore and Auth emulators
npm run seed:emulator    # fills them with the sample data
npm run start:emulator   # serves the app at http://localhost:4200
```

Sign in with the pop-up from the Auth emulator. To get past the allow-list, use an address that appears in `allowedEmails` in `src/environments/environment.base.ts`.

### Checks

```
npm test            # unit and component tests
npm run lint
npm run build
npm run test:rules  # Firestore rules and data service tests (needs Java and firebase-tools)
```

CI runs the same checks on every pull request.

## Deploy

Merging to `main` deploys to Firebase Hosting through GitHub Actions. Pull requests get a preview link. By hand:

```
cd dashboard && npm run check:config && npm run build
cd .. && firebase deploy --only hosting
```

Publish rule changes with `firebase deploy --only firestore`. The full runbook, including the one-time Firebase setup and the deploy secret, is in [docs/DASHBOARD-DEPLOY.md](docs/DASHBOARD-DEPLOY.md).

## The demo site

`the-three-stooges-demo` is a second Hosting site in the same Firebase project. It runs the same app in sample-data mode: no database, no sign-in, a "Sample data" badge on every page, and a `noindex` header. It never touches the real Firestore. Publish it with:

```
cd dashboard && npm run build:demo
cd .. && firebase deploy --only hosting:demo
```

CI deploys only the real site (`target: app`), so the demo is updated by hand.

## Who can sign in

Access is an allow-list of Google accounts, kept in two places that must match:

- `firestore.rules`, which enforces it, and
- `allowedEmails` in `dashboard/src/environments/environment.base.ts`, which only chooses which screen to show.

To add or remove someone, edit both, run the rules tests, then deploy rules and hosting.

## More

- [docs/DASHBOARD-DESIGN.md](docs/DASHBOARD-DESIGN.md): design tokens, screens, data contract
- [docs/DASHBOARD-TASKS.md](docs/DASHBOARD-TASKS.md): the task list and progress
- [dashboard/CLAUDE.md](dashboard/CLAUDE.md): working rules for the codebase
