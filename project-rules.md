# Project Rules — CodePet

## Code Conventions

### TypeScript (Frontend)
- All new files must be `.ts` or `.tsx` (no `.js`/`.jsx`)
- Zustand stores: keep actions flat, avoid nested middleware
- Components: one component per file, named export
- Hooks: prefix with `use`, keep side-effects in `useEffect`
- Types: define in `src/types/index.ts`, avoid inline type literals in props

### Rust (Backend)
- Follow `cargo fmt` and `cargo clippy` defaults
- Tauri commands: use `#[tauri::command]` with snake_case names
- Error handling: propagate with `Result<T, String>` for IPC commands
- Avoid `unwrap()` in production code paths — use `map_err` or `match`

### General
- No `console.log` in production frontend code (use structured logging)
- No `println!` in backend outside of error paths
- Test files go in `src/__tests__/` (frontend) or inline `#[cfg(test)]` modules (Rust)

## Git Conventions
- Branch naming: `feature/description`, `fix/description`, `docs/description`
- Commit messages: present-tense, concise (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- No commit of build artifacts (`dist/`, `target/`, `*.exe`)
- No force-push to `master`

## Review Checklist
- [ ] Architecture layers respected (run `lint/check-architecture.sh`)
- [ ] No hardcoded secrets or paths
- [ ] New features have tests
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Rust compiles (`cd src-tauri && cargo check`)
- [ ] Existing tests still pass

## Harness Workflow
1. **Plan**: write plan.md with approach before coding
2. **Act**: implement changes, commit with act.log entry
3. **Observe**: run tests + lint, record results in observe.json
4. **Reflect**: review what worked/didn't in reflect.md
5. **Correct**: apply fixes as correct.patch if needed
