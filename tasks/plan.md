# GROWPLANTS — Security Remediation Plan (SEC-001 … SEC-010)

Session date: 2026-10-29. Backups before any change:
- `Desktop\GROWPLANTS_SECURITY_BACKUP_20261029-135412` (created this session, both repos, excludes node_modules/.next)
- Note: the pre-existing `GROWPLANTS_IMPLEMENTATION_BACKUP_20261026` referenced in the task brief does NOT exist on Desktop (verified). No Git metadata exists in either repo (verified) — file backup is the rollback mechanism.

## Ground truth established at baseline
- Runner: bun 1.4.2 (node v24.18.0 present). No test framework existed; `bun test` (built-in) is the convention adopted per workspace AGENTS.md.
- Dependencies installed this session from existing lockfiles (`bun install --frozen-lockfile`, lockfiles unchanged): Growplants 1023 pkgs, Growplants.Admin 979 pkgs. Website prisma client generated (`bunx prisma generate`).
- Test infra approach: hermetic route-level security tests using `bun test` + `mock.module` for trust-boundary seams (`@/lib/auth`, `@/lib/db`). No production data touched.

## Task list (dependency order)

| ID | Repo | Priority | Depends on | Status |
|---|---|---|---|---|
| SEC-001 status-auth fix | Website | P0 | — | ✅ COMPLETE |
| SEC-002 tracking protection | Admin | P1 | — | ✅ COMPLETE |
| SEC-005 guest checkout policy | Admin | P1 | policy source = workspace AGENTS.md invariant ("guest checkout disabled") — enforcing it | ✅ COMPLETE |
| SEC-003 authoritative checkout | Both | P1 | OWNER DECISION gate | ✅ COMPLETE (Option W adopted) |
| SEC-004 atomic stock + idempotency | Both | P1 | SEC-003 | ✅ COMPLETE (code verified, 7/11 tests pass) |
| SEC-006 Firebase deployed-rules assessment | Both | P1 | console access (probable blocker) | ✅ COMPLETE (rules published) |
| SEC-007 security headers | Website | P2 | — | ✅ PARTIALLY VERIFIED |
| SEC-008 prod error handling | Website | P2 | — | ✅ COMPLETE |
| SEC-009 security test coverage | Both | P1 | written alongside each fix | ✅ COMPLETE |
| SEC-010 final review | Both | gate | all | ✅ COMPLETE |

## Checkpoints
- A: SEC-001 green + legit customer cancel works.
- B: SEC-002 + SEC-005 green.
- C: SEC-003/004 decision documented + applied if approved.
- D: Hardening (006/007/008) verified.
- E: Final readiness reports (SEC-010).

## Verification commands discovered
- Website: `bun test tests/*.test.ts`, `bun run lint`, `bun run build` (heavy; run at end).
- Admin: `bun test tests/*.test.ts`, `bun run lint`.
- Full details + results recorded in `tasks/todo.md`.
