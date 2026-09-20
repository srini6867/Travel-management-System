# API surface

Auth: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
Metadata: GET /api/meta
Users: GET/POST /api/users, PATCH/DELETE /api/users/:id
Settings: GET/POST /api/settings/:resource, PATCH/DELETE /api/settings/:resource/:id
Trips: GET/POST /api/trips
Expenses: GET/POST /api/expenses
Diesel: GET/POST /api/diesel
Dashboard: GET /api/dashboard?month=YYYY-MM

All non-login endpoints require the access_token HTTP-only cookie.
