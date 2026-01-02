import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Pool } from "pg";

const app = new Hono();

const PORT = Number(process.env.PORT ?? 3000);
const DATABASE_URL = process.env.DATABASE_URL;

console.log("==== HONO API BOOT ====");
console.log("PORT:", PORT);
console.log("DATABASE_URL:", DATABASE_URL);

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is NOT defined!");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false,
});

pool.on("connect", () => {
  console.log("✅ Connected to Postgres");
});

pool.on("error", (err) => {
  console.error("❌ Postgres pool error:", err);
});

app.get("/db", async (c) => {
  console.log("➡️  /db endpoint hit");

  try {
    console.log("📡 Running CREATE TABLE...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("➕ Inserting visit row...");
    await pool.query(`INSERT INTO visits DEFAULT VALUES`);

    console.log("📊 Counting visits...");
    const result = await pool.query(`SELECT COUNT(*)::int AS count FROM visits`);

    console.log("✅ DB result:", result.rows[0]);

    return c.json({ ok: true, visits: result.rows[0].count });
  } catch (e: any) {
    console.error("❌ DB ERROR:", e);
    return c.json({ ok: false, error: e?.message ?? "db error" }, 500);
  }
});

app.get("/", (c) => {
  console.log("➡️  / endpoint hit");
  return c.text("Hello Hono!");
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
  }
);
