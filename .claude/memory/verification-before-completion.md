---
name: verification-before-completion
description: Feature must pass init.sh + type check + tests + architecture lint before marking done. Evidence required.
metadata:
  type: feedback
---

**Rule:** A feature is done only when all verification passes: `bash init.sh`, `npx tsc --noEmit`, `bash lint/check-architecture.sh`, and evidence recorded in feature_list.json.

**Why:** Without verification, "done" features may have regressions, type errors, or architecture violations that break CI. The DoD checklist in AGENTS.md exists for a reason.

**How to apply:** When about to claim a feature is complete, run the verification commands first. Record the output/evidence. Don't say "tests pass" without running them. See AGENTS.md "Definition of Done".