# PROMPTS.md: AI Pair-Programming Log

This log documents the iterative prompts, architectural decisions, code reviews, and corrections made while building **Lotline: Car Dealership Inventory System** using Claude as an AI pairing assistant.

- **Developer:** Chinmay
- **Tooling:** Claude Code (VS Code Extension / Terminal), Model: Claude Opus
- **Approach:** Strict Test-Driven Development (Red → Green → Refactor), defensive architecture, and domain-driven design.

---

## 1. Project Inception & Architecture Planning

### Prompt 1.1: Kata Ingestion & Architecture Selection
> "Here is the Incubyte AI Kata problem statement for the Car Dealership Inventory System. Let's analyze all requirements: user auth, inventory listing, partial search, admin CRUD, purchase/restock rules, and test-first TDD methodology. Let's pick a clean, robust stack with zero devops friction and design the architecture. What do you recommend?"

**AI Response:**
Suggested an Express 5 + TypeScript backend with an in-memory repository pattern, and a React + Vite frontend.

**My Input & Critique:**
> "In-memory maps won't satisfy real persistence across server restarts, while external Postgres adds setup friction. Let's use `better-sqlite3` file-backed storage for persistence in `backend/data/dealership.db`, but design our repositories with dependency injection so our Vitest test suite runs in pure `:memory:` mode for lightning-fast isolation. Follow SOLID: separate HTTP routes, business services, and repository layers."

---

## 2. Test-Driven Development: Auth & Role Security

### Prompt 2.1: Authentication Engine (Red → Green)
> "Let's build the authentication module test-first. Write unit and integration tests for `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/me`. Require bcrypt password hashing, 8+ character minimum password validation, and signed JWT tokens."

**AI Response:**
Scaffolded Vitest tests and implementation for `authService.ts` and `authRoutes.ts`.

**My Input & Correction (Stale Claims Flaw):**
> "Your `authenticate` middleware is extracting `{ role }` directly from the decoded JWT payload and trusting it. If an admin demotes a user or updates their credentials, the stale token would still have admin access. Rewrite the middleware to verify the token signature, but always look up the current active role from the database. Also, ensure login error messages are generic ('Invalid email or password') so we don't leak user enumeration."

---

## 3. Vehicle Inventory Engine & Concurrency Safety

### Prompt 3.1: Inventory CRUD & Search Filters
> "Let's implement the vehicle repository and service. We need `make`, `model`, `category`, `price`, and `quantity`. Support partial, case-insensitive search by make and model, exact category filtering, and min/max price range bounds. Write failing integration tests first."

**AI Response:**
Implemented `vehicleRepository.ts` with SQL queries and search filters.

### Prompt 3.2: Critical Concurrency Review (Overselling Prevention)
> "Look at the `purchase` method. You did a `SELECT quantity` followed by an `UPDATE vehicles SET quantity = quantity - ?`. In a high-traffic lot with concurrent buyers, two simultaneous requests will read `quantity = 1` and both succeed, driving stock negative. This is a severe race condition. How do we make this completely atomic in SQLite?"

**AI Response & Refactor:**
Enforced an atomic conditional update:
```sql
UPDATE vehicles SET quantity = quantity - ? WHERE id = ? AND quantity >= ?;
```
If `changes === 0`, it throws a 409 Conflict error.

**My Input & Stress Test:**
> "Now write a dedicated concurrency test where 5 simultaneous asynchronous purchase requests compete for a car with only 2 units in stock. Assert that exactly 2 succeed and 3 receive 409 Conflict, and verify the final stock in the database is exactly 0."

---

## 4. Indian Market Localization & Real Inventory

### Prompt 4.1: Domain Localization to Indian Automotive Market
> "The default seed data has generic US sedans with dollar pricing. Let's make this project authentic to the Indian automotive market:
> 1. Seed 20 popular Indian cars across Hatchbacks, Sedans, SUVs, MPVs, and EVs (e.g. Maruti Suzuki Swift, Hyundai i20, Tata Nexon, Mahindra Thar, Mahindra XUV700, Hyundai Creta, Kia Seltos, Toyota Fortuner, Honda City, Skoda Slavia, VW Virtus, Innova Hycross, Tata Punch EV, MG Windsor EV, Mahindra BE 6, Tata Curvv EV, BYD Seal, MG Cyberster).
> 2. Format all prices in INR (`₹`) with Indian numbering format (`en-IN` Lakhs/Crores).
> 3. Seed the MG Cyberster with `quantity: 0` so we can visually demonstrate the disabled 'Sold Out' stamp required by the Kata brief."

**AI Response:**
Updated seed script with Indian vehicles, price formatting helpers in `format.ts`, and added `npm run seed:reset`.

---

## 5. Vehicle Photography & Multi-Image Gallery

### Prompt 5.1: Real Photography & Interactive Gallery Modal
> "Window stickers with plain text look dry. Let's add real photos for every Indian vehicle. When a user clicks on any car card, open an interactive multi-image gallery modal with 4–5 genuine photos, next/previous arrow controls, keyboard navigation (`←`/`→`), a thumbnail ribbon, and vehicle specs."

**AI Response:**
Built `VehicleGalleryModal.tsx` and wrote a downloader script using Wikimedia Commons.

### Prompt 5.2: Rate-Limit Debugging & Image Verification
> "The downloader hit Wikimedia HTTP 429 rate limits because of generic User-Agent headers and strict title matching. Let's add proper headers (`User-Agent: CarGalleryDownloader/1.2 (chinmay brooxxhh@gmail.com)`), add model aliases (e.g. Innova Zenix for Hycross, Cloud EV for Windsor, Sea Lion 07 for Sealion), and download all 98 photos locally into `frontend/public/car_images/`."

### Prompt 5.3: Manual Asset QA & Correction (Windsor EV)
> "I reviewed the downloaded car images. For the MG Windsor EV, photo 01 was an incorrect model. I deleted the wrong image and added the correct one as `Wind.webp`. Update the database record, seed script, and `carGalleries.ts` so the new image is used seamlessly."

---

## 6. Order Audit Ledger & Business Reporting

### Prompt 6.1: Immutable Purchase Ledger
> "Right now, purchasing just decrements `quantity`. In a real dealership, every sale must generate an immutable order receipt. Create an `orders` table tracking buyer ID, vehicle snapshot (make, model, price), quantity, total amount, and timestamp. Create `GET /api/orders/my` for customer purchase history and `GET /api/orders` for admin sales reporting."

**AI Response:**
Implemented `orderRepository.ts`, `orderService.ts`, `orderRoutes.ts`, and `OrdersModal.tsx`.

**My Input:**
> "On the admin view, display aggregate business metrics up top: Total Units Sold and Total Dealership Revenue in `₹`, followed by the chronological buyer order ledger."

---

## 7. Customer Support & Enquiry System

### Prompt 7.1: Contact Page & Enquiry Modal
> "Car buyers always want to enquire about test drives, financing, or RTO registration. Let's add an Enquiry system and a dedicated Help & Contact page:
> 1. Add an 'Enquire' button on each vehicle card and inside the photo gallery modal.
> 2. Include my contact details: Name: Chinmay, Phone: 8956122815, Email: brooxxhh@gmail.com.
> 3. Provide direct one-click WhatsApp chat (`https://wa.me/918956122815?text=...`) pre-filled with the selected car and price, a click-to-call button, and an interactive enquiry form.
> 4. Build a dedicated `/help` page accessible from the top navigation bar with showroom info and an Indian automotive purchase FAQ."

**AI Response:**
Created `EnquiryModal.tsx`, `dealershipContact.ts`, `ContactHelpPage.tsx`, and mounted the routes in `App.tsx`.

---

## 8. Developer Experience, OpenAPI & Containerization

### Prompt 8.1: Server-Side Sorting & CSV Export
> "Let's add two features that make inventory management easy:
> 1. Server-side sorting with query parameter `sortBy` (`price_asc`, `price_desc`, `make_asc`, `newest`), backed by database indexes on `price`, `category`, and `make/model`.
> 2. Admin CSV export endpoint `GET /api/vehicles/export/csv` and an 'Export CSV' button in the dashboard that downloads `dealership_inventory.csv`."

### Prompt 8.2: Interactive OpenAPI / Swagger UI
> "Recruiters and API consumers should be able to explore and test our endpoints interactively without external tools like Postman. Implement an embedded OpenAPI 3.0 specification with Swagger UI on `GET /api/docs`."

### Prompt 8.3: Dockerization & Submission Cleanup
> "Create a multi-stage `Dockerfile` and `docker-compose.yml` so the whole stack builds and runs with `docker compose up --build`. Before I submit the git repository, remove all temporary scraping scripts, scratch files, and internal PDFs so only clean, production code is committed."

---

## Summary of Candidate Contributions & AI Corrections

| Area | Initial AI Proposal | My Critique & Architectural Correction |
|---|---|---|
| **Persistence** | In-memory JavaScript arrays | Insisted on file-backed SQLite with in-memory test isolation |
| **Concurrency** | Read-then-write stock check | Enforced atomic `UPDATE ... WHERE quantity >= ?` and added 5-buyer race condition test |
| **Security** | Trusted role in JWT payload | Required database role verification on every authenticated request |
| **Authorization** | BOLA loophole on vehicle mutations | Enforced strict `adminOnly` guards on `POST /api/vehicles` and `PUT /api/vehicles/:id` |
| **Market Relevance** | Generic US cars in USD ($) | Replaced with 20 real Indian market cars in INR (`₹`) with Lakh formatting |
| **Asset Quality** | Unsplash generic car photos | Downloaded 98 open-license Wikimedia photos, inspected and replaced incorrect Windsor EV image |
| **Business Value** | Simple stock counter | Designed full Order Audit Ledger, customer receipts, and admin revenue dashboard |
| **Customer Journey** | Purchase button only | Added multi-photo modal, direct WhatsApp/phone enquiry with Chinmay, and `/help` page |
