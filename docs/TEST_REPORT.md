# Test Report

Generated on 2026-10-23 with `npm run test:coverage` from the repository root (Vitest 5, Node 22, Windows 11).
The complete raw output is in [backend-test-output.txt](backend-test-output.txt) and [frontend-test-output.txt](frontend-test-output.txt).

## Summary

| Suite    | Test files | Tests | Result        | Statements | Branches | Functions | Lines  |
| -------- | ---------- | ----- | ------------- | ---------- | -------- | --------- | ------ |
| Backend  | 10         | 158   | ✅ all passed | 100%       | 96.89%   | 100%      | 100%   |
| Frontend | 11         | 95    | ✅ all passed | 96.59%     | 95.19%   | 94.52%    | 97.35% |
| **Total**| **21**     | **253** | ✅          |            |          |           |        |

## Backend (Express + SQLite)

| File | What it covers |
| ---- | -------------- |
| `tests/unit/database.test.ts` | Schema creation, the database persisting to a file across connections, the `CHECK` constraint on stock |
| `tests/unit/userRepository.test.ts` | Unique ids, case-insensitive email lookup and uniqueness |
| `tests/unit/vehicleRepository.test.ts` | CRUD, search filters (partial make/model, exact category, inclusive price range, LIKE-wildcard escaping), atomic stock changes |
| `tests/unit/authService.test.ts` | Registration (hashing, email normalisation, duplicates, concurrent duplicates), login, JWT verification (forged, expired and orphaned tokens, role taken from DB), admin seeding |
| `tests/unit/vehicleService.test.ts` | Business rules: trimming, price-range validation, purchase (default / custom amount, insufficient stock, sold out), restock, not-found errors |
| `tests/unit/config.test.ts` | Environment defaults, overrides, required `JWT_SECRET` in production, invalid port |
| `tests/unit/middleware.test.ts` | Error mapping (4xx, 413, hidden 500s, logging) and the role guard |
| `tests/integration/auth.api.test.ts` | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, malformed JSON, health check, unknown routes |
| `tests/integration/vehicles.api.test.ts` | 401 on every protected route, `POST/GET/PUT/DELETE /api/vehicles…`, `GET /api/vehicles/search`, validation errors, admin-only delete (403) |
| `tests/integration/inventory.api.test.ts` | `POST /:id/purchase` (incl. 5 concurrent buyers for 2 units, so no overselling), `POST /:id/restock` (admin only), invalid bodies |

## Frontend (React + Testing Library)

| File | What it covers |
| ---- | -------------- |
| `src/api/client.test.ts` | Fetch wrapper: JSON, bearer token, 204, server errors with details, non-JSON errors, network failures |
| `src/api/endpoints.test.ts` | Every endpoint helper calls the right URL / method / body |
| `src/context/AuthContext.test.tsx` | Login, register, logout, admin flag, session restore, rejected stored token |
| `src/components/VehicleCard.test.tsx` | Price formatting, stock text, **Purchase disabled at zero stock**, admin-only actions |
| `src/components/SearchFilters.test.tsx` | Filters submitted, categories listed, min > max blocked, clear |
| `src/components/VehicleForm.test.tsx` | Add / edit modes, client validation, server field errors |
| `src/components/Modal.test.tsx` | Modal accessibility, confirm dialog, restock form |
| `src/components/RouteGuards.test.tsx` | Protected / guest route redirects and loading state |
| `src/pages/AuthPages.test.tsx` | Sign-in and registration flows and errors |
| `src/pages/DashboardPage.test.tsx` | Loading / empty / error states, search, in-stock toggle, purchase, admin add / edit / restock / delete, expired session |
| `src/App.test.tsx` | Routing and the signed-in header |

## End-to-end check

Besides the automated suites, the full stack was exercised in a real Chrome browser (Playwright), against the running API and a file-backed SQLite database:
register → browse → purchase (stock 6 → 5) → search (SUV ≤ $40,000) → sign out → admin sign in → add → edit → restock a sold-out car (Purchase re-enabled) → delete → reload (session restored) → mobile layout (no horizontal scroll). No console errors were raised. The screenshots in the README come from this run.
