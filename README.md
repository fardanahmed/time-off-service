# Time-Off Microservice

[![CI](https://github.com/fardanahmed/time-off-service/actions/workflows/ci.yml/badge.svg)](https://github.com/fardanahmed/time-off-service/actions/workflows/ci.yml)

A small NestJS service that manages employee time-off requests while an external Human Capital Management (HCM) system stays the source of truth for balances. Built in May 2026 for a backend take-home assignment; the assignment is summarised in [docs/ASSIGNMENT.md](docs/ASSIGNMENT.md), the design in [docs/TRD.md](docs/TRD.md) and the moving parts in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Stack: NestJS 11, TypeORM, SQLite, `@nestjs/schedule`, `class-validator`, Jest and Supertest.

## What it does

- **Request lifecycle as a state machine.** A request is saved as `PENDING`, validated synchronously against the HCM, and ends as `APPROVED` (local balance reduced), `REJECTED` (reason stored) or `SYSTEM_ERROR` (HCM unreachable or returned an error). The employee gets the outcome in the same HTTP response.
- **Nightly sync.** A scheduled job pulls the whole balance corpus from the HCM batch endpoint so independent changes (anniversary bonus, yearly refresh) land in the local cache. `POST /sync/trigger` runs it on demand; every run is recorded in a sync log.
- **Defensive by default.** HCM errors are not trusted to be complete, so the service validates input itself (`ValidationPipe` with `whitelist` and `forbidNonWhitelisted`), stores the failure state instead of guessing, and returns sanitised errors to the client.
- **Audit lines.** Request outcomes and balance reads are logged with the caller IP and employee id.
- **Mock HCM in-process.** A `MockHcmService` and controller stand in for the real HCM so the e2e suite can set balances and inject failures.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/balances/:employeeId` | Local balance for an employee |
| `POST` | `/balances` | Create a local balance record |
| `POST` | `/requests` | Submit a time-off request (`employeeId`, `startDate`, `endDate`, `requestedDays` with a 0.5-day minimum) |
| `POST` | `/sync/trigger` | Run the HCM batch sync now |
| `GET` | `/hcm/batch` | Mock HCM: whole balance corpus |
| `GET` | `/hcm/balance/:employeeId` | Mock HCM: real-time balance |
| `POST` | `/hcm/timeoff` | Mock HCM: book time off |
| `POST` | `/hcm/test/set-balance` | Test control: set a mock balance |
| `POST` | `/hcm/test/fail-next` | Test control: make the next HCM call fail |

## Run it

```bash
npm install
npm run start:dev      # http://localhost:3000, SQLite file timeoff.sqlite is created on first run
```

## Tests

```bash
npm test               # 7 unit tests
npm run test:e2e       # 16 end-to-end tests, run in band because of SQLite locking
npm run test:cov       # unit coverage report
```

The e2e suite spins up the whole app with the mock HCM and drives it over HTTP: approval with balance deduction, rejection on insufficient balance, `SYSTEM_ERROR` when the HCM fails, nightly sync success and failure, balance 404 and creation, and validation edge cases (empty id, negative or sub-half-day amounts, bad dates, extra fields, half days, requesting exactly the remaining balance).

CI (`.github/workflows/ci.yml`) runs lint, build, unit and e2e tests on every push.

## Out of scope

No authentication (assumed to sit in front of the service), no manager approval routing, no UI. See the TRD for the alternatives that were considered and why they were not chosen.

## License

MIT, see [LICENSE](LICENSE).
