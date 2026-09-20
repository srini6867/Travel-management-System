# Sri Sugam Travels — ERP Trip Management System

A responsive ERP-style rebuild based on the uploaded screen recording. It preserves the observed visual language: teal header, white cards, light gray workspace, compact forms, dashboard charts, trip history, expenses, diesel log, reports, and Settings CRUD.

## Stack

- Frontend: React + Vite + React Router + Recharts + Lucide React
- Backend: Node.js + Express + Prisma ORM + SQLite (easy local setup; switch datasource to PostgreSQL for production)
- Authentication: JWT in an HTTP-only cookie
- Authorization: Admin / Manager / Staff roles

## Features

- Login and logout
- Admin-only user CRUD: create, edit, activate/deactivate, delete
- Settings CRUD: Routes, Vehicles, Clients, Drivers, Cleaners, Expense Types, Users
- Trip creation with revenue, distance, rate, expenses and automatic profit
- Trip history with filters
- Expense entry and filtered listing
- Diesel log entry and filtered listing
- Dashboard metrics, monthly trend, expense breakdown, client profit, vehicle summary
- Reports pages and CSV export endpoint
- Responsive layout with mobile navigation drawer
- Protected backend routes and role checks

## Run locally

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
npm run seed
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:4000

### Default admin

- Username: `admin`
- Password: `admin123`

Change the password immediately in a real deployment. `JWT_SECRET` should also be set in production.

## Environment

Copy `backend/.env.example` to `backend/.env`.

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
```

## Production

1. Replace SQLite with PostgreSQL in `backend/prisma/schema.prisma`.
2. Set a strong `JWT_SECRET`.
3. Build the frontend with `npm run build`.
4. Serve the frontend from a CDN/Nginx and the API behind HTTPS.
5. Use secure cookies, CSRF protection where applicable, rate limiting and an audit log before exposing it publicly.
