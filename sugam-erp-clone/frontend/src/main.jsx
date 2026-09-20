import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import {
  BrowserRouter,
  useNavigate,
  Routes,
  Route,
  Navigate,
  NavLink
} from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History as HistoryIcon,
  ReceiptIndianRupee,
  Fuel,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  BusFront,
  ChevronDown,
  Edit3,
  Trash2,
  Plus,
  Save,
  Download,
  Users,
  Route as RouteIcon,
  CarFront,
  BriefcaseBusiness,
  UserRoundCog,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const fmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const api = async (path, opts = {}) => {
  const r = await fetch(API + path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    },
    ...opts
  });

  const text = await r.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!r.ok) {
   throw new Error(data?.error || `Request failed (${r.status})`);
  }

  return data;
};

const money = (n) => fmt.format(Number(n || 0));

const dateInput = (d = new Date()) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};

const monthInput = (d = new Date()) => dateInput(d).slice(0, 7);

const AuthContext = React.createContext(null);

const useAuth = () => React.useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/auth/me')
      .then((x) => setUser(x.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function Protected({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="splash">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

const nav = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/add-trip', 'Add Trip', PlusCircle],
  ['/history', 'History', HistoryIcon],
  ['/expenses', 'Expenses', ReceiptIndianRupee],
  ['/diesel-log', 'Diesel Log', Fuel],
  ['/reports', 'Reports', FileText]
];

function AppShell({ children }) {
  const { user, setUser } = useAuth();
  const [mobile, setMobile] = useState(false);
  const navg = useNavigate();

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      navg('/login');
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <BusFront size={20} />
          <span>Sri Sugam Travels</span>
        </div>

        <nav className={mobile ? 'nav open' : 'nav'}>
          {nav.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobile(false)}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}

          <button
            className="mobile-close"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </nav>

        <div className="top-actions">
          <span className="admin-name">{user?.name}</span>

          <NavLink to="/settings" title="Settings">
            <SettingsIcon size={19} />
          </NavLink>

          <button onClick={logout} title="Logout">
            <LogOut size={19} />
          </button>

          <button
            className="hamb"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
        </div>
      </header>

      <main className="workspace">{children}</main>

      <div className="floating-badge">
        <ShieldCheck size={20} />
      </div>
    </div>
  );
}

function Login() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    username: '',
    password: ''
  });

  const [err, setErr] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    try {
      const x = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      setUser(x.user);
      nav('/');
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-circle">
          <BusFront size={30} />
        </div>

        <h1>Sri Sugam Travels</h1>
        <p>Trip Management System</p>

        <form onSubmit={submit}>
          <label>
            Username
            <input
              autoFocus
              placeholder="Enter username"
              value={form.username}
              onChange={(e) =>
                setForm({
                  ...form,
                  username: e.target.value
                })
              }
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value
                })
              }
            />
          </label>

          {err && <div className="error-box">{err}</div>}

          <button className="primary large">
            Sign In
          </button>
        </form>

        <footer>
          M/S. PAYANAM · www.srisugamtravels.com
        </footer>
      </div>

      <div className="login-float">S</div>
    </div>
  );
}

function PageTitle({ icon: Icon, title, accent }) {
  return (
    <div className="page-title">
      <Icon size={24} className={accent || ''} />
      <h1>{title}</h1>
    </div>
  );
}

function Section({ title, children, className = '' }) {
  return (
    <section className={'card ' + className}>
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children, wide = false }) {
  return (
    <label className={wide ? 'field wide' : 'field'}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange}>
      {children}
    </select>
  );
}


  function Dashboard() {
  const [month, setMonth] = useState(monthInput());
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setD(null);
    setError('');

    api('/dashboard?month=' + month)
      .then((data) => {
        setD(data);
      })
      .catch((err) => {
        console.error('Dashboard API error:', err);
        setError(err.message || 'Unable to load dashboard');
      });
  }, [month]);

  if (error) {
    return (
      <div className="loading">
        <h3>Unable to load dashboard</h3>
        <p>{error}</p>

        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!d) {
    return <div className="loading">Loading dashboard…</div>;
  }

  const pie = Object.entries(d.expenseBreakdown).map(
    ([name, value]) => ({
      name,
      value
    })
  );

  const clientRows = d.clientProfit;

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      <div className="metrics">
        <Metric
          title="Grand Total"
          value={money(d.grandTotal)}
          sub={`${d.tripCount} trips`}
          tone="teal"
        />

        <Metric
          title="Total Expenses"
          value={money(d.totalExpenses)}
          sub="incl. diesel & overhead"
          tone="red"
        />

        <Metric
          title="Total KMs"
          value={d.totalKms.toLocaleString('en-IN')}
          sub="0 halt days"
        />
      </div>

      <div className="chart-grid">
        <Section title="Monthly Trend">
          <div className="chart">
            <ResponsiveContainer
              width="100%"
              height={230}
            >
              <BarChart
                data={(d.trend || []).map((x) => ({
                  ...x,
                  collectionL: x.collection / 100000,
                  expenseL: -x.expenses / 100000
                }))}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `₹${v}L`} />
                <Tooltip />
                <Bar
                 dataKey="collectionL"
                 name="Collection"
                 fill="#00897B"
                 radius={[4, 4, 0, 0]}
                 />

                <Bar
                 dataKey="expenseL"
                 name="Expenses"
                 fill="#E53935"
                radius={[4, 4, 0, 0]}
                 />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Expense Breakdown">
  <div className="chart">
    <ResponsiveContainer
      width="100%"
      height={300}
    >
      <PieChart>
        <Pie
          data={pie}
          dataKey="value"
          nameKey="name"
          outerRadius={95}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {pie.map((entry, i) => {
            const colors = [
              '#009688',
              '#E53935',
              '#FB8C00',
              '#3949AB',
              '#8E24AA',
              '#6D4C41'
            ];

            return (
              <Cell
                key={`cell-${i}`}
                fill={colors[i % colors.length]}
              />
            );
          })}
        </Pie>

        <Legend />

        <Tooltip
          formatter={(v) => money(v)}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
</Section>
      </div>

      <Section title="Client-wise Profit Sheet">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Trips</th>
                <th>Collection</th>
                <th>Expenses</th>
                <th>Profit</th>
              </tr>
            </thead>

            <tbody>
              {clientRows.map((x) => (
                <tr key={x.client}>
                  <td>{x.client}</td>
                  <td>{x.trips}</td>
                  <td>{money(x.collection)}</td>
                  <td>{money(x.expenses)}</td>
                  <td className={x.profit >= 0 ? 'pos' : 'neg'}>
                    {money(x.profit)}
                  </td>
                </tr>
              ))}

              <tr className="strong">
                <td>Trip Total</td>
                <td>{d.tripCount}</td>
                <td>{money(d.grandTotal)}</td>
                <td>{money(d.totalExpenses)}</td>
                <td className={d.netProfit >= 0 ? 'pos' : 'neg'}>
                  {money(d.netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Vehicle Summary">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Trips</th>
                <th>KMs</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {d.vehicleSummary.map((x) => (
                <tr key={x.vehicle}>
                  <td>{x.vehicle}</td>
                  <td>{x.trips}</td>
                  <td>
                    {x.kms.toLocaleString('en-IN')}
                  </td>
                  <td>{money(x.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

function Metric({ title, value, sub, tone = '' }) {
  return (
    <div className={'metric ' + tone}>
      <div>{title}</div>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function useMeta() {
  const [m, setM] = useState(null);

  const reload = () =>
    api('/meta').then(setM);

  useEffect(() => {
    reload();
  }, []);

  return [m, reload];
}

function AddTrip() {
  const [m] = useMeta();

  const [form, setForm] = useState({
    tripDate: dateInput(),
    routeId: '',
    vehicleId: '',
    clientId: '',
    driverId: '',
    cleanerId: '',
    distanceKm: '',
    ratePerKm: '',
    diesel: 0,
    driverSalary: 0,
    cleanerSalary: 0,
    toll: 0,
    waterBottle: 0,
    parking: 0,
    adBlue: 0,
    other: 0,
    otherNote: '',
    halt: false
  });

  const [saved, setSaved] = useState('');

  const n = (k) => (e) =>
    setForm({
      ...form,
      [k]:
        e.target.type === 'number'
          ? e.target.value
          : e.target.value
    });

  const amount =
    Number(form.distanceKm || 0) *
    Number(form.ratePerKm || 0);

  const total = [
    'diesel',
    'driverSalary',
    'cleanerSalary',
    'toll',
    'waterBottle',
    'parking',
    'adBlue',
    'other'
  ].reduce(
    (s, k) => s + Number(form[k] || 0),
    0
  );

  const submit = async (e) => {
    e.preventDefault();

    try {
      await api('/trips', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      alert('Trip saved successfully');
    } catch (err) {
      setSaved(err.message);
    }
  };

  return (
    <>
      <PageTitle
        icon={PlusCircle}
        title="Add Trip"
      />

      {saved && (
        <div className="toast">{saved}</div>
      )}

      <form onSubmit={submit}>
        <Section title="TRIP DETAILS">
          <div className="form-grid">
            <Field label="Trip Date">
              <input
                type="date"
                value={form.tripDate}
                onChange={n('tripDate')}
              />
            </Field>

            <Field label="Route">
              <Select
                value={form.routeId}
                onChange={n('routeId')}
              >
                <option value="">
                  Select route...
                </option>

                {m?.routes
                  .filter((x) => x.status === 'ACTIVE')
                  .map((x) => (
                    <option
                      key={x.id}
                      value={x.id}
                    >
                      {x.name}
                    </option>
                  ))}
              </Select>
            </Field>

            <Field label="Vehicle">
              <Select
                value={form.vehicleId}
                onChange={n('vehicleId')}
              >
                <option value="">
                  Select vehicle...
                </option>

                {m?.vehicles
                  .filter((x) => x.status === 'ACTIVE')
                  .map((x) => (
                    <option
                      key={x.id}
                      value={x.id}
                    >
                      {x.regNo}
                    </option>
                  ))}
              </Select>
            </Field>

            <Field label="Client">
              <Select
                value={form.clientId}
                onChange={n('clientId')}
              >
                <option value="">
                  Select client...
                </option>

                {m?.clients
                  .filter((x) => x.status === 'ACTIVE')
                  .map((x) => (
                    <option
                      key={x.id}
                      value={x.id}
                    >
                      {x.name}
                    </option>
                  ))}
              </Select>
            </Field>

            <Field label="Driver">
              <Select
                value={form.driverId}
                onChange={n('driverId')}
              >
                <option value="">
                  Select driver...
                </option>

                {m?.drivers
                  .filter((x) => x.status === 'ACTIVE')
                  .map((x) => (
                    <option
                      key={x.id}
                      value={x.id}
                    >
                      {x.name}
                    </option>
                  ))}
              </Select>
            </Field>

            <Field label="Cleaner">
              <Select
                value={form.cleanerId}
                onChange={n('cleanerId')}
              >
                <option value="">
                  Select cleaner...
                </option>

                {m?.cleaners
                  .filter((x) => x.status === 'ACTIVE')
                  .map((x) => (
                    <option
                      key={x.id}
                      value={x.id}
                    >
                      {x.name}
                    </option>
                  ))}
              </Select>
            </Field>

            <Field label="Distance (km)">
              <input
                type="number"
                value={form.distanceKm}
                onChange={n('distanceKm')}
              />
            </Field>

            <Field label="Rate per km (₹)">
              <input
                type="number"
                value={form.ratePerKm}
                onChange={n('ratePerKm')}
              />
            </Field>

            <div className="wide info-box">
              Trip Amount:{' '}
              <strong>{money(amount)}</strong>
            </div>

            <label className="check wide">
              <input
                type="checkbox"
                checked={form.halt}
                onChange={(e) =>
                  setForm({
                    ...form,
                    halt: e.target.checked
                  })
                }
              />
              HALT — Vehicle stopped (no trip)
            </label>
          </div>
        </Section>

        <Section title="EXPENSES">
          <div className="form-grid">
            {[
              ['diesel', 'Diesel (₹)'],
              ['driverSalary', 'Driver Salary (₹)'],
              ['cleanerSalary', 'Cleaner Salary (₹)'],
              ['toll', 'Toll (₹)'],
              ['waterBottle', 'Water Bottle (₹)'],
              ['parking', 'Parking Charges (₹)'],
              ['adBlue', 'AdBlue (₹)'],
              ['other', 'Other (₹)']
            ].map(([k, l]) => (
              <Field key={k} label={l}>
                <input
                  type="number"
                  value={form[k]}
                  onChange={n(k)}
                />
              </Field>
            ))}

            <Field
              label="Other Expenses Note"
              wide
            >
              <input
                placeholder="Describe other expenses..."
                value={form.otherNote}
                onChange={n('otherNote')}
              />
            </Field>
          </div>
        </Section>

        <div className="profit-card">
          <div>
            <span>Trip Amount</span>
            <b>{money(amount)}</b>
          </div>

          <div>
            <span>Total Expenses</span>
            <b className="neg">
              −{money(total)}
            </b>
          </div>

          <hr />

          <div className="profit">
            <span>Profit</span>
            <b
              className={
                amount - total >= 0
                  ? 'pos'
                  : 'neg'
              }
            >
              {money(amount - total)}
            </b>
          </div>
        </div>

        <button className="primary save-btn">
          <Save size={18} />
          Save Trip
        </button>
      </form>
    </>
  );
}

function History() {
  const [m] = useMeta();

  const [month, setMonth] = useState(monthInput());
  const [vehicleId, setVehicleId] =
    useState('');
  const [clientId, setClientId] =
    useState('');
  const [rows, setRows] = useState([]);

  const load = () =>
    api(
      `/trips?month=${month}${
        vehicleId
          ? '&vehicleId=' + vehicleId
          : ''
      }${
        clientId
          ? '&clientId=' + clientId
          : ''
      }`
    ).then(setRows);

  useEffect(() => {
    load();
  }, [month, vehicleId, clientId]);

  return (
    <>
      <PageTitle
        icon={HistoryIcon}
        title="Trip History"
      />

      <div className="filters">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />

        <Select
          value={vehicleId}
          onChange={(e) =>
            setVehicleId(e.target.value)
          }
        >
          <option value="">
            All Vehicles
          </option>

          {m?.vehicles.map((v) => (
            <option
              value={v.id}
              key={v.id}
            >
              {v.regNo}
            </option>
          ))}
        </Select>

        <Select
          value={clientId}
          onChange={(e) =>
            setClientId(e.target.value)
          }
        >
          <option value="">
            All Clients
          </option>

          {m?.clients.map((c) => (
            <option
              value={c.id}
              key={c.id}
            >
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="stack-list">
        {rows.map((t) => (
          <div
            className="trip-row"
            key={t.id}
          >
            <div className="date-block">
              <b>
                {new Date(
                  t.tripDate
                ).getDate()}
              </b>

              <span>
                {new Date(
                  t.tripDate
                ).toLocaleString('en-IN', {
                  month: 'short'
                })}
              </span>
            </div>

            <div className="trip-main">
              <strong>{t.route.name}</strong>

              <span>
                {t.vehicle.regNo} ·{' '}
                {t.client.name}
              </span>
            </div>

            <div className="trip-right">
              <b>{money(t.amount)}</b>

              <span
                className={
                  t.profit >= 0
                    ? 'pos'
                    : 'neg'
                }
              >
                {t.profit >= 0 ? '+' : ''}
                {money(t.profit)}
              </span>
            </div>

            <ChevronDown size={18} />
          </div>
        ))}
      </div>
    </>
  );
}

function Expenses() {
  const [m] = useMeta();

  const [form, setForm] = useState({
    expenseTypeId: '',
    vehicleId: '',
    month: monthInput(),
    amount: '',
    note: ''
  });

  const [rows, setRows] = useState([]);

  const [filters, setFilters] =
    useState({
      vehicleId: '',
      expenseTypeId: ''
    });

  const load = () =>
    api(
      `/expenses?${
        filters.vehicleId
          ? 'vehicleId=' +
            filters.vehicleId +
            '&'
          : ''
      }${
        filters.expenseTypeId
          ? 'expenseTypeId=' +
            filters.expenseTypeId
          : ''
      }`
    ).then(setRows);

  useEffect(() => {
    load();
  }, [filters]);

  const n = (k) => (e) =>
    setForm({
      ...form,
      [k]: e.target.value
    });

  const save = async (e) => {
    e.preventDefault();

    await api('/expenses', {
      method: 'POST',
      body: JSON.stringify(form)
    });

    setForm({
      ...form,
      amount: '',
      note: ''
    });

    load();
  };

  return (
    <>
      <PageTitle
        icon={ReceiptIndianRupee}
        title="Expenses"
      />

      <form onSubmit={save}>
        <Section title="ADD EXPENSE">
          <div className="form-grid">
            <Field
              label="Expense Type"
              wide
            >
              <Select
                value={form.expenseTypeId}
                onChange={n('expenseTypeId')}
              >
                <option value="">
                  Select type...
                </option>

                {m?.expenseTypes.map((x) => (
                  <option
                    value={x.id}
                    key={x.id}
                  >
                    {x.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Vehicle (optional)">
              <Select
                value={form.vehicleId}
                onChange={n('vehicleId')}
              >
                <option value="">
                  No vehicle
                </option>

                {m?.vehicles.map((x) => (
                  <option
                    value={x.id}
                    key={x.id}
                  >
                    {x.regNo}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Month">
              <input
                type="month"
                value={form.month}
                onChange={n('month')}
              />
            </Field>

            <Field
              label="Amount (₹)"
              wide
            >
              <input
                type="number"
                value={form.amount}
                onChange={n('amount')}
                placeholder="e.g. 5000"
              />
            </Field>

            <Field
              label="Note (optional)"
              wide
            >
              <input
                value={form.note}
                onChange={n('note')}
                placeholder="e.g. BPCL pump, breakdown repair"
              />
            </Field>
          </div>

          <button className="primary save-btn">
            <ReceiptIndianRupee size={18} />
            Save Expense
          </button>
        </Section>
      </form>

      <Section title="VIEW ENTRIES">
        <div className="filters">
          <Select
            value={filters.vehicleId}
            onChange={(e) =>
              setFilters({
                ...filters,
                vehicleId: e.target.value
              })
            }
          >
            <option value="">
              All vehicles
            </option>

            {m?.vehicles.map((v) => (
              <option
                value={v.id}
                key={v.id}
              >
                {v.regNo}
              </option>
            ))}
          </Select>

          <Select
            value={filters.expenseTypeId}
            onChange={(e) =>
              setFilters({
                ...filters,
                expenseTypeId:
                  e.target.value
              })
            }
          >
            <option value="">
              All types
            </option>

            {m?.expenseTypes.map((x) => (
              <option
                value={x.id}
                key={x.id}
              >
                {x.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Type</th>
                <th>Vehicle</th>
                <th>Amount</th>
                <th>Note</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {new Date(
                      r.month
                    ).toLocaleString(
                      'en-IN',
                      {
                        month: 'short',
                        year: 'numeric'
                      }
                    )}
                  </td>

                  <td>
                    {r.expenseType.name}
                  </td>

                  <td>
                    {r.vehicle?.regNo ||
                      '—'}
                  </td>

                  <td>{money(r.amount)}</td>

                  <td>
                    {r.note || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

function DieselLog() {
  const [m] = useMeta();

  const [form, setForm] = useState({
    vehicleId: '',
    fillDate: dateInput(),
    amount: '',
    paymentMethod: 'CASH',
    note: ''
  });

  const [rows, setRows] = useState([]);

  const load = () =>
    api('/diesel').then(setRows);

  useEffect(() => {
    load();
  }, []);

  const n = (k) => (e) =>
    setForm({
      ...form,
      [k]: e.target.value
    });

  const save = async (e) => {
    e.preventDefault();

    await api('/diesel', {
      method: 'POST',
      body: JSON.stringify(form)
    });

    setForm({
      ...form,
      amount: '',
      note: ''
    });

    load();
  };

  return (
    <>
      <PageTitle
        icon={Fuel}
        title="Diesel Log"
        accent="orange"
      />

      <form onSubmit={save}>
        <Section title="ADD DIESEL ENTRY">
          <div className="form-grid">
            <Field label="Vehicle">
              <Select
                value={form.vehicleId}
                onChange={n('vehicleId')}
              >
                <option value="">
                  Select vehicle...
                </option>

                {m?.vehicles.map((x) => (
                  <option
                    key={x.id}
                    value={x.id}
                  >
                    {x.regNo}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Fill Date">
              <input
                type="date"
                value={form.fillDate}
                onChange={n('fillDate')}
              />
            </Field>

            <Field label="Diesel Amount (₹)">
              <input
                type="number"
                value={form.amount}
                onChange={n('amount')}
                placeholder="e.g. 45000"
              />
            </Field>

            <Field label="Payment Method">
              <div className="segmented">
                {['CASH', 'CARD', 'UPI'].map(
                  (x) => (
                    <button
                      type="button"
                      className={
                        form.paymentMethod === x
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setForm({
                          ...form,
                          paymentMethod: x
                        })
                      }
                      key={x}
                    >
                      {x[0] +
                        x.slice(1).toLowerCase()}
                    </button>
                  )
                )}
              </div>
            </Field>

            <Field
              label="Note (optional)"
              wide
            >
              <input
                value={form.note}
                onChange={n('note')}
                placeholder="e.g. BPCL pump, highway fill"
              />
            </Field>
          </div>

          <button className="orange save-btn">
            <Fuel size={18} />
            Save Diesel Entry
          </button>
        </Section>
      </form>

      <Section title="VIEW ENTRIES">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Note</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {dateInput(
                      new Date(r.fillDate)
                    )}
                  </td>

                  <td>
                    {r.vehicle.regNo}
                  </td>

                  <td>{money(r.amount)}</td>

                  <td>{r.paymentMethod}</td>

                  <td>
                    {r.note || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

function Reports() {
  const [m] = useMeta();
  const [tab, setTab] =
    useState('Invoices');

  return (
    <>
      <PageTitle
        icon={FileText}
        title="Reports"
      />

      <div className="report-tabs">
        {[
          'Invoices',
          'Bus-wise Report',
          'Bus Trip Report',
          'Monthly Statements',
          'Salary Report'
        ].map((x) => (
          <button
            key={x}
            className={
              tab === x ? 'active' : ''
            }
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}

        <button
  className="secondary"
  type="button"
  onClick={() => {
    alert(
      `${tab} report generation will use the selected filters.`
    );
  }}
>
  Generate
</button>
      </div>

      {tab === 'Invoices' ? (
        <div className="report-grid">
          <InvoiceCard
            title="Weekly PRO FORMA Invoice"
            blue={false}
            m={m}
          />

          <InvoiceCard
            title="Monthly INVOICE"
            blue
            m={m}
          />
        </div>
      ) : (
        <Section title={tab}>
          <div className="empty-report">
            Select period and filters to
            generate{' '}
            {tab.toLowerCase()}.
          </div>
        </Section>
      )}
    </>
  );
}

function InvoiceCard({ title, blue, m }) {
  const isWeekly = title.includes('Weekly');

  const [weekNo, setWeekNo] = useState(36);
  const [year, setYear] = useState(
    new Date().getFullYear()
  );

  const [month, setMonth] = useState(
    monthInput()
  );

  const [clientId, setClientId] =
    useState('');

  const [routeIds, setRouteIds] =
    useState([]);

  const [vehicleId, setVehicleId] =
    useState('');

  const [invoiceNo, setInvoiceNo] =
    useState('');

  const toggleRoute = (id) => {
    const value = String(id);

    setRouteIds((current) =>
      current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value]
    );
  };

  const getWeekRange = (year, week) => {
    const jan4 = new Date(year, 0, 4);

    const day =
      jan4.getDay() === 0
        ? 7
        : jan4.getDay();

    const monday = new Date(jan4);

    monday.setDate(
      jan4.getDate() -
        day +
        1 +
        (week - 1) * 7
    );

    const sunday = new Date(monday);

    sunday.setDate(
      monday.getDate() + 7
    );

    return {
      start: monday,
      end: sunday
    };
  };

  const getMonthKey = (date) => {
    const y = date.getFullYear();

    const m = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    return `${y}-${m}`;
  };

  const loadTrips = async () => {
    let trips = [];

    if (isWeekly) {
      const { start, end } =
        getWeekRange(
          Number(year),
          Number(weekNo)
        );

      const months = new Set([
        getMonthKey(start),
        getMonthKey(
          new Date(
            end.getTime() - 1
          )
        )
      ]);

      for (const monthKey of months) {
        const data = await api(
          `/trips?month=${monthKey}`
        );

        trips.push(...data);
      }

      trips = trips.filter((t) => {
        const d = new Date(
          t.tripDate
        );

        return (
          d >= start &&
          d < end
        );
      });
    } else {
      trips = await api(
        `/trips?month=${month}`
      );
    }

    if (clientId) {
      trips = trips.filter(
        (t) =>
          String(t.clientId) ===
          String(clientId)
      );
    }

    if (vehicleId) {
      trips = trips.filter(
        (t) =>
          String(t.vehicleId) ===
          String(vehicleId)
      );
    }

    if (routeIds.length > 0) {
      trips = trips.filter((t) =>
        routeIds.includes(
          String(t.routeId)
        )
      );
    }

    return trips;
  };

  const downloadPDF = async () => {
    try {
      const trips =
        await loadTrips();

      if (!trips.length) {
        alert(
          'No trips found for the selected filters.'
        );
        return;
      }

      const doc = new jsPDF();

      const firstTrip =
        trips[0];

      const clientName =
        clientId
          ? m?.clients?.find(
              (c) =>
                String(c.id) ===
                String(clientId)
            )?.name
          : 'All Clients';

      const vehicleName =
        vehicleId
          ? m?.vehicles?.find(
              (v) =>
                String(v.id) ===
                String(vehicleId)
            )?.regNo
          : 'All Vehicles';

      let period = '';

      if (isWeekly) {
        period =
          `Week ${weekNo} - ${year}`;
      } else {
        const [y, mo] =
          month.split('-');

        const date =
          new Date(
            Number(y),
            Number(mo) - 1,
            1
          );

        period =
          date.toLocaleDateString(
            'en-IN',
            {
              month: 'long',
              year: 'numeric'
            }
          );
      }

      /*
       * Header
       */

      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');

      doc.text(
        'SRI SUGAM TRAVELS',
        105,
        20,
        {
          align: 'center'
        }
      );

      doc.setFontSize(14);

      doc.text(
        isWeekly
          ? 'PRO FORMA INVOICE'
          : 'INVOICE',
        105,
        30,
        {
          align: 'center'
        }
      );

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      doc.text(
        `Period: ${period}`,
        14,
        42
      );

      doc.text(
        `Client: ${clientName}`,
        14,
        49
      );

      doc.text(
        `Vehicle: ${vehicleName}`,
        14,
        56
      );

      doc.text(
        `Invoice No.: ${
          invoiceNo || 'N/A'
        }`,
        14,
        63
      );

      /*
       * Table
       */

      const rows = trips.map(
        (t, index) => [
          index + 1,
          new Date(
            t.tripDate
          ).toLocaleDateString(
            'en-IN'
          ),
          t.route?.name || '-',
          t.vehicle?.regNo || '-',
          Number(
            t.distanceKm || 0
          ).toFixed(0),
          money(
            t.ratePerKm || 0
          ),
          money(
            t.amount || 0
          )
        ]
      );

      const totalKm =
        trips.reduce(
          (sum, t) =>
            sum +
            Number(
              t.distanceKm || 0
            ),
          0
        );

      const totalAmount =
        trips.reduce(
          (sum, t) =>
            sum +
            Number(
              t.amount || 0
            ),
          0
        );

      autoTable(doc, {
        startY: 72,

        head: [[
          'S.No',
          'Date',
          'Route',
          'Vehicle',
          'KM',
          'Rate/KM',
          'Amount'
        ]],

        body: rows,

        foot: [[
          '',
          '',
          '',
          'TOTAL',
          totalKm.toFixed(0),
          '',
          money(totalAmount)
        ]],

        theme: 'grid',

        styles: {
          fontSize: 8,
          cellPadding: 3
        },

        headStyles: {
          fontStyle: 'bold'
        },

        footStyles: {
          fontStyle: 'bold'
        },

        columnStyles: {
          0: {
            halign: 'center'
          },
          4: {
            halign: 'right'
          },
          5: {
            halign: 'right'
          },
          6: {
            halign: 'right'
          }
        }
      });

      /*
       * Footer
       */

      const finalY =
        doc.lastAutoTable?.finalY ||
        80;

      doc.setFontSize(10);

      doc.text(
        `Total Trips: ${trips.length}`,
        14,
        finalY + 15
      );

      doc.text(
        `Total Amount: ${money(
          totalAmount
        )}`,
        14,
        finalY + 22
      );

      doc.text(
        'For Sri Sugam Travels',
        150,
        finalY + 40
      );

      doc.text(
        'Authorized Signature',
        150,
        finalY + 50
      );

      /*
       * File name
       */

      const safeClient =
        clientName
          .replace(
            /[^a-z0-9]/gi,
            '_'
          )
          .replace(
            /_+/g,
            '_'
          );

      const fileName =
        isWeekly
          ? `Proforma_Invoice_Week_${weekNo}_${year}_${safeClient}.pdf`
          : `Invoice_${month}_${safeClient}.pdf`;

      doc.save(fileName);

    } catch (error) {
      console.error(
        'PDF generation error:',
        error
      );

      alert(
        `Unable to generate PDF: ${error.message}`
      );
    }
  };

  return (
    <Section title={title}>

      <div className="form-grid">

        {isWeekly ? (
          <>
            <Field label="Week No.">
              <input
                type="number"
                min="1"
                max="53"
                value={weekNo}
                onChange={(e) =>
                  setWeekNo(
                    e.target.value
                  )
                }
              />
            </Field>

            <Field label="Year">
              <input
                type="number"
                min="2020"
                max="2100"
                value={year}
                onChange={(e) =>
                  setYear(
                    e.target.value
                  )
                }
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Month">
              <input
                type="month"
                value={month}
                onChange={(e) =>
                  setMonth(
                    e.target.value
                  )
                }
              />
            </Field>

            <Field label="Client">
              <Select
                value={clientId}
                onChange={(e) =>
                  setClientId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Select client...
                </option>

                {m?.clients?.map(
                  (c) => (
                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.name}
                    </option>
                  )
                )}
              </Select>
            </Field>
          </>
        )}

        {isWeekly && (
          <Field label="Client">
            <Select
              value={clientId}
              onChange={(e) =>
                setClientId(
                  e.target.value
                )
              }
            >
              <option value="">
                Select client...
              </option>

              {m?.clients?.map(
                (c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                )
              )}
            </Select>
          </Field>
        )}

        <Field
          label="Routes (optional — all if none selected)"
          wide
        >
          <div className="route-checks">
            {m?.routes?.map(
              (r) => (
                <label key={r.id}>
                  <input
                    type="checkbox"
                    checked={routeIds.includes(
                      String(r.id)
                    )}
                    onChange={() =>
                      toggleRoute(
                        r.id
                      )
                    }
                  />

                  {' '}

                  {r.name}
                </label>
              )
            )}
          </div>
        </Field>

        <Field
          label="Vehicle (optional)"
          wide
        >
          <Select
            value={vehicleId}
            onChange={(e) =>
              setVehicleId(
                e.target.value
              )
            }
          >
            <option value="">
              All vehicles
            </option>

            {m?.vehicles?.map(
              (v) => (
                <option
                  key={v.id}
                  value={v.id}
                >
                  {v.regNo}
                </option>
              )
            )}
          </Select>
        </Field>

        <Field label="Invoice No." wide>
          <input
            value={invoiceNo}
            onChange={(e) =>
              setInvoiceNo(
                e.target.value
              )
            }
            placeholder="e.g. 1032"
          />
        </Field>

      </div>

      <button
        type="button"
        className={
          blue
            ? 'blue save-btn'
            : 'primary save-btn'
        }
        onClick={downloadPDF}
      >
        <Download size={18} />

        Save & Download{' '}

        {blue
          ? 'INVOICE'
          : 'PRO FORMA'} PDF
      </button>

    </Section>
  );
}


const resourceMeta = {
  routes: {
  title: 'Routes',
  icon: Route,
  fields: ['name', 'code', 'status']
},
  vehicles: {
    title: 'Vehicles',
    icon: CarFront,
    fields: ['regNo', 'label', 'status']
  },
  clients: {
    title: 'Clients',
    icon: BriefcaseBusiness,
    fields: ['name', 'phone', 'status'  ]
  },
  drivers: {
    title: 'Drivers',
    icon: Users,
    fields: ['name', 'phone', 'status']
  },
  cleaners: {
    title: 'Cleaners',
    icon: Users,
    fields: ['name', 'phone', 'status']
  },
  expenseTypes: {
    title: 'Expense Types',
    icon: ReceiptIndianRupee,
    fields: ['name', 'status']
  },
  users: {
    title: 'Users',
    icon: UserRoundCog,
    fields: [
      'name',
      'username',
      'role',
      'password',
      'status'
    ]
  }
};

function Settings() {
  const { user } = useAuth();

  const [section, setSection] =
    useState('users');

  const sections = [
    'routes',
    'vehicles',
    'clients',
    'drivers',
    'cleaners',
    'expenseTypes',
    'users'
  ];

  return (
    <>
      <PageTitle
        icon={SettingsIcon}
        title="Settings"
      />

      <div className="settings-layout">
        <aside className="settings-nav">
          {sections.map((s) => (
            <button
              className={
                section === s
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setSection(s)
              }
              key={s}
            >
              {resourceMeta[s].title}
            </button>
          ))}
        </aside>

        <SettingsCrud
          resource={section}
          canWrite={
            user?.role === 'ADMIN' ||
            user?.role === 'MANAGER'
          }
        />
      </div>
    </>
  );
}

function SettingsCrud({
  resource,
  canWrite
}) {
  const meta =
    resourceMeta[resource];

  const isUsers =
    resource === 'users';

  const [rows, setRows] =
    useState([]);

  const [editing, setEditing] =
    useState(null);

  const [isNew, setIsNew] =
    useState(false);

  const [form, setForm] =
    useState({
      name: '',
      username: '',
      role: 'STAFF',
      password: '',
      status: 'ACTIVE',
      regNo: '',
      label: '',
      code: '',
      phone: ''
    });

  const load = () =>
    api(
      isUsers
        ? '/users'
        : `/settings/${resource}`
    ).then(setRows);

  useEffect(() => {
    load();
  }, [resource]);

  const reset = () => {
    setEditing(null);
    setIsNew(false);

    setForm({
      name: '',
      username: '',
      role: 'STAFF',
      password: '',
      status: 'ACTIVE',
      regNo: '',
      label: '',
      code: '',
      phone: ''
    });
  };

  const startNew = () => {
    reset();
    setIsNew(true);
  };

  const save = async () => {
  try {
    const body = { ...form };

    if (!body.password) {
      delete body.password;
    }

    if (editing !== null && !isNew) {
      await api(
        isUsers
          ? `/users/${editing}`
          : `/settings/${resource}/${editing}`,
        {
          method: 'PATCH',
          body: JSON.stringify(body)
        }
      );
    } else {
      await api(
        isUsers
          ? '/users'
          : `/settings/${resource}`,
        {
          method: 'POST',
          body: JSON.stringify(body)
        }
      );
    }

    reset();
    await load();
  } catch (error) {
    alert(error.message || 'Enter the data');
  }
};

  const del = async (id) => {
  if (!confirm('Delete this record?')) {
    return;
  }

  try {
    await api(
      isUsers
        ? `/users/${id}`
        : `/settings/${resource}/${id}`,
      {
        method: 'DELETE'
      }
    );

    await load();

    alert('Deleted successfully.');
  } catch (error) {
    alert(error.message || 'Unable to delete this record.');
  }
};

  const startEdit = (r) => {
    setEditing(r.id);
    setIsNew(false);

    setForm({
      ...form,
      ...r,
      password: ''
    });
  };

  return (
    <div className="card settings-card">
      <div className="settings-card-head">
        <h2>{meta.title}</h2>

        {canWrite && (
          <button
            className="outline"
            onClick={startNew}
          >
            <Plus size={16} />
            Add {meta.title.slice(0, -1)}
          </button>
        )}
      </div>

      {(editing !== null || isNew) &&
        canWrite && (
          <div className="editor">
            <div className="form-grid">
              {meta.fields.map((k) => (
                <Field
                  key={k}
                  label={
                    k === 'regNo'
                      ? 'Registration No.'
                      : k[0].toUpperCase() +
                        k.slice(1)
                  }
                >
                  {k === 'role' ? (
                    <Select
                      value={form[k]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [k]: e.target.value
                        })
                      }
                    >
                      <option>
                        ADMIN
                      </option>
                      <option>
                        MANAGER
                      </option>
                      <option>
                        STAFF
                      </option>
                    </Select>
                  ) : k === 'status' ? (
                    <Select
                      value={form[k]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [k]: e.target.value
                        })
                      }
                    >
                      <option>
                        ACTIVE
                      </option>
                      <option>
                        INACTIVE
                      </option>
                    </Select>
                  ) : (
                    <input
                      type={
                        k === 'password'
                          ? 'password'
                          : 'text'
                      }
                      value={form[k] ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [k]: e.target.value
                        })
                      }
                      placeholder={
                        k === 'password'
                          ? 'Leave blank to keep current password'
                          : ''
                      }
                    />
                  )}
                </Field>
              ))}
            </div>

            <div className="editor-actions">
              <button
                className="primary"
                onClick={save}
              >
                <Save size={16} />
                {editing
                  ? 'Update'
                  : 'Save'}
              </button>

              <button
                className="ghost"
                onClick={reset}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {isUsers ? (
                <>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                </>
              ) : (
                <>
                  <th>
                    {meta.fields[0] === 'regNo'
                      ? 'Registration No.'
                      : 'Name'}
                  </th>

                  {meta.fields
                    .slice(1)
                    .map((k) => (
                      <th key={k}>
                        {k}
                      </th>
                    ))}

                  <th>Status</th>
                </>
              )}

              <th></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {meta.fields.map((k) => (
                  <td key={k}>
                    {k === 'password' ? (
                      '••••••'
                    ) : k === 'role' ? (
                      <span className="pill purple">
                        {r[k]}
                      </span>
                    ) : k === 'status' ? (
                      <span
                        className={
                          r[k] === 'ACTIVE'
                            ? 'pos'
                            : 'neg'
                        }
                      >
                        {r[k] === 'ACTIVE'
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    ) : (
                      r[k] ?? '—'
                    )}
                  </td>
                ))}

                {!isUsers && (
                  <td>
                    {r.status === 'ACTIVE'
                      ? 'Active'
                      : 'Inactive'}
                  </td>
                )}

                <td className="actions">
                  {canWrite && (
                    <>
                      <button
                        title="Edit"
                        onClick={() =>
                          startEdit(r)
                        }
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        title="Delete"
                        onClick={() =>
                          del(r.id)
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canWrite && (
        <button
          className="add-row"
          onClick={startNew}
        >
          <Plus size={15} />
          Add {meta.title.slice(0, -1)}
        </button>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="*"
          element={
            <Protected>
              <AppShell>
                <Routes>
                  <Route
                    path="/"
                    element={<Dashboard />}
                  />

                  <Route
                    path="/add-trip"
                    element={<AddTrip />}
                  />

                  <Route
                    path="/history"
                    element={<History />}
                  />

                  <Route
                    path="/expenses"
                    element={<Expenses />}
                  />

                  <Route
                    path="/diesel-log"
                    element={<DieselLog />}
                  />

                  <Route
                    path="/reports"
                    element={<Reports />}
                  />

                  <Route
                    path="/settings"
                    element={<Settings />}
                  />

                  <Route
                    path="*"
                    element={
                      <Navigate
                        to="/"
                        replace
                      />
                    }
                  />
                </Routes>
              </AppShell>
            </Protected>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

createRoot(
  document.getElementById('root')
).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);