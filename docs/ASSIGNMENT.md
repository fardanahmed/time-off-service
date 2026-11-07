# The assignment, in my own words

This service was built for a backend take-home assignment in May 2026. The original brief is not reproduced here; this is a summary of what it asked for.

**Context.** An HR product lets employees request time off, but an external Human Capital Management (HCM) system (think Workday or SAP) stays the source of truth for balances. Balances can change in the HCM independently (a work-anniversary bonus, a start-of-year refresh), so the two systems drift unless the service is careful.

**What the HCM offers.** A real-time API to read or write a balance for one employee at one location, a batch endpoint that returns the whole corpus of balances, and error responses for invalid dimension combinations or insufficient balance. The brief warned that those errors are not guaranteed, so the service has to be defensive.

**The task.** Build a Time-Off microservice that manages the lifecycle of a request and keeps balance integrity: REST endpoints for balances and requests, a sync with the HCM, and mock HCM endpoints for the test suite. Balances are per employee per location.

**How it was judged.** A Technical Requirements Document with the challenges, the chosen solution and the alternatives considered; a test suite rigorous enough to guard against regressions; the code in a repository with proof of coverage. The brief asked for agentic development (no hand-written code) with NestJS and SQLite.

The TRD is in `TRD.md` next to this file.
