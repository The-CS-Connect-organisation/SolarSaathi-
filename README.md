# SolarSaathi Frontend

India's solar rental platform SPA. Rent rooftop solar at 65% of the grid rate - three plans (Micro, Residential, Industrial), zero upfront cost, free installation, monitoring and maintenance included.

This repository contains only the frontend. The API and database live in the sibling backend repository.

Expected local checkout layout:

```text
SolarSaathi/
  SolarSaathi-/          frontend repository (this repo)
  SolarSaathi-backend/   backend API + database repository
```

## Requirements

- A modern browser
- Node.js **22.5+** only if you want to run the backend (tested on Node 24.14.0)
- No frontend build step and no frontend package installation

## Run the full app

The backend serves this frontend automatically when the two sibling folders are checked out together:

```powershell
cd ..\SolarSaathi-backend
npm start
```

Open http://localhost:3000. The backend injects the server snapshot into `index.html`, hydrates the frontend, and serves both the SPA and `/api` from the same origin.

If the frontend checkout has a different name, point the backend at it:

```powershell
$env:FRONTEND_DIR='C:\Users\ganes\SolarSaathi\SolarSaathi-frontend'
npm start
```

You can still open `index.html` directly or serve this folder with any static server. Without the backend, the app uses the original localStorage-only mode.

## Presentation mode

The bottom-right pill always shows the current mode: **Backend connected** or **Local demo mode**.

- Start the backend before presenting; stop it when done.
- If the backend stops mid-demo, the next server call fails over automatically: the pill flips to **Local demo mode** and the app continues on the last synced local data.
- Log in while the backend is running — the offline fallback reuses the synced session and data.

## Demo accounts

| Role  | Email                 | Password |
|-------|-----------------------|----------|
| Admin | `admin@admin.com`     | `123`    |
| User  | `user123@123mail.com` | `123`    |

Plus 10 seeded demo customers, all with password `123`. New accounts can also be created from `#/register`.

## Routes

| Route        | Screen                                                      |
|--------------|-------------------------------------------------------------|
| `#/`         | Marketing home                                              |
| `#/plans`    | Plans and booking flow                                      |
| `#/how`      | How it works                                                |
| `#/about`    | About                                                       |
| `#/contact`  | Contact form                                                |
| `#/faq`      | FAQ                                                         |
| `#/login`    | Login                                                       |
| `#/register` | Registration                                               |
| `#/dashboard`| Customer dashboard                                         |
| `#/vendorapp`| Vendor app                                                 |
| `#/ops`      | Ops Console for admins                                      |
| `#/admin`    | Classic admin panel for admins                              |
| `#/sunalyzer`| Solar analysis page                                         |

## Frontend files

| File          | Purpose                                                     |
|---------------|-------------------------------------------------------------|
| `index.html`  | SPA shell, pages and navigation                             |
| `styles.css`  | Shared styles                                               |
| `app.js`      | Customer, marketing and admin UI logic                      |
| `vendor.js`   | Vendor app UI                                               |
| `ops.js`      | Ops Console UI                                              |
| `admin.js`    | Legacy admin stub                                           |
| `api-client.js` | Server snapshot hydration and `/api` fetch wrapper       |
| `Sunalyzer/`  | Separate Flask-style prototype assets, not required by Node |

## Backend integration

When served by the backend:

1. The server reads the signed-in user from the `ss_session` cookie.
2. It injects `window.__SS_BOOTSTRAP__` into `index.html` before `api-client.js`.
3. `api-client.js` hydrates the synchronous localStorage cache and exposes `window.SSAPI`.
4. All mutations go through relative `/api` requests on the same origin.

No frontend environment variables are required for this shared-server setup.
