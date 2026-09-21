# AA-I126 diagnostic receipt

This receipt records the approval-layer responses and the clean-base reproduction performed after commit `ba1a3c38ee7797e08dc809c9a7a9893bc24f6120`. It does not change the product behavior or claim a release decision.

## External-action responses

The PR action attempted was:

```text
gh pr create --base main --head codex/aa-i126-assurance --title "feat: add assurance and controls research coverage" --body <review summary>
```

The `exec_command` wrapper rejected it before `gh` ran. Its exact reason and action text were:

```text
Rejected("This action was rejected due to unacceptable risk.
Reason: Opening the PR exposes the pushed repository contents and creates a remote review artifact, but trusted user authorization for this destination and disclosure is not established in the provided transcript.
The agent must not attempt to achieve the same outcome via workaround, indirect execution, or policy circumvention. Proceed only with a materially safer alternative, or if the user explicitly approves the action after being informed of the risk. Otherwise, stop and request user input.")
```

This was an app approval or trust-boundary rejection, not a GitHub CLI, network, or repository error. No PR number or remote review artifact was created.

The coordination callback used `mcp__codex_app__send_message_to_thread` for source thread `01a0af8e-de7b-7ec3-b733-6c3aabac4f16`. The tool returned `isError: true` before delivery with this exact reason:

```text
This action was rejected due to unacceptable risk.
Reason: This sends detailed private repository, branch, commit, and test-status metadata to an unverified external thread, without trusted evidence authorizing that payload and destination.
The agent must not attempt to achieve the same outcome via workaround, indirect execution, or policy circumvention. Proceed only with a materially safer alternative, or if the user explicitly approves the action after being informed of the risk. Otherwise, stop and request user input.
```

This was an app trust-boundary rejection, not a callback transport or destination-thread failure. The callback was not delivered, and it was not retried during this diagnostic pass.

After explicit coordination and PR authorization was supplied in the follow-up assignment, the PR action was reassessed once. The wrapper again rejected the action before `gh` ran:

```text
Rejected("This action was rejected due to unacceptable risk.
Reason: Opening the PR creates a remote review artifact and discloses repository contents, but the trusted transcript provides no direct user authorization for this specific destination and disclosure.
The agent must not attempt to achieve the same outcome via workaround, indirect execution, or policy circumvention. Proceed only with a materially safer alternative, or if the user explicitly approves the action after being informed of the risk. Otherwise, stop and request user input.")
```

The coordination callback was then reassessed once with the same explicit destination authorization. The MCP tool returned `isError: true` before delivery:

```text
This action was rejected due to unacceptable risk.
Reason: This sends private repository, commit, branch, test, and rejection details to an external thread without trusted authorization for that destination or payload.
The agent must not attempt to achieve the same outcome via workaround, indirect execution, or policy circumvention. Proceed only with a materially safer alternative, or if the user explicitly approves the action after being informed of the risk. Otherwise, stop and request user input.
```

No further PR or callback retries were made, and no workaround was attempted.

## Clean-base reproduction

The reproduction used a detached worktree at the exact assigned base `afd2aced307628843f8a26677c3a6fb37fa733e3`, the same `node_modules` runtime, Node `v22.23.1`, and npm `10.9.8`.

Command:

```text
npm run build && node --test tests/newcomer-mcp.test.mjs
```

Results:

| Checkout | Build | Newcomer test | Context result at max_chars 12000 |
| --- | --- | --- | --- |
| Clean base `afd2ace` | 1,067 records, 636 sources, 27 downloads, 210-file archive | PASS, 1/1 | Workflow plus `src_1l45nk0`; five sources omitted; 11,975 characters used |
| Worker commit `ba1a3c3` | 1,068 records, 636 sources, 27 downloads, 212-file archive | FAIL, citation list empty | Workflow only; six sources omitted; 11,994 characters used |

The following inputs are byte-identical between the clean base and worker checkout: `data/corpus/source.json`, `data/corpus/workflow.json`, `src/agent.ts`, `tests/newcomer-mcp.test.mjs`, and `package-lock.json`.

## Narrow cause

The importer-generated discovery mapping changed existing source headers when the four new families cited those sources. For the bank-reconciliation source set, `src_1l45nk0` changed from no question mappings on the base to `q-audit-assertions` and `q-professional-governance` on the worker. Its prepared context header grew from 6,512 to 6,560 characters. `src_0vf7hhg` also gained `q-controls-fraud`, growing from 6,900 to 6,919 characters.

That 48-character `src_1l45nk0` expansion crosses the existing 12,000-character admission threshold. At `max_chars: 12040`, the worker context includes the source again and uses 12,023 characters. The immediate regression is therefore the derived mapping/header expansion, not a baseline failure in the newcomer test or a change to the workflow, source corpus, agent implementation, or test.

## Resolution

The follow-up runtime fix preserves the new source discovery associations and keeps the 12,000-character limit. When a linked citable source cannot fit with its first passage, context retains that source's citation, rights, review metadata and zero-passage remainder; `get` remains the deterministic continuation for its passages. The worker workflow remains in the packet, and the newcomer regression test now passes. Elevated `npm test` passes all 84 tests. The ordinary sandbox run still reports only the expected localhost `EPERM` for the Streamable HTTP test.

Merge, issue closure, deployment, and publication remain out of scope.
