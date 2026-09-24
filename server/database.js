import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL?.trim();
const pool = connectionString
  ? new Pool({
      connectionString,
      connectionTimeoutMillis: 3000,
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
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
      created_at TIMESTAMPTZ NOT NULL,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      profile JSONB NOT NULL DEFAULT '{}'::jsonb
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
    createdAt: new Date(row.created_at).toISOString(),
    salt: row.salt,
    passwordHash: row.password_hash,
  };
}

function disableDatabase(message, error) {
  databaseDisabled = true;
  console.error(message, error instanceof Error ? error.message : error);
}

export async function syncUsersWithDatabase(fallbackUsers = []) {
  if (!pool || databaseDisabled) return fallbackUsers;
  try {
    await initDatabase();
    const current = await pool.query("SELECT * FROM users ORDER BY created_at ASC");
    if (current.rows.length > 0) return current.rows.map(rowToUser);

    for (const user of fallbackUsers) {
      await saveUserToDatabase(user);
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
    delete profile.createdAt;
    delete profile.salt;
    delete profile.passwordHash;
    await pool.query(
      `INSERT INTO users (id, username, username_normalized, email, created_at, salt, password_hash, profile)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         username = EXCLUDED.username,
         username_normalized = EXCLUDED.username_normalized,
         email = EXCLUDED.email,
         salt = EXCLUDED.salt,
         password_hash = EXCLUDED.password_hash,
         profile = EXCLUDED.profile`,
      [
        user.id,
        user.username,
        String(user.username).trim().toLocaleLowerCase("en-US"),
        user.email || "",
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

export async function closeDatabase() {
  if (pool) await pool.end();
}