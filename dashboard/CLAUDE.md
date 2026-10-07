# Dashboard: instructions for Claude Code

Place this file at `dashboard/CLAUDE.md`.

## What this is

The read-only Angular dashboard for the three trading bots. Spec: `docs/DASHBOARD-DESIGN.md`. Tasks: `docs/DASHBOARD-TASKS.md`. Visual reference: `docs/mockups/`.

## Rules

- Use the `frontend-design` skill for every new screen or component, then match the mockup and the tokens in the design doc.
- Angular: standalone components, signals, built-in control flow (`@if`, `@for`), `inject()`. No NgModules.
- Styling: SCSS and the CSS custom properties from the tokens. No UI component library, no Tailwind.
- Charts: the shared SVG chart components only. Do not add a chart library without asking.
- Data: components talk to the `DataService` interface, never to Firestore directly. Mock mode must always work.
- The dashboard is read-only. Never add code that writes to Firestore or places or approves a trade.
- Show gain and loss with a sign or word as well as color. Keep touch targets at least 44px.
- Never show sample numbers without the Sample data badge.
- Never commit secrets. Firebase web config is public, but service-account files are not and live outside this folder.

## Commands

- `npm start` serves at localhost:4200 in mock mode.
- `npm test` runs unit tests; `npm run lint` and `npm run build` must pass before a commit.
- `npm run emulators` runs the local Firestore and Auth emulators; `npm run seed:emulator` fills them with the sample fixtures; `npm run start:emulator` serves the app against them (real-data mode, Sample data badge on).
- `npm run test:rules` runs the Firestore rules and `FirestoreDataService` tests in the emulator.

## Definition of done

See section 11 of `docs/DASHBOARD-DESIGN.md`. Update the checkbox in `docs/DASHBOARD-TASKS.md` when a task is done.
