# Deep UI reverse-engineering notes

Observed from the supplied 2m49s screen recording:

- Login route at `/login`: full teal background, centered white card, circular transport icon, Sri Sugam Travels title/subtitle, username/password fields, teal Sign In button and bottom company footer.
- Persistent top navigation after login: transport logo + brand; Dashboard, Add Trip, History, Expenses, Diesel Log, Reports; user name; Settings and logout icons.
- Workspace uses pale gray background, max-width centered content and rounded white cards.
- Dashboard: month selector; KPI cards; monthly bar trend; expense pie; client-wise profit sheet; vehicle summary.
- Add Trip: trip data and expenses split into cards, automatic trip amount and profit calculation, Save Trip CTA.
- History: month/vehicle/client filters and stacked trip rows with route, vehicle/client, amount and profit.
- Expenses: add expense form + load/view entries.
- Diesel Log: vehicle/date/amount/payment method/note, orange save CTA.
- Reports: left report selector and invoice generation cards for PRO FORMA and monthly invoice.
- Settings: vertical resource menu for Routes, Vehicles, Clients, Drivers, Cleaners, Expense Types, Users. Users table includes Name, Username, Role, Status and edit/delete actions plus Add User.

The implementation keeps the same visual hierarchy and responsive breakpoints while replacing screenshot-only/static behavior with real API calls and database-backed CRUD.
