# Architecture

One NestJS application, one SQLite file, four modules. The HCM (the external source of truth for balances) is represented by an in-process mock so the whole flow runs and tests without a network.

```
client ──HTTP──> TimeOffRequestController ──> TimeOffRequestService ──> MockHcmService (real-time)
                 TimeOffBalanceController ──> TimeOffBalanceService ──┐
                 SyncLogController ───────> SyncLogService ──cron──> MockHcmService.getBatch()
                 MockHcmController (test controls: set-balance, fail-next)
                                                                        └──> SQLite via TypeORM
```

## Request state machine

A `TimeOffRequestEntity` row is written first, then moved exactly once.

| From | Trigger | To | Side effects |
|---|---|---|---|
| (new) | `POST /requests` passes validation (`employeeId` non-empty, ISO dates, `requestedDays` at least 0.5) | `PENDING` | row saved; audit line with caller IP |
| `PENDING` | HCM accepts (`processTimeOff` returns success) | `APPROVED` | local balance for the employee reduced by `requestedDays`; audit line |
| `PENDING` | HCM refuses (unknown employee, insufficient balance) | `REJECTED` | `rejectionReason` stored from the HCM reason; audit line |
| `PENDING` | HCM throws (unavailable, 5xx) | `SYSTEM_ERROR` | `rejectionReason` = "HCM System Unavailable"; local balance untouched; audit line |

Terminal states are `APPROVED`, `REJECTED` and `SYSTEM_ERROR`. There is no retry path inside the service: a `SYSTEM_ERROR` request stays as a record of the failed attempt and the employee submits again. The response to the original HTTP call carries the final state, so the caller never sees `PENDING`.

## Sync job

`SyncLogService.handleNightlySync` runs at midnight (`@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)`) and on demand via `POST /sync/trigger`.

1. A `SyncLogEntity` row is created with status `IN_PROGRESS`.
2. The HCM batch endpoint (`MockHcmService.getBatch`) returns every employee balance.
3. Each record is written into the local balance table with `TimeOffBalanceService.setBalance(employeeId, locationId, balanceDays)`. The mock batch carries no location, so the service uses the single location `loc-1` (noted as a limitation in the TRD; a real HCM batch is per employee per location).
4. The log row ends as `SUCCESS` with the record count, or `FAILED` with the error message if the batch call throws.

The local balance table is a cache: the HCM stays authoritative, the batch refreshes the whole cache, and the synchronous request flow keeps it consistent between refreshes.

## Mock HCM

`MockHcmService` holds an in-memory map of balances (seeded with three employees) and two behaviours the tests drive:

- `getBalance` and `processTimeOff` throw `HCM Unavailable` once after `setFailNextRequest(true)`, which the e2e suite uses to produce `SYSTEM_ERROR` and a `FAILED` sync.
- `processTimeOff` refuses unknown employees and insufficient balances with a reason, and subtracts the days on success.

`MockHcmController` exposes the same service over HTTP (`GET /hcm/batch`, `GET /hcm/balance/:employeeId`, `POST /hcm/timeoff`) plus the two test controls (`POST /hcm/test/set-balance`, `POST /hcm/test/fail-next`). Replacing the mock with a real HCM means implementing the same three calls in a new provider and binding it in place of `MockHcmService`; nothing else in the request or sync flow needs to change.

## Persistence

SQLite through TypeORM with `synchronize` on, four entities: `TimeOffRequestEntity`, `TimeOffBalanceEntity`, `SyncLogEntity` and the employee fields embedded on the balance. The e2e tests run in band because SQLite locks the file.
