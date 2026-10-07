# Skills and tools setup for the dashboard

## 1. The frontend-design skill

It guides Claude toward distinctive, intentional UI instead of generic defaults. Add it to the repo so Claude Code in VS Code loads it for everyone who opens the project.

From the repo root, try the skills installer with the source you named:

```
npx skills add anthropics/skills@frontend-design
```

If the installer does not accept that form, run `npx skills add --help` to see the current syntax, or use the manual route, which always works:

1. Open https://github.com/anthropics/skills and find the `frontend-design` folder.
2. Copy that whole folder into `.claude/skills/frontend-design/` in the repo (it contains `SKILL.md`).
3. Commit it.

Check it loaded: start Claude Code in the repo and ask it to list its skills; `frontend-design` should appear. Skills load on the next session, so restart if it is missing.

## 2. Do you need an MCP for UI design?

No. The mockups already exist and Claude can build Angular from them directly. Add one only for a specific need:

| Need | Add |
| --- | --- |
| Import designs from Figma | A Figma MCP server, if you start designing in Figma |
| Let Claude open the running app and check it | A browser tool (Claude in Chrome, or a Playwright MCP) |
| Look up Angular or library docs | A documentation MCP, optional |

Start with none; add the browser tool when you want Claude to test the screens visually.

## 3. Tools to have installed

Run `scripts/check_prereqs.sh` first. Then add:

```
npm install -g @angular/cli
```

Recommended VS Code extensions: Angular Language Service, ESLint, Prettier, Firebase (optional), and the Claude Code extension.

## 4. Order of work

1. Run the prerequisite check.
2. Create the repo with `bot/` and `dashboard/` (see `DASHBOARD-DESIGN.md` section 2).
3. Add the skill and `dashboard/CLAUDE.md`.
4. Work through `DASHBOARD-TASKS.md` from D0, one stage at a time.
