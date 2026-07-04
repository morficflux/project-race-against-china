# Working agreements

- Spec-driven: every feature starts as a numbered spec in `specs/` with
  acceptance criteria. Statuses: draft → approved → built → verified.
- Verify by driving the game (see `.claude/skills/verify/`), not just by
  building it. Check spec boxes with evidence.
- Commit and push only when explicitly asked.
- **Version branches:** each major version (v3, v4, …) is developed on a
  branch named for it (`v3`), merged into `main` only when the version is
  signed off. `main` auto-deploys to GitHub Pages, so `main` = the live,
  signed-off game. (v1, v2, and spec 010 predate this rule.)
- Milton (age 7) is the art director and game designer: hand-drawn art via
  `npm run sprite`, sounds via `/booth.html`, tunables in `src/config.ts`,
  levels in `src/levels/`. Acceptance boxes naming Milton are his to check.
