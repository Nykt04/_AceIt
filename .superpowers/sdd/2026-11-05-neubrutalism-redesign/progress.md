# SDD ledger — plan: docs/superpowers/plans/2026-11-05-neubrutalism-redesign.md

## Pre-flight Interface Check
- Task 1 produces: `BRUTAL_TOKENS` and theme keys (`borderWidth`, `shadowOffset`, `card`, `shadow`, `brandSecondary`, `accent`). Consumed by Task 2, 3, 4. Match verified.
- Task 2 produces: `BrutalCard`, `BrutalButton`, `BrutalSkeleton`, `BrutalBadge`, `BrutalInput`. Consumed by Task 3 and Task 4. Match verified.
- Task 3 produces: Neubrutalist `Navbar` and `Sidebar`. Consumed by app shell. Match verified.
- Task 4 produces: Neubrutalist `HomeScreen`, `SetDetailScreen`, `StudyScreen`. Match verified.
- Task 5 verifies end-to-end web build. Match verified.

## Execution Progress
- [x] Task 1: Neubrutalist Tokens & ThemeContext Backward-Compatible Adapter (commit: c3e6708)
- [x] Task 2: Core Neubrutalist UI Primitives (commit: a450677)
- [x] Task 3: Redesign Navigation Shell (Navbar & Sidebar) (commit: 868317b)
- [x] Task 4: Redesign Core Study Screens (HomeScreen, SetDetailScreen, StudyScreen) (commit: 077a587)
- [ ] Task 5: End-to-End Build Verification & Impeccable Detector
