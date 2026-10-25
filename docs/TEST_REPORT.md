# Test Report

Generated on 2026-10-25 with `npm run test:coverage` from the repository root (Vitest 5, Node 22, Windows 11).
The complete raw output is in [backend-test-output.txt](backend-test-output.txt) and [frontend-test-output.txt](frontend-test-output.txt).

## Summary

| Suite    | Test files | Tests | Result        | Statements | Branches | Functions | Lines  |
| -------- | ---------- | ----- | ------------- | ---------- | -------- | --------- | ------ |
| Backend  | 11         | 174   | ✅ all passed | 99.7%      | 95.09%   | 100%      | 99.68% |
| Frontend | 16         | 125   | ✅ all passed | 91.2%      | 88.91%   | 86.63%    | 93.78% |
| **Total**| **27**     | **299** | ✅          |            |          |           |        |

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
| `tests/integration/vehicles.api.test.ts` | 401 on every protected route, `POST/GET/PUT/DELETE /api/vehicles…`, `GET /api/vehicles/search` (filters and sorting), admin-only CSV export, validation errors, admin-only delete (403) |
| `tests/integration/inventory.api.test.ts` | `POST /:id/purchase` (incl. 5 concurrent buyers for 2 units, so no overselling), `POST /:id/restock` (admin only), invalid bodies |
| `tests/integration/orders.api.test.ts` | Purchases recorded as orders, `GET /api/orders/my`, admin-only `GET /api/orders` with revenue totals |

## Frontend (React + Testing Library)

| File | What it covers |
| ---- | -------------- |
| `src/api/client.test.ts` | Fetch wrapper: JSON, bearer token, 204, server errors with details, non-JSON errors, network failures |
| `src/api/endpoints.test.ts` | Every endpoint helper calls the right URL / method / body, including orders and the CSV download |
| `src/context/AuthContext.test.tsx` | Login, register, logout, admin flag, session restore, rejected stored token |
| `src/components/VehicleCard.test.tsx` | Price formatting, stock text, **Purchase disabled at zero stock**, admin-only actions |
| `src/components/SearchFilters.test.tsx` | Filters submitted, categories listed, min > max blocked, clear |
| `src/components/VehicleForm.test.tsx` | Add / edit modes, client validation, server field errors |
| `src/components/Modal.test.tsx` | Modal accessibility, confirm dialog, restock form |
| `src/components/RouteGuards.test.tsx` | Protected / guest route redirects and loading state |
| `src/pages/AuthPages.test.tsx` | Sign-in and registration flows and errors |
| `src/pages/DashboardPage.test.tsx` | Loading / empty / error states, search, in-stock toggle, purchase, admin add / edit / restock / delete, expired session |
| `src/App.test.tsx` | Routing and the signed-in header |
| `src/components/OrdersModal.test.tsx` | Customer purchase history, admin sales ledger with totals, empty and error states |
| `src/components/VehicleGalleryModal.test.tsx` | Photo navigation (arrows, keyboard, thumbnails), fallback image, purchase disabled when sold out, close / enquire |
| `src/components/EnquiryModal.test.tsx` | Prefilled message, submit confirmation, WhatsApp link |
| `src/pages/ContactHelpPage.test.tsx` | Back link, enquiry form confirmation and reset |
| `src/data/carGalleries.test.ts` | Mapping make/model to a photo set, fallbacks |

## End-to-end check

Besides the automated suites, the full stack was exercised in a real Chrome browser (Playwright), against the running API and a file-backed SQLite database:
register → browse → purchase (stock 12 → 11, toast) → photo gallery → search (Compact SUV, max ₹15,00,000) → sign out → admin sign in → sales ledger → add-vehicle form → delete confirmation → sold-out car with Purchase disabled → mobile layout (no horizontal scroll). No page errors were raised. The README screenshots come from this run (2026-10-25).