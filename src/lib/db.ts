import pg from "pg";

const globalForPg = globalThis as unknown as {
  pool: pg.Pool | undefined;
  dbInitialized: boolean;
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

export function generateId(): string {
  return crypto.randomUUID();
}

const FOODS = [
  { name: "Chicken Breast", category: "protein", p: 31, c: 0, f: 3.6, cal: 165, price: 75, store: "Shoprite", affordable: true, premium: false },
  { name: "Chicken Thighs (bone-in)", category: "protein", p: 26, c: 0, f: 10, cal: 209, price: 55, store: "Shoprite", affordable: true, premium: false },
  { name: "Chicken Livers", category: "protein", p: 24, c: 1, f: 6, cal: 167, price: 35, store: "Shoprite", affordable: true, premium: false },
  { name: "Eggs (per dozen ~720g)", category: "protein", p: 13, c: 1, f: 11, cal: 155, price: 52, store: "Checkers", affordable: true, premium: false },
  { name: "Beef Mince", category: "protein", p: 26, c: 0, f: 15, cal: 250, price: 90, store: "Checkers", affordable: true, premium: false },
  { name: "Tinned Pilchards", category: "protein", p: 21, c: 0, f: 9, cal: 170, price: 40, store: "Shoprite", affordable: true, premium: false },
  { name: "Tinned Tuna", category: "protein", p: 26, c: 0, f: 1, cal: 116, price: 120, store: "Pick n Pay", affordable: true, premium: false },
  { name: "Polony", category: "protein", p: 12, c: 4, f: 22, cal: 260, price: 45, store: "Shoprite", affordable: true, premium: false },
  { name: "Hake Fillets (frozen)", category: "protein", p: 17, c: 0, f: 1, cal: 82, price: 65, store: "Checkers", affordable: true, premium: false },
  { name: "Stewing Beef", category: "protein", p: 28, c: 0, f: 12, cal: 225, price: 100, store: "Checkers", affordable: true, premium: false },
  { name: "Salmon Fillets", category: "protein", p: 20, c: 0, f: 13, cal: 208, price: 250, store: "Woolworths", affordable: false, premium: true },
  { name: "Lamb Chops", category: "protein", p: 25, c: 0, f: 21, cal: 294, price: 180, store: "Pick n Pay", affordable: false, premium: true },
  { name: "Biltong", category: "protein", p: 56, c: 1, f: 3, cal: 250, price: 350, store: "Checkers", affordable: false, premium: true },
  { name: "White Rice", category: "carb", p: 7, c: 80, f: 0.6, cal: 360, price: 15, store: "Shoprite", affordable: true, premium: false },
  { name: "Brown Rice", category: "carb", p: 8, c: 77, f: 2.7, cal: 362, price: 20, store: "Shoprite", affordable: true, premium: false },
  { name: "Pap (Maize Meal)", category: "carb", p: 8, c: 73, f: 1.5, cal: 340, price: 12, store: "Shoprite", affordable: true, premium: false },
  { name: "White Bread", category: "carb", p: 9, c: 49, f: 3, cal: 265, price: 18, store: "Shoprite", affordable: true, premium: false },
  { name: "Brown Bread", category: "carb", p: 10, c: 46, f: 3.5, cal: 254, price: 18, store: "Shoprite", affordable: true, premium: false },
  { name: "Potatoes", category: "carb", p: 2, c: 17, f: 0.1, cal: 77, price: 14, store: "Shoprite", affordable: true, premium: false },
  { name: "Sweet Potatoes", category: "carb", p: 2, c: 20, f: 0.1, cal: 86, price: 18, store: "Pick n Pay", affordable: true, premium: false },
  { name: "Pasta", category: "carb", p: 13, c: 71, f: 1.5, cal: 350, price: 22, store: "Shoprite", affordable: true, premium: false },
  { name: "Oats", category: "carb", p: 13, c: 68, f: 7, cal: 389, price: 25, store: "Checkers", affordable: true, premium: false },
  { name: "Samp", category: "carb", p: 8, c: 73, f: 1, cal: 340, price: 14, store: "Shoprite", affordable: true, premium: false },
  { name: "Lentils (dried)", category: "carb", p: 25, c: 60, f: 1, cal: 352, price: 30, store: "Shoprite", affordable: true, premium: false },
  { name: "Sugar Beans (dried)", category: "carb", p: 22, c: 61, f: 1.5, cal: 347, price: 28, store: "Shoprite", affordable: true, premium: false },
  { name: "Basmati Rice", category: "carb", p: 7, c: 78, f: 0.5, cal: 350, price: 40, store: "Pick n Pay", affordable: false, premium: true },
  { name: "Quinoa", category: "carb", p: 14, c: 64, f: 6, cal: 368, price: 90, store: "Woolworths", affordable: false, premium: true },
  { name: "Sunflower Oil", category: "fat", p: 0, c: 0, f: 100, cal: 884, price: 30, unit: "litre", store: "Shoprite", affordable: true, premium: false },
  { name: "Peanut Butter", category: "fat", p: 25, c: 20, f: 50, cal: 588, price: 55, store: "Shoprite", affordable: true, premium: false },
  { name: "Margarine", category: "fat", p: 0, c: 0, f: 80, cal: 717, price: 40, store: "Shoprite", affordable: true, premium: false },
  { name: "Peanuts (raw)", category: "fat", p: 26, c: 16, f: 49, cal: 567, price: 50, store: "Checkers", affordable: true, premium: false },
  { name: "Avocado", category: "fat", p: 2, c: 9, f: 15, cal: 160, price: 40, store: "Pick n Pay", affordable: true, premium: false },
  { name: "Olive Oil", category: "fat", p: 0, c: 0, f: 100, cal: 884, price: 120, unit: "litre", store: "Woolworths", affordable: false, premium: true },
  { name: "Cabbage", category: "vegetable", p: 1.3, c: 6, f: 0.1, cal: 25, price: 12, store: "Shoprite", affordable: true, premium: false },
  { name: "Onions", category: "vegetable", p: 1.1, c: 9, f: 0.1, cal: 40, price: 14, store: "Shoprite", affordable: true, premium: false },
  { name: "Carrots", category: "vegetable", p: 0.9, c: 10, f: 0.2, cal: 41, price: 12, store: "Shoprite", affordable: true, premium: false },
  { name: "Tomatoes", category: "vegetable", p: 0.9, c: 4, f: 0.2, cal: 18, price: 18, store: "Pick n Pay", affordable: true, premium: false },
  { name: "Spinach", category: "vegetable", p: 2.9, c: 3.6, f: 0.4, cal: 23, price: 20, store: "Shoprite", affordable: true, premium: false },
  { name: "Green Peppers", category: "vegetable", p: 0.9, c: 5, f: 0.2, cal: 20, price: 25, store: "Pick n Pay", affordable: true, premium: false },
  { name: "Butternut", category: "vegetable", p: 1, c: 12, f: 0.1, cal: 45, price: 15, store: "Shoprite", affordable: true, premium: false },
  { name: "Beetroot", category: "vegetable", p: 1.6, c: 10, f: 0.2, cal: 43, price: 15, store: "Shoprite", affordable: true, premium: false },
  { name: "Broccoli", category: "vegetable", p: 2.8, c: 7, f: 0.4, cal: 34, price: 45, store: "Woolworths", affordable: false, premium: true },
  { name: "Bananas", category: "fruit", p: 1.1, c: 23, f: 0.3, cal: 89, price: 15, store: "Shoprite", affordable: true, premium: false },
  { name: "Apples", category: "fruit", p: 0.3, c: 14, f: 0.2, cal: 52, price: 20, store: "Pick n Pay", affordable: true, premium: false },
  { name: "Oranges", category: "fruit", p: 0.9, c: 12, f: 0.1, cal: 47, price: 15, store: "Shoprite", affordable: true, premium: false },
  { name: "Full Cream Milk", category: "dairy", p: 3.3, c: 5, f: 3.3, cal: 61, price: 18, unit: "litre", store: "Shoprite", affordable: true, premium: false },
  { name: "Maas (Amasi)", category: "dairy", p: 3.5, c: 4, f: 3, cal: 56, price: 15, unit: "litre", store: "Shoprite", affordable: true, premium: false },
  { name: "Cottage Cheese", category: "dairy", p: 11, c: 3, f: 4, cal: 98, price: 70, store: "Pick n Pay", affordable: true, premium: false },
  { name: "Greek Yoghurt", category: "dairy", p: 10, c: 4, f: 5, cal: 100, price: 90, store: "Woolworths", affordable: false, premium: true },
  { name: "Tinned Tomatoes", category: "pantry", p: 1, c: 4, f: 0.1, cal: 20, price: 20, store: "Shoprite", affordable: true, premium: false },
  { name: "Chakalaka (tinned)", category: "pantry", p: 2, c: 8, f: 2, cal: 55, price: 25, store: "Shoprite", affordable: true, premium: false },
  { name: "Baked Beans (tinned)", category: "pantry", p: 5, c: 16, f: 0.5, cal: 94, price: 22, store: "Shoprite", affordable: true, premium: false },
];

export async function initDb() {
  if (globalForPg.dbInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff_members (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'staff',
      pin TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, age INTEGER NOT NULL,
      gender TEXT NOT NULL, weight_kg DOUBLE PRECISION NOT NULL, height_cm DOUBLE PRECISION NOT NULL,
      body_fat_pct DOUBLE PRECISION, activity_level TEXT NOT NULL, goal TEXT NOT NULL,
      budget_zar DOUBLE PRECISION NOT NULL, staff_id TEXT REFERENCES staff_members(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
      protein_per_100g DOUBLE PRECISION NOT NULL, carbs_per_100g DOUBLE PRECISION NOT NULL,
      fat_per_100g DOUBLE PRECISION NOT NULL, calories_per_100g DOUBLE PRECISION NOT NULL,
      price_per_kg DOUBLE PRECISION NOT NULL, unit TEXT NOT NULL DEFAULT 'kg',
      store TEXT, is_affordable BOOLEAN NOT NULL DEFAULT TRUE, is_premium BOOLEAN NOT NULL DEFAULT FALSE
    );
    CREATE TABLE IF NOT EXISTS grocery_lists (
      id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      week_start TIMESTAMPTZ NOT NULL, total_cost DOUBLE PRECISION NOT NULL,
      budget_zar DOUBLE PRECISION NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS grocery_items (
      id TEXT PRIMARY KEY, grocery_list_id TEXT NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
      food_id TEXT NOT NULL REFERENCES foods(id), quantity_kg DOUBLE PRECISION NOT NULL, cost DOUBLE PRECISION NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      grocery_list_id TEXT NOT NULL UNIQUE REFERENCES grocery_lists(id) ON DELETE CASCADE,
      week_start TIMESTAMPTZ NOT NULL, daily_calories DOUBLE PRECISION NOT NULL,
      daily_protein DOUBLE PRECISION NOT NULL, daily_carbs DOUBLE PRECISION NOT NULL,
      daily_fat DOUBLE PRECISION NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY, meal_plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL, meal_type TEXT NOT NULL, name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meal_foods (
      id TEXT PRIMARY KEY, meal_id TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
      food_id TEXT NOT NULL REFERENCES foods(id), quantity DOUBLE PRECISION NOT NULL
    );
  `);

  // Add staff_id column to clients if it doesn't exist (safe migration)
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE clients ADD COLUMN staff_id TEXT REFERENCES staff_members(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  // Auto-seed staff members if table is empty
  const staffCount = await pool.query("SELECT COUNT(*) as count FROM staff_members");
  if (parseInt(staffCount.rows[0].count) === 0) {
    const staffSeed = [
      { name: "Taylin", role: "staff", pin: "4729" },
      { name: "Sergio", role: "staff", pin: "8156" },
      { name: "Admin", role: "admin", pin: "1313" },
    ];
    for (const s of staffSeed) {
      await pool.query(
        "INSERT INTO staff_members (id, name, role, pin) VALUES ($1,$2,$3,$4)",
        [generateId(), s.name, s.role, s.pin]
      );
    }
    console.log("Auto-seeded 3 staff/admin profiles.");
  }

  // Auto-seed foods if table is empty
  const foodCount = await pool.query("SELECT COUNT(*) as count FROM foods");
  if (parseInt(foodCount.rows[0].count) === 0) {
    for (const food of FOODS) {
      const unit = (food as Record<string, unknown>).unit as string || "kg";
      await pool.query(
        `INSERT INTO foods (id, name, category, protein_per_100g, carbs_per_100g, fat_per_100g, calories_per_100g, price_per_kg, unit, store, is_affordable, is_premium)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [generateId(), food.name, food.category, food.p, food.c, food.f, food.cal, food.price, unit, food.store, food.affordable, food.premium]
      );
    }
    console.log(`Auto-seeded ${FOODS.length} food items.`);
  }

  globalForPg.dbInitialized = true;
}
