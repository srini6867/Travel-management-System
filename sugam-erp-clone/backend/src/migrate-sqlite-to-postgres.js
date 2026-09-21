import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SQLITE_DB = 'prisma/dev.db';

function readTable(table) {
  const output = execFileSync(
    'sqlite3',
    ['-json', SQLITE_DB, `SELECT * FROM "${table}";`],
    { encoding: 'utf8' }
  ).trim();

  return output ? JSON.parse(output) : [];
}

function toDate(value) {
  if (value instanceof Date) return value;

  if (value === null || value === undefined || value === '') {
    return value;
  }

  // SQLite stores Prisma DateTime values as Unix timestamps
  // in milliseconds in this database.
  if (typeof value === 'number') {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid timestamp: ${value}`);
    }

    return date;
  }

  const text = String(value).trim();

  // Numeric timestamp stored as text.
  if (/^\d+$/.test(text)) {
    const date = new Date(Number(text));

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid timestamp: ${text}`);
    }

    return date;
  }

  // Standard SQLite datetime format.
  if (
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)
  ) {
    const date = new Date(
      text.replace(' ', 'T') + 'Z'
    );

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid datetime: ${text}`);
    }

    return date;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${text}`);
  }

  return date;
}

async function insertMany(model, rows) {
  if (!rows.length) {
    console.log(`  ${model}: 0 records`);
    return;
  }

  await prisma[model].createMany({
    data: rows
  });

  console.log(`  ${model}: ${rows.length} records`);
}

async function countPostgres(model) {
  return prisma[model].count();
}

async function main() {
  console.log('==========================================');
  console.log(' SQLite → PostgreSQL Migration');
  console.log('==========================================');

  // Safety check: PostgreSQL should be empty.
  const existing = {
    users: await countPostgres('user'),
    routes: await countPostgres('route'),
    vehicles: await countPostgres('vehicle'),
    clients: await countPostgres('client'),
    drivers: await countPostgres('driver'),
    cleaners: await countPostgres('cleaner'),
    expenseTypes: await countPostgres('expenseType'),
    trips: await countPostgres('trip'),
    expenses: await countPostgres('expense'),
    dieselLogs: await countPostgres('dieselLog')
  };

  const totalExisting = Object.values(existing).reduce(
    (sum, count) => sum + count,
    0
  );

  if (totalExisting > 0) {
    console.error('\nSTOP: PostgreSQL already contains data.');
    console.error(existing);
    console.error(
      '\nThis migration script will not overwrite existing PostgreSQL data.'
    );
    process.exit(1);
  }

  console.log('\nPostgreSQL is empty. Starting migration...\n');

  // Read SQLite data.
  const users = readTable('User');
  const routes = readTable('Route');
  const vehicles = readTable('Vehicle');
  const clients = readTable('Client');
  const drivers = readTable('Driver');
  const cleaners = readTable('Cleaner');
  const expenseTypes = readTable('ExpenseType');
  const trips = readTable('Trip');
  const expenses = readTable('Expense');
  const dieselLogs = readTable('DieselLog');

  console.log('SQLite records found:');
  console.log(`  User:        ${users.length}`);
  console.log(`  Route:       ${routes.length}`);
  console.log(`  Vehicle:     ${vehicles.length}`);
  console.log(`  Client:      ${clients.length}`);
  console.log(`  Driver:      ${drivers.length}`);
  console.log(`  Cleaner:     ${cleaners.length}`);
  console.log(`  ExpenseType: ${expenseTypes.length}`);
  console.log(`  Trip:        ${trips.length}`);
  console.log(`  Expense:     ${expenses.length}`);
  console.log(`  DieselLog:   ${dieselLogs.length}`);

  console.log('\nMigrating...\n');

  // Parent tables first.
  await insertMany(
    'user',
    users.map((r) => ({
      id: r.id,
      name: r.name,
      username: r.username,
      passwordHash: r.passwordHash,
      role: r.role,
      status: r.status,
      createdAt: toDate(r.createdAt),
      updatedAt: toDate(r.updatedAt)
    }))
  );

  await insertMany(
    'route',
    routes.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      status: r.status
    }))
  );

  await insertMany(
    'vehicle',
    vehicles.map((r) => ({
      id: r.id,
      regNo: r.regNo,
      label: r.label,
      status: r.status
    }))
  );

  await insertMany(
    'client',
    clients.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      status: r.status
    }))
  );

  await insertMany(
    'driver',
    drivers.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      status: r.status
    }))
  );

  await insertMany(
    'cleaner',
    cleaners.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      status: r.status
    }))
  );

  await insertMany(
    'expenseType',
    expenseTypes.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status
    }))
  );

  // Child tables after parent tables.
  await insertMany(
    'trip',
    trips.map((r) => ({
      id: r.id,
      tripDate: toDate(r.tripDate),
      routeId: r.routeId,
      vehicleId: r.vehicleId,
      clientId: r.clientId,
      driverId: r.driverId,
      cleanerId: r.cleanerId,
      distanceKm: r.distanceKm,
      ratePerKm: r.ratePerKm,
      amount: r.amount,
      diesel: r.diesel,
      driverSalary: r.driverSalary,
      cleanerSalary: r.cleanerSalary,
      toll: r.toll,
      waterBottle: r.waterBottle,
      parking: r.parking,
      adBlue: r.adBlue,
      other: r.other,
      otherNote: r.otherNote,
      halt: Boolean(r.halt),
      createdById: r.createdById,
      createdAt: toDate(r.createdAt)
    }))
  );

  await insertMany(
    'expense',
    expenses.map((r) => ({
      id: r.id,
      expenseTypeId: r.expenseTypeId,
      vehicleId: r.vehicleId,
      month: toDate(r.month),
      amount: r.amount,
      note: r.note,
      createdAt: toDate(r.createdAt)
    }))
  );

  await insertMany(
    'dieselLog',
    dieselLogs.map((r) => ({
      id: r.id,
      vehicleId: r.vehicleId,
      fillDate: toDate(r.fillDate),
      amount: r.amount,
      paymentMethod: r.paymentMethod,
      note: r.note,
      createdAt: toDate(r.createdAt)
    }))
  );

  // Reset PostgreSQL auto-increment sequences so future records
  // don't reuse IDs that we just migrated.
  const tables = [
    'User',
    'Route',
    'Vehicle',
    'Client',
    'Driver',
    'Cleaner',
    'ExpenseType',
    'Trip',
    'Expense',
    'DieselLog'
  ];

  console.log('\nResetting PostgreSQL ID sequences...');

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"${table}"', 'id'),
        COALESCE((SELECT MAX(id) FROM "${table}"), 1),
        true
      );
    `);
  }

  console.log('\n==========================================');
  console.log(' Migration completed successfully!');
  console.log('==========================================');
}

main()
  .catch((error) => {
    console.error('\nMigration failed:');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });