# Kecktech Repository Instructions

Policy version: `2026.08.18.1`
Canonical development policy SHA-256: `943e916f42855fdcc42bf3f685c4c47106131547c629ec592748323a1e3db21d`

The mandatory Kecktech development policy applies to this repository. Preserve dirty and unrelated work. Inspect the implementation and real dependencies before editing. Never add production stubs, mocks, placeholders, simulated success, fake health, or silent fallback. Validate trust-boundary input, enforce authorization server-side, keep secrets out of source and output, and require regression tests for fixes. Production changes require rollback and post-change evidence. Credential and destructive operations require the explicit approvals in the Kecktech Operations Project instructions.

Run the repository's documented lint, validation, type-check, test, and build commands before claiming completion. If a required check does not exist, record that gap; do not claim it passed.

<!-- BEGIN KECKTECH OPERATIONS POLICY 2026.08.18.1 -->

## Kecktech operations workflow

Policy version: 2026.08.18.1  
Project instructions SHA-256: ecdbf37e53cd1d59957c928b3342104c045d87f79ccc3d181586a3aa7592a6d1  
Canonical development policy SHA-256: 943e916f42855fdcc42bf3f685c4c47106131547c629ec592748323a1e3db21d

Load .agents/skills/kecktech-operations/SKILL.md for infrastructure,
operations, incidents, deployment, live-to-Git reconciliation, or Notion work.
Read PROJECT_INSTRUCTIONS.md before planning, editing, testing, or deploying;
it is the identical universal policy in every production-connected repository.
Reuse the completed 2026-08-16 fleet audit and 2026-08-18 deployment captures;
perform only changed, contradictory, provenance-missing, or acceptance-critical
verification. Treat live production as authoritative until reconciliation is
accepted, preserve dirty work, and never overwrite live state with older Git.

While KT-DNS-001 is active, make no DNS, router, firewall, VLAN, switch,
Proxmox-network, VM/LXC, resolver, restart, reload, or flush change without exact
separate approval. PBS remains intentionally suspended for storage constraints.
Fetch Notion immediately before each write, read it back afterward, and present
the complete Daily Handoff draft before writing it.

<!-- END KECKTECH OPERATIONS POLICY 2026.08.18.1 -->







