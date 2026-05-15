# Harness Architecture Contract — CodePet

## Layer Definitions

All code MUST follow unidirectional dependency: **Layer 0 → Layer 1 → Layer 2 → Layer 3**

### Frontend (src/)

| Layer | Directory | Role | May Import From |
|-------|-----------|------|-----------------|
| L0 | `types/`, `data/` | Foundation: types, constants, static data | nothing (zero deps) |
| L1 | `canvas/`, `utils/` | Infra: rendering engine, utilities | L0 only |
| L2 | `stores/`, `hooks/` | Logic: state management, React hooks | L0, L1, L2 (peer stores/hooks ok) |
| L3 | `*.tsx` components | UI: React components | L0, L1, L2 |

### Backend (src-tauri/src/)

| Layer | Files | Role | May Import From |
|-------|-------|------|-----------------|
| L0 | `settings.rs`, error types | Foundation: config, errors | nothing (no `use crate::`) |
| L1 | `llm.rs`, `keyboard.rs`, `window_manage.rs`, `tray.rs` | Services: LLM client, input, window, tray | L0 only |
| L2 | `commands.rs` | IPC handlers: Tauri command bridge | L0, L1 |
| L3 | `lib.rs`, `main.rs` | Entry: app builder, main fn | L0, L1, L2 |

## Prohibited Behaviors

- **No reverse dependency**: L(N) must never import from L(N+1) or higher
- **No cross-layer skip**: L3 must not import L1 internals directly (go through L2)
- **No circular imports**: any cycle between modules is forbidden
- **No hardcoded secrets**: API keys, tokens, certificates must never appear in source
- **No .env/.pem/.key edits**: protected files are blocked by hooks

## Entry Files

- Frontend: [src/main.tsx](src/main.tsx) → [src/App.tsx](src/App.tsx)
- Backend: [src-tauri/src/main.rs](src-tauri/src/main.rs) → [src-tauri/src/lib.rs](src-tauri/src/lib.rs)

## Startup Workflow

Before coding:

1. Read this file (AGENTS.md) — architecture contract
2. Read [CLAUDE.md](CLAUDE.md) — project context + build commands
3. Read [feature_list.json](feature_list.json) — current feature status
4. Run `bash init.sh` if unsure about repo state

## Working Rules

- One feature at a time, following `feature_list.json` status
- Verification required before claiming done (see Definition of Done below)
- Update `progress.md` before ending any session
- No cross-layer imports — validated by pre-edit hooks

## Enforcement

- Pre-edit hooks run [lint/check-architecture.sh](lint/check-architecture.sh) on every `Edit`/`Write`/`NotebookEdit`
- Violation → edit blocked, must fix before retrying
- CI runs the same script; failure blocks merge

## Definition of Done

A feature is done when:

- [ ] Implementation complete
- [ ] `bash init.sh` passes (type check, tests, architecture lint)
- [ ] `bash lint/check-architecture.sh` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Progress updated in `progress.md`
- [ ] `feature_list.json` status updated

## End of Session

Before ending:

1. Update `progress.md` with what was done
2. Update `feature_list.json` feature status + evidence
3. Record blockers/risks in `progress.md`
4. Commit with descriptive message
5. Leave clean restart path (no uncommitted build artifacts)
