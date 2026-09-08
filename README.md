# SolarSaathi — Solar on Rent at 65% of Grid Rate ☀️

India's solar rental platform SPA (vanilla HTML/CSS/JS, Tailwind CDN, localStorage persistence).
Rent rooftop solar at 65% of your grid rate — 3 plans: Micro, Residential, Industrial. Zero upfront cost, free installation, 24×7 monitoring, maintenance included.

## Run it

Open `index.html` in a browser (or serve the folder with any static server, e.g. `npx serve .`).
Everything runs client-side — no build step, no backend.

## Demo accounts

| Role  | Email                  | Password |
|-------|------------------------|----------|
| Admin | `admin@admin.com`      | `123`    |
| User  | `user123@123mail.com`  | `123`    |

Plus **10 seeded demo customers** (e.g. `sunita.devi@demo.in`, `mohammed.irfan@demo.in`, password `123`).
The user demo account (Raju Bhai) gets a **live Residential plan in Pune with 5 months of payment history**, so the dashboard is fully populated on first login.

## Seeded demo data

On first load (flag `solarSaathi.seeded.v3` in localStorage), the app generates deterministic demo data:

- **11 bookings** across every pipeline stage (6 Live, plus survey / allotment / installed stages), spread over 10 districts and all 3 plans
- **~25 payment records** over the last 5 months per live plan (with a realistically skipped month here and there)
- **2 removal/support requests** (1 pending, 1 approved)
- **3 admin notifications**
- Numbers are seeded with a fixed PRNG seed, so they're stable across reloads. Use **Admin → Re-seed demo data** to wipe and regenerate.

## User dashboard (`#/dashboard`)

- Stats: active plans, district grid rate vs **your 65% rate**, monthly + yearly savings
- **Grid vs Solar chart (last 6 months)** — monthly bars comparing what the grid would have cost vs the SolarSaathi bill, with totals saved
- Per live plan: units used, daily average, panel efficiency, days live, and the red (grid) vs green (solar) bill-breakdown cards
- **Consumption & payments table** — total paid all-time, grid-would-cost vs paid vs saved over 6 months, plus the full payment ledger with month + method
- Installation progress tracker for non-live plans (survey → allotment → install → net-meter → live)
- Manage plans: request removal, cancel bookings, view all district rates (grid vs 65%)

## Admin panel (`#/admin`) — comprehensive

Seven tabs, everything in one place:

1. **Bookings** — all bookings with search, status dropdown updates, resource allotment modal (equipment suggestions, technician, install date), mark-installed, delete
2. **Notifications** — auto-generated feed with unread badge + mark-all-read
3. **Removal Requests** — approve/reject with admin notes (approval removes the booking)
4. **Users** — full roster + **View** drill-down per user: bookings, live MRR, payment history, 6-month savings
5. **Payments** — full ledger: collected vs pending vs expected (6-mo run-rate), search, status filter, mark-paid
6. **Analytics** — pipeline funnel (bookings per stage), revenue by district, and a **grid-vs-solar savings table per customer**
7. **District Rates** — grid rate vs 65% rate vs savings per unit for all 20 districts

Header stats: users, bookings, live, pending, **MRR + ARR**, **ARPU**, **collected payments**.
Actions: **Re-seed demo data**, **Export JSON** (bookings, payments, requests, notifications, users).

## How pricing works

- `district.gridRate` (₹/unit, 20 districts) × **0.65** = the customer's locked rate
- Example: Pune grid ₹8.5/unit → SolarSaathi ₹5.53/unit → a 300-unit home pays ₹1,658/mo instead of ₹2,550
- Customer savings = units × (gridRate − ourRate); the dashboards compute this from seeded 6-month usage series with seasonal variation (summer peak)
