# AI Trading Bots: Staged Technical Tasks

Companion to `DESIGN.md` (section numbers below refer to it). Tick boxes as you go. Effort figures are rough focused-dev-day estimates for one developer, not commitments.

Task IDs: `S<stage>-<n>`. Each stage ends with a Definition of Done (DoD). Do not start a stage's dependents until its DoD is met.

---

## Build order (milestones)

| Milestone | Stages | Outcome | Go/no-go question |
|---|---|---|---|
| M1: Backtest slice | S0, S1, S2, S3, S4 | All three strategies backtested end to end, no LLM | Are any strategies worth paper trading? Replace the ones that fail. |
| M2: Rule-based paper trading | S5, S6, S8, S9 | Risk engine, ledger, Telegram approval and execution on Alpaca paper, LLM off | Does the plumbing behave for a week without surprises? |
| M3: LLM and memory | S7 (plus learning in S6) | Analysts in shadow mode, then advisory; memory screen live | Do verdicts add information? (needs trades first) |
| M4: Visibility and deploy | S10, S11 | Reports, dashboard, VM deployment | Can it run unattended and tell you when it is broken? |
| M5: Paper run and review | S12 | 6-8 weeks of paper trading and go-live gate review | Which bots, if any, earn a live trial? |

Dependency sketch: S0 -> S1 -> S2 -> S3 -> S4 -> (S5, S6) -> S9 -> S8 -> S7 -> S10 -> S11 -> S12. S6 can start once S1 is done; S8 needs S5 and S6.

Rough effort: S0 1-2d, S1 1-2d, S2 4-6d, S3 3-4d, S4 8-12d, S5 4-6d, S6 3-4d, S7 6-8d, S8 4-5d, S9 6-8d, S10 5-7d, S11 3-5d, S12 6-8 weeks elapsed.

---

## S0: Project setup and accounts (1-2d)

Goal: a clean repo, CI and working credentials for every external service.

- [ ] S0-0 Run `scripts/check_prereqs.sh` (macOS Apple Silicon) to check Homebrew, Git, Python 3.12, VS Code, Node, Firebase CLI, jq and gcloud; re-run with `--install` to add anything missing via Homebrew.
- [ ] S0-1 Create one repo with two folders, `bot/` (Python 3.12 project: `pyproject.toml`, `src/tradebots`, `tests`) and `dashboard/` (Angular, see DASHBOARD-TASKS.md), tooling: uv or pip-tools, ruff, mypy, pytest.
- [ ] S0-2 `Makefile` with `check` (ruff + mypy + pytest), `test`, `fmt`, `run-*` targets.
- [ ] S0-3 pre-commit hooks and GitHub Actions CI (lint, type check, tests).
- [ ] S0-4 Accounts and keys: Alpaca paper, FMP free key, Telegram bot (BotFather) and your user id, Firebase project on Spark plan with a service account, Anthropic API key. Skip Quiver for now.
- [ ] S0-5 `.env.example` and `pydantic-settings` loader; separate variable names for paper and live; secrets never committed (add secret scanning to CI).
- [ ] S0-6 Logging (structured JSON), time utilities (UTC internally, ET for market logic), market calendar (holidays, half days).
- [ ] S0-7 Smoke scripts in `scripts/`: Alpaca paper account read, FMP quote, Telegram test message, Firestore emulator write/read, Claude API call.
- [ ] S0-8 `.vscode` settings, launch and tasks files; recommended extensions (DESIGN Appendix B).
- [ ] S0-9 Copy `DESIGN.md` and `TASKS.md` into `docs/`; start a `docs/decision-log.md`.

DoD: `make check` is green in CI; every smoke script succeeds against the real or emulated service.

---

## S1: Config and domain models (1-2d)

Goal: everything configurable and validated at startup.

- [ ] S1-1 Pydantic models for account, trade limits, strategies (including `status`), universes, data, LLM, approval (DESIGN section 4).
- [ ] S1-2 Risk config model and loader for `config/risk.yaml` (section 8).
- [ ] S1-3 Acceptance config model for `config/acceptance.yaml` (section 6.3).
- [ ] S1-4 Config hashing and `config_version` stamping; fail fast on invalid or inconsistent config (budget percentages must sum to at most 100).
- [ ] S1-5 Domain types: `Candidate`, `TradePlan`, `Proposal`, `Position`, `Trade`, `Verdict`, `Regime`, `RiskDecision`.
- [ ] S1-6 Interfaces (`Protocol`s) for `MarketDataProvider`, `FundamentalsProvider`, `Broker`, `Ledger`, `Strategy`, `Analyst`, `Notifier`.
- [ ] S1-7 Strategy registry (load plugins by dotted path from config).
- [ ] S1-8 Unit tests for validation, hashing and registry.

DoD: invalid config is rejected with a clear message; valid config loads in under a second; registry resolves the three plugin paths (stubs are fine).

---

## S2: Data layer (4-6d)

Goal: reliable cached price and fundamentals data for both universes.

- [ ] S2-1 Alpaca market data adapter: daily and intraday bars, split/dividend adjustment, rate-limit handling, retries.
- [ ] S2-2 FMP adapter: profile, key metrics, ratios, statements, calendars (earnings, economic), news and filings, sector performance. Map each endpoint to its plan tier and record it in `docs/fmp-endpoints.md`.
- [ ] S2-3 Optional Quiver adapter behind `quiver_enabled` (stub only until trial).
- [ ] S2-4 Universe builder: NASDAQ-100 and NYSE top 300 non-financial by market cap; monthly refresh; store membership with dates.
- [ ] S2-5 Cache layer: Parquet per symbol plus manifest; incremental updates; freshness checks.
- [ ] S2-6 Point-in-time handling: store filing/public dates with fundamentals; helper `as_of(date)` that never returns later data.
- [ ] S2-7 Data quality checks: gaps, stale bars, zero volume, outliers, symbol changes; report to log and Telegram.
- [ ] S2-8 Regime inputs: index trend (SPY/QQQ vs 200-day), breadth proxy, volatility proxy, sector strength; record which are available at your tier.
- [ ] S2-9 Broker state adapter: clock, calendar, account, positions, day-trade counter (verify availability).
- [ ] S2-10 Tests with recorded fixtures (no live calls in CI).
- [ ] S2-11 Backfill job: at least 5 years of daily bars for both universes.

DoD: `cli data refresh` populates the cache for the full universe within provider limits; `as_of` tests prove no look-ahead; data quality report is clean or explained.

---

## S3: Scanner, `screener.py` (3-4d)

Goal: config-driven filtering that backtest and live share.

- [ ] S3-1 Indicator library on pandas/numpy: SMA, EMA, RSI, ATR, Bollinger, rolling highs, volume ratios (verified against a reference library in tests).
- [ ] S3-2 Rule engine: filters defined in YAML (field, operator, value, optional lookback); composable with all/any; validated.
- [ ] S3-3 Base filters: price, average dollar volume, ATR percent, trend conditions, earnings proximity.
- [ ] S3-4 Fundamental filters (EPS growth, margins, debt ratios) using point-in-time values.
- [ ] S3-5 `screener.py` entry point: universe + strategy filter set -> candidate list with reason codes.
- [ ] S3-6 Candidate output schema and scan report (counts per filter stage).
- [ ] S3-7 Performance: full-universe scan completes in under a minute and fits in a memory budget (measure peak RSS; target under 600 MB, needed for the free VM).
- [ ] S3-8 Tests: filter semantics, edge cases (missing data, new listings).

DoD: `cli scan --strategy breakout_v1 --date YYYY-MM-DD` returns candidates with reasons, reproducibly, within the performance budget.

---

## S4: Strategies and backtest harness (8-12d)

Goal: an honest answer about whether each strategy has an edge.

- [ ] S4-1 Strategy plugin base class and helper utilities (DESIGN section 6.1); strategies are pure functions.
- [ ] S4-2 Breakout plugin (`breakout_v1`) per section 6.2.
- [ ] S4-3 Trend pullback plugin (`pullback_v1`).
- [ ] S4-4 Mean reversion plugin (`meanrev_v1`).
- [ ] S4-5 Position sizing function shared with the risk engine (section 8): risk dollars / stop distance, whole shares, position cap.
- [ ] S4-6 Bar-by-bar simulator: entries, stops, targets, time stops, breakeven moves; conservative fill rules (stop first when both hit, gap fills at open).
- [ ] S4-7 Cost and slippage model (config: basis points plus half spread).
- [ ] S4-8 Walk-forward runner (rolling train/test folds) and a holdout reserve of the latest 12 months.
- [ ] S4-9 Metrics and report: expectancy in R, win rate, profit factor, drawdown, exposure, hold time, MAE/MFE, monthly returns, regime breakdown, benchmark comparison, bias warnings.
- [ ] S4-10 Parameter sensitivity runs (plus/minus 20 percent) and a heatmap output.
- [ ] S4-11 Acceptance check command: evaluates a run against `acceptance.yaml` and prints pass/fail per criterion.
- [ ] S4-12 Run log: every run stores config hash, data version, code commit.
- [ ] S4-13 Regression tests: fixed dataset -> fixed trade list.
- [ ] S4-14 Review session: per strategy decide `proceed`, `tune once, then decide`, or `replace` (DESIGN section 6.4). Record decisions in the decision log.
- [ ] S4-15 If replacing: pick from the backlog (post-earnings drift, 52-week-high momentum, sector rotation, etc.), implement, rerun S4-6 to S4-11.

DoD: for each of the three slots there is either a strategy that passes the acceptance gates or a documented replacement in progress. No strategy moves on without a saved backtest report.

Milestone M1 review happens here.

---

## S5: Gates and risk engine (4-6d)

Goal: deterministic safety layer that nothing can bypass.

- [ ] S5-1 Risk engine: pre-trade checks for every rule in DESIGN section 8; returns `RiskDecision` with all reasons (not just the first).
- [ ] S5-2 Exposure accounting: open positions, sector counts, portfolio heat, sleeve balances (from the ledger/broker mirror).
- [ ] S5-3 Circuit breakers: daily loss limit, strategy breaker (drawdown or consecutive losses), account kill switch; state persisted in `system/state`.
- [ ] S5-4 Kill switch behavior: block new entries, optionally flatten; reachable from Telegram and from code.
- [ ] S5-5 Regime gate: per-strategy `regime_ok` evaluated from regime inputs; produces the "enabled strategies today" set.
- [ ] S5-6 Event/news veto: earnings window, macro stand-down days, material-news flags (rule-based first: 8-K and press-release keywords).
- [ ] S5-7 Memory screen: blocklist and setup stats lookups (reads from the ledger; empty at first).
- [ ] S5-8 PDT guard and trade-count caps.
- [ ] S5-9 Table-driven unit tests for every rule, boundary values and combinations; property tests for sizing.
- [ ] S5-10 Rule evaluation log: each decision stored with inputs for audit.

DoD: test suite shows every rule rejects and accepts correctly at its boundary; the risk engine cannot be configured below hard minimums (for example kill switch cannot be disabled in live mode).

---

## S6: Ledger and memory on Firestore (3-4d)

Goal: durable, auditable records and the data for learning.

- [ ] S6-1 Firestore project setup, emulator workflow, security rules (client read-only for the owner, no client writes).
- [ ] S6-2 Repository layer for all collections in DESIGN section 11 with typed models and idempotent writes.
- [ ] S6-3 Decision snapshots: capture exact inputs, indicator values, data references, prompt and config versions per proposal.
- [ ] S6-4 Trade lifecycle writes: proposal -> plan -> orders -> trade (with R multiple, exit reason, tags, setup fingerprint).
- [ ] S6-5 Setup fingerprint definition (strategy, sector bucket, regime, key conditions) and `setup_stats` rollups.
- [ ] S6-6 Blocklist rules: ticker cooldown, fingerprint expectancy rule (minimum trade count before blocking), expiry dates.
- [ ] S6-7 Lesson writer interface (LLM-backed in S7; stub now).
- [ ] S6-8 Daily rollups and a quota-aware read pattern (no full scans).
- [ ] S6-9 Index definitions file and deployment script.
- [ ] S6-10 Nightly export job (JSON to VM storage) and restore test.
- [ ] S6-11 Tests against the emulator, including concurrent writes and idempotency.

DoD: a simulated trade lifecycle produces the full document chain; rollups match recomputation from raw trades; export/restore round trip works.

---

## S7: Analyst bots and strategy bots (6-8d)

Goal: structured, auditable LLM verdicts with strict guardrails.

- [ ] S7-1 Prompt files with versioning (`prompts/fa-*.md`, `ta-*.md`, `lesson-*.md`) and a loader that records the version.
- [ ] S7-2 Pydantic verdict schema (DESIGN section 10.1); one retry on invalid output; explicit "no verdict" state.
- [ ] S7-3 Fundamental analyst: inputs = ratios, trends, estimates, filings summary; output verdict. Read-only data tools via REST first, MCP optionally.
- [ ] S7-4 Technical analyst: inputs = computed indicators and price-structure summary (never raw prompt-injectable text).
- [ ] S7-5 MCP configuration: FMP toolsets limited to company, statements, estimates and news; Quiver tools only if enabled; allow-list; per-candidate call cap.
- [ ] S7-6 Prompt-injection defenses and test fixtures (malicious text in news/filings must not alter output format or trigger tools outside the allow-list).
- [ ] S7-7 Cost meter: tokens and cost per call, per day cap (`llm.daily_budget_usd`); pause analysts on breach and alert.
- [ ] S7-8 Cache per (ticker, date, prompt_version); limit to `max_candidates_per_day`.
- [ ] S7-9 Strategy bot: builds the trade proposal from the strategy plugin's plan plus analyst verdicts plus memory stats; writes the human-readable rationale; cannot change size, stop or target.
- [ ] S7-10 Split-verdict policy implementation (`flag_for_human`, `require_both_non_avoid`).
- [ ] S7-11 Analyst modes: `shadow` (record only) and `advisory` (shown on card). Start in shadow for the first paper weeks.
- [ ] S7-12 Lesson writer: LLM-generated short lessons on trade close; stored with tags; read-only context for future cards.
- [ ] S7-13 Evaluation harness: fixed historical cases, schema pass rate, consistency across repeated runs, cost per candidate.
- [ ] S7-14 Verdict scorecard queries (after enough trades): verdict vs realized R.

DoD: end-to-end run on 10 historical candidates yields valid verdicts, logs cost, passes the injection fixtures, and never calls a tool outside the allow-list.

---

## S8: Telegram approval and armed plans (4-5d)

Goal: human approval of the plan, with both verdicts on the card.

- [ ] S8-1 Telegram bot service (python-telegram-bot), webhook or long polling (decide based on hosting); allow-list your user id only.
- [ ] S8-2 Card renderer (DESIGN section 9.1): trade call, both verdicts, memory stats, flags, risk summary.
- [ ] S8-3 Buttons: Approve, Reject, Details; one-time tokens; idempotent handling; message edit after action.
- [ ] S8-4 Plan lifecycle state machine (section 9.2) with persistence and transition tests.
- [ ] S8-5 Expiry jobs: unapproved proposals and armed plans expire per config.
- [ ] S8-6 Commands: `/status`, `/halt`, `/resume`, `/flatten`, `/plans`, `/pnl`; confirmation step for `/flatten`.
- [ ] S8-7 Alerts: errors, breaker trips, reconciliation mismatches, cost cap, heartbeat loss.
- [ ] S8-8 Audit log for every approval/command.
- [ ] S8-9 Tests with a fake Telegram client; manual test in a private chat.

DoD: from a stored proposal, you receive a card, approve it on your phone, and an `ARMED` plan appears in Firestore; rejecting or ignoring it expires correctly.

---

## S9: Execution (6-8d)

Goal: reliable, reconciled order handling on Alpaca paper.

- [ ] S9-1 Broker adapter for Alpaca (paper): account, positions, orders, bracket orders, cancel, flatten; separate live adapter config guarded by the live flag.
- [ ] S9-2 Trigger watcher: streams or polls intraday bars for armed plans; handles reconnects; respects the entry window.
- [ ] S9-3 Pre-trade recheck (section 9.3): drift, gap invalidation, risk re-run, buying power, PDT, halts, events, caps, kill switch.
- [ ] S9-4 Executor: places bracket orders, records order ids, handles rejects/partial fills, idempotency keys to prevent duplicates.
- [ ] S9-5 Position monitor: strategy `manage` actions (breakeven, trailing, time stop), implemented via order modifications.
- [ ] S9-6 Reconciler: compare broker positions/orders with the ledger at startup, hourly and after close; auto-repair safe cases, alert on the rest.
- [ ] S9-7 Fill quality tracking: expected vs actual entry, slippage, time to fill.
- [ ] S9-8 Restart safety: after a crash, bracket orders still protect positions; the system rebuilds state from broker and ledger.
- [ ] S9-9 Integration tests on Alpaca paper (small test trades, tagged) and simulated failures (timeouts, partial fills, rejected orders).
- [ ] S9-10 Dry-run mode: full flow without placing orders (logs what would happen).

DoD: an approved plan triggers, passes recheck, places a bracket order on paper, is monitored, closes, and the ledger and broker agree. Killing the process mid-trade and restarting leaves no orphaned or duplicate orders.

---

## S10: Reports and dashboard (5-7d)

Goal: you can judge performance without reading logs.

- [ ] S10-1 Daily and weekly report generators (equity, trades, per-strategy stats, rejects by reason, slippage, LLM cost); delivered to Telegram and stored.
- [ ] S10-2 Scorecard job: analyst verdict accuracy and per-strategy expectancy (with sample-size caveats).
- [ ] S10-3 Paper-vs-backtest drift report per strategy.
- [ ] S10-4 Dashboard app scaffold (Firebase Hosting), owner-only auth.
- [ ] S10-5 Overview screen: equity curve, drawdown, open positions, today's activity.
- [ ] S10-6 Strategy screen: expectancy in R, win rate, profit factor, sleeve utilization, status.
- [ ] S10-7 Trade journal: list, detail view with decision snapshot, verdicts and lessons.
- [ ] S10-8 Rejected/vetoed log and system health (heartbeat, last runs, kill switch state, cost).
- [ ] S10-9 Quota-safe data access (read rollups and paged lists only; no wide realtime listeners).
- [ ] S10-10 Deploy to Firebase Hosting; verify access control from another account.

DoD: dashboard loads from rollups within quota, shows all strategies and the trade journal, and rejects other users.

---

## S11: Deployment and operations (3-5d)

Goal: runs unattended and alerts when broken. Close decision P1 here.

- [ ] S11-1 Dockerfile and compose; config and secrets injected at runtime; image reproducible.
- [ ] S11-2 Measure peak memory of each job on a 1 GB machine; decide GCP e2-micro (free) vs a paid size vs Hetzner using the checklist in DESIGN section 15.4.
- [ ] S11-3 Provision the VM (recommended: GCP e2-micro in us-east1 or us-central1, Standard network tier, standard disk), attach a service account for Firestore, add swap, set a billing budget alert.
- [ ] S11-4 Scheduler (systemd timers or cron) for the timeline in DESIGN section 3.3; calendar-aware.
- [ ] S11-5 Long-running services (Telegram bot, trigger watcher, position monitor) under systemd with restart policies.
- [ ] S11-6 Monitoring: heartbeat checks, log shipping or log rotation, disk and memory alerts.
- [ ] S11-7 Backups: nightly Firestore export, config in git, VM snapshot schedule.
- [ ] S11-8 Runbook: start/stop, kill switch, restore, rotate keys, upgrade, what to do when the VM dies mid-session.
- [ ] S11-9 Secrets handling on the VM and key rotation procedure.
- [ ] S11-10 Game day: kill the VM during a paper trade and verify recovery per the runbook.
- [ ] S11-11 Record the hosting decision in the decision log.

DoD: a full day runs on the VM with no manual steps, alerts fire when you stop the process, and the game day passes.

---

## S12: Paper run, review and go-live decision (6-8 weeks elapsed)

Goal: evidence for a per-bot go or no-go.

- [ ] S12-1 Start with `analyst_mode: shadow` for the first 2 weeks; then switch to `advisory` and compare.
- [ ] S12-2 Weekly review ritual (30 minutes): report, rejects, slippage, surprises, config changes (one change per review).
- [ ] S12-3 Track paper vs backtest drift per strategy.
- [ ] S12-4 Replace or pause strategies that fail the protocol (DESIGN section 6.4).
- [ ] S12-5 Reach at least 60-100 trades per bot (or document why not).
- [ ] S12-6 Apply the go-live gate (DESIGN section 16.1) and write the decision per bot.
- [ ] S12-7 Verify broker eligibility, funding path, taxes/remittance and current day-trading rules (DESIGN section 16.2). Do this early, not at the end.
- [ ] S12-8 If go: separate live keys and config, much smaller limits, one bot first, live checklist signed off, kill switch tested live.
- [ ] S12-9 If no-go: write down why, decide whether to iterate strategies, extend paper, or stop.

DoD: a written decision for each bot with the evidence attached.

---

## Cross-cutting backlog (do when relevant)

- [ ] X-1 Quiver monthly trial: enable behind the flag, log which verdicts it changes, keep only if it measurably helps.
- [ ] X-2 FMP plan upgrade review: Starter -> Premium only for a specific measured gap.
- [ ] X-3 Semantic lesson search (pgvector-style or Firestore vector search) only if rule-based memory proves insufficient.
- [ ] X-4 Additional strategies from the backlog, each through the same backtest gates.
- [ ] X-5 Lower-friction approval modes (auto-approve under a risk threshold) only after a bot's paper record justifies it.
- [ ] X-6 Options and short-selling are out of scope until a separate design.
