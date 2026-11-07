# Time-Off Microservice - Technical Requirement Document (TRD)

## Problem Statement

ExampleHR offers a time-off request interface for employees, but the Human Capital Management (HCM) system (e.g., Workday or SAP) remains the absolute "Source of Truth" for employment data and time-off balances. Syncing balances between ExampleHR and the HCM is complex because:
- The HCM balance can change independently (e.g., a work anniversary bonus or start-of-year refresh).
- Time-off requests must be validated against the HCM to prevent overdrafts.
- The HCM might reject requests due to invalid dimension combinations (e.g., location/employee mismatch) or insufficient balances.

The employee expects instant feedback when submitting a request, and managers need to know the data is valid before approving.

## Solution

The Time-Off Microservice is a backend service built with NestJS and SQLite that manages the lifecycle of time-off requests while maintaining strong consistency with the HCM.

We will use a **Hybrid Sync Strategy** combined with a **Synchronous Strict Request Flow**:
1. **Hybrid Sync**: The system runs a nightly batch job to ingest the whole corpus of balances from the HCM. This provides a fast baseline for ExampleHR to display accurate initial balances.
2. **Synchronous Validation**: When a time-off request is made, the microservice synchronously calls the HCM's real-time API. If the HCM returns an error or is unavailable, the request fails immediately, providing the required instant feedback to the employee.

## User Stories

1. As an Employee, I want to view my current time-off balance, so that I know how many days I can request.
2. As an Employee, I want to submit a time-off request, so that I can schedule my vacation.
3. As an Employee, I want to receive instant feedback if my request is invalid or if I have insufficient balance, so that I can adjust my request immediately.
4. As a Manager, I want to know that any pending request I see has already been validated against the HCM, so that I don't approve an invalid request.
5. As an Administrator, I want the system to automatically sync with the HCM nightly, so that employees see their anniversary or annual balance updates without manual intervention.
6. As an Administrator, I want the system to handle HCM downtime gracefully by blocking new requests and logging the error, so that the systems do not fall out of sync.

## Alternatives Considered

1. **Asynchronous Request Queueing (Event-Driven)**
   - *Description*: Requests are immediately saved locally as `PENDING` and a message is published to a queue (e.g., RabbitMQ). A worker processes the queue and updates the HCM.
   - *Why it was rejected*: The requirement strictly dictates "instant feedback" for employees regarding whether their request is valid against the HCM's current state. An asynchronous approach would mean employees receive an initial "Accepted" message, only to be potentially rejected minutes later if the queue is backlogged or if the HCM rejects the request. This violates the core UX requirement.
2. **Event Sourcing / CQRS**
   - *Description*: Storing every single balance change as an event and projecting the current balance.
   - *Why it was rejected*: Over-engineering for the current scope. A simple CRUD state machine is sufficient, especially since the HCM is the ultimate Source of Truth. If we act as a cache, synchronizing the cache state via batch + synchronous validation is much simpler and equally robust for this specific problem domain.
3. **No Local Balance Storage (Pass-Through Proxy)**
   - *Description*: ExampleHR never stores balances, and queries the HCM in real-time for every page load or request.
   - *Why it was rejected*: Creates a massive single point of failure and performance bottleneck. The nightly batch sync provides a resilient caching layer so ExampleHR can display balances quickly without hitting the HCM constantly.

## Implementation Decisions

### Microservice Architecture
- Built using **NestJS** for modularity and Dependency Injection.
- **SQLite** as the relational database, managed via **TypeORM**.
- **REST API** endpoints for both ExampleHR interactions and mock HCM interactions.

### Database Schema
- **Employee**: Tracks `id`, `hcmId`, and `locationId`.
- **TimeOffBalance**: Tracks `employeeId`, `balanceDays`, and `lastSyncedAt`.
- **TimeOffRequest**: Tracks `employeeId`, `requestedDays`, and `status`.
- **SyncLog**: Tracks the status and outcome of nightly batch sync operations.

### State Machine
The `TimeOffRequest` will use the following states:
- `PENDING`: The initial state when a request is received but before HCM validation completes.
- `APPROVED`: The HCM has successfully validated and committed the request.
- `REJECTED`: The HCM denied the request (e.g., insufficient balance, invalid dimension).
- `SYSTEM_ERROR`: The HCM was unreachable or returned a 500 error.

### Mock HCM Server
To facilitate testing, a separate module within the NestJS application will act as the Mock HCM Server. It exposes:
- `GET /hcm/batch`: Returns a predefined JSON corpus of employee balances.
- `GET /hcm/balance/:employeeId`: Returns the real-time balance for an employee.
- `POST /hcm/timeoff`: Accepts time-off requests, simulates business logic (subtracting balance if sufficient), and returns success/failure codes.

## Security & Compliance

The microservice implements several features to ensure data integrity and security, drawing inspiration from HIPAA-compliant patterns:

1. **Audit Logging**: Every state transition in a time-off request (APPROVED, REJECTED, SYSTEM_ERROR) is logged with the requester's IP address, employee ID, and the specific outcome. Data access to sensitive balances is also logged.
2. **Global Input Validation**: Using `class-validator` and `class-transformer`, all incoming requests are strictly validated against DTOs. The system is configured to strip non-whitelisted properties and reject requests with extra fields (`forbidNonWhitelisted: true`).
3. **Strict Separation of Concerns**: The Mock HCM service is isolated, and production code interacts with it via a defined service layer, ensuring that business logic is decoupled from transport details.

## Testing Decisions

Since agentic development is prioritized, the value lies in the rigor of the tests. We will use Test-Driven Development (TDD) focusing on vertical slices of functionality.

- **Focus on Behavior**: Tests will verify external behavior via the public API (REST endpoints) rather than mocking internal services.
- **E2E Testing**: We will use Jest and Supertest to write End-to-End tests that spin up the NestJS app (including the Mock HCM module) and execute HTTP requests.
- **Scenarios Tested**:
  1. Creating an employee and viewing their balance after a batch sync.
  2. Submitting a valid time-off request (expecting `APPROVED` and decreased local balance).
  3. Submitting a request with insufficient balance (expecting `REJECTED`).
  4. Submitting a request when the HCM mock is configured to fail (expecting `SYSTEM_ERROR`).
  5. Running the batch sync to update local balances with simulated external HCM changes.

## Out of Scope
- A frontend user interface (ExampleHR UI).
- Authentication and Authorization (assumed to be handled by an API Gateway or ExampleHR middleware).
- Complex approval workflows (manager routing). The scope focuses strictly on the exampleHR-to-HCM balance integrity and the request lifecycle.
