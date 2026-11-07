# Time-Off Microservice

This is a robust, test-driven backend microservice built with **NestJS**, **TypeORM**, and **SQLite**. It serves to manage employee time-off requests while maintaining strict synchronization with an external Human Capital Management (HCM) system. 

It handles real-time validations against the HCM and includes a nightly batch synchronization process to ensure the local database remains a highly accurate, resilient cache of the HCM "Source of Truth".

## Architecture Overview
Please read the Technical Requirements Document (`docs/TRD.md`) for a complete breakdown of the architecture, state machine, and the reasoning behind "Alternatives Considered".

## Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher recommended)

## Installation

```bash
# Install dependencies
npm install
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Running the Test Suite (Agentic Rigor)
A major focus of this project is the rigorous testing suite that validates integration with the Mock HCM server and guards against regressions.

**Sequential Testing:** Because this project uses SQLite, E2E tests run sequentially to prevent locking. The script is pre-configured with `--runInBand`.

```bash
# Run unit tests
npm run test

# Run the E2E tests (Recommended for verification)
npm run test:e2e

# Run with coverage report
npm run test:cov
```

The test suite covers:
- **Happy Path**: Successful request creation and balance deduction.
- **Strict Validation**: Edge cases for empty IDs, negative requested days, and invalid date formats.
- **Business Rejections**: Real-time rejection flow for insufficient balances in HCM.
- **Resilience**: Transition to `SYSTEM_ERROR` during HCM downtime.
- **Audit Logging**: Verification of IP attribution and audit-level logs for compliance.

## Manual Verification
The project includes a built-in **Mock HCM Controller** that allows you to manually manipulate the state for testing:

1. **Trigger Sync**: `POST /sync/trigger`
2. **View Balance**: `GET /balances/:employeeId`
3. **Submit Request**: `POST /requests`
4. **Mock HCM Controls**:
   - Set Balance: `POST /hcm/test/set-balance`
   - Inject Failure: `POST /hcm/test/fail-next` (Toggles 500 error for next request)

## Compliance & Security
- **Audit Logging**: All sensitive actions (accessing balances, submitting requests) are logged with IP attribution for auditability.
- **Input Validation**: Global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted` ensures only validated, secure payloads reach the service layer.
- **No PHI Leaks**: Internal system errors are sanitized before being returned to the client.

