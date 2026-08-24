# Issue tracker: GitHub

Issues and implementation tickets for this repository live in GitHub Issues at `HenryBranchAdams/ai-agents-in-accounting`.

## Conventions

- Create, read, comment on, label, and close issues through the connected GitHub integration or the `gh` CLI.
- Publish implementation-ready tickets in dependency order so blocker references resolve to existing issues.
- Prefer GitHub native issue dependencies when available. Otherwise, record blockers in an explicit `## Blocked by` section using issue references.
- An issue is on the working frontier when all listed blockers are closed and it has no assignee.
- Use the repository's triage vocabulary from `docs/agents/triage-labels.md`.

## Pull requests as a triage surface

PRs as a request surface: no.

GitHub issues and pull requests share a number space. Resolve ambiguous references before acting.

## Skill routing

- When a skill says “publish to the issue tracker,” create a GitHub issue in this repository.
- When a skill says “fetch the relevant ticket,” read the full GitHub issue, labels, and comments.
- Do not close or modify a parent issue when publishing child implementation tickets.
