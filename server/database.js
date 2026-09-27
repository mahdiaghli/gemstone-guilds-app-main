import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL?.trim();
const pool = connectionString
  ? new Pool({
      connectionString,
      connectionTimeoutMillis: 3000,
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: true } : undefined,
    })
  : null;

let initialized = false;
let databaseDisabled = false;

export function isDatabaseEnabled() {
  return Boolean(pool) && !databaseDisabled;
}

export async function initDatabase() {
  if (!pool || databaseDisabled || initialized) return Boolean(pool) && !databaseDisabled;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      username_normalized TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      profile JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `);
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT ''");
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users (phone) WHERE phone <> ''");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shared_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  initialized = true;
  return true;
}

function rowToUser(row) {
  return {
    ...(row.profile || {}),
    id: row.id,
    username: row.username,
    email: row.email,
    phone: row.phone,
    createdAt: new Date(row.created_at).toISOString(),
    salt: row.salt,
    passwordHash: row.password_hash,
  };
}

function disableDatabase(message, error) {
  if (process.env.NODE_ENV === "production") {
    throw error instanceof Error ? error : new Error(String(error));
  }
  databaseDisabled = true;
  console.error(message, error instanceof Error ? error.message : error);
}

export async function syncUsersWithDatabase(fallbackUsers = []) {
  if (!pool || databaseDisabled) return fallbackUsers;
  try {
    await initDatabase();
    const current = await pool.query("SELECT * FROM users ORDER BY created_at ASC");
    const existing = new Map(current.rows.map((row) => [row.id, rowToUser(row)]));
    for (const user of fallbackUsers) {
      const stored = existing.get(user.id);
      if (!stored || (user.updatedAt && new Date(user.updatedAt).getTime() > new Date(stored.updatedAt || stored.createdAt).getTime())) {
        await saveUserToDatabase(user);
      }
    }
    const migrated = await pool.query("SELECT * FROM users ORDER BY created_at ASC");
    return migrated.rows.map(rowToUser);
  } catch (error) {
    disableDatabase("PostgreSQL unavailable; using local JSON user storage:", error);
    return fallbackUsers;
  }
}

export async function saveUserToDatabase(user) {
  if (!pool || databaseDisabled) return false;
  try {
    await initDatabase();
    const profile = { ...user };
    delete profile.id;
    delete profile.username;
    delete profile.email;
    delete profile.phone;
    delete profile.createdAt;
    delete profile.salt;
    delete profile.passwordHash;
    await pool.query(
      `INSERT INTO users (id, username, username_normalized, email, phone, created_at, salt, password_hash, profile)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         username = EXCLUDED.username,
         username_normalized = EXCLUDED.username_normalized,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         salt = EXCLUDED.salt,
         password_hash = EXCLUDED.password_hash,
         profile = EXCLUDED.profile`,
      [
        user.id,
        user.username,
        String(user.username).trim().toLocaleLowerCase("en-US"),
        user.email || "",
        user.phone || "",
        user.createdAt || new Date().toISOString(),
        user.salt,
        user.passwordHash,
        JSON.stringify(profile),
      ],
    );
    return true;
  } catch (error) {
    disableDatabase("Could not persist user to PostgreSQL; local JSON remains active:", error);
    return false;
  }
}

export async function loadSharedStateFromDatabase(fallbackState) {
  if (!pool) return fallbackState;
  await initDatabase();
  const result = await pool.query("SELECT data FROM shared_state WHERE id = 1");
  if (result.rows.length) return result.rows[0].data;
  await pool.query(
    "INSERT INTO shared_state (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING",
    [JSON.stringify(fallbackState)],
  );
  const inserted = await pool.query("SELECT data FROM shared_state WHERE id = 1");
  return inserted.rows[0].data;
}

export async function saveSharedStateToDatabase(state) {
  if (!pool) return false;
  await initDatabase();
  await pool.query(
    `INSERT INTO shared_state (id, data, updated_at) VALUES (1, $1::jsonb, now())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
    [JSON.stringify(state)],
  );
  return true;
}

export async function closeDatabase() {
  if (pool) await pool.end();
}
