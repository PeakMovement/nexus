import pg from "pg";

const globalForPg = globalThis as unknown as {
  pool: pg.Pool | undefined;
};

export const pool =
  globalForPg.pool ??
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForPg.pool = pool;

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      weight_kg DOUBLE PRECISION NOT NULL,
      height_cm DOUBLE PRECISION NOT NULL,
      body_fat_pct DOUBLE PRECISION,
      activity_level TEXT NOT NULL,
      goal TEXT NOT NULL,
      budget_zar DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      protein_per_100g DOUBLE PRECISION NOT NULL,
      carbs_per_100g DOUBLE PRECISION NOT NULL,
      fat_per_100g DOUBLE PRECISION NOT NULL,
      calories_per_100g DOUBLE PRECISION NOT NULL,
      price_per_kg DOUBLE PRECISION NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      store TEXT,
      is_affordable BOOLEAN NOT NULL DEFAULT TRUE,
      is_premium BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS grocery_lists (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      week_start TIMESTAMPTZ NOT NULL,
      total_cost DOUBLE PRECISION NOT NULL,
      budget_zar DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS grocery_items (
      id TEXT PRIMARY KEY,
      grocery_list_id TEXT NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
      food_id TEXT NOT NULL REFERENCES foods(id),
      quantity_kg DOUBLE PRECISION NOT NULL,
      cost DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      grocery_list_id TEXT NOT NULL UNIQUE REFERENCES grocery_lists(id) ON DELETE CASCADE,
      week_start TIMESTAMPTZ NOT NULL,
      daily_calories DOUBLE PRECISION NOT NULL,
      daily_protein DOUBLE PRECISION NOT NULL,
      daily_carbs DOUBLE PRECISION NOT NULL,
      daily_fat DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      meal_plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_foods (
      id TEXT PRIMARY KEY,
      meal_id TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
      food_id TEXT NOT NULL REFERENCES foods(id),
      quantity DOUBLE PRECISION NOT NULL
    );
  `);
}

export function generateId(): string {
  return crypto.randomUUID();
}
