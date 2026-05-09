import * as SQLite from 'expo-sqlite';

export const CURRENT_SCHEMA_VERSION = 1;

export async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT DEFAULT '',
      birth_year INTEGER,
      height REAL,
      weight REAL,
      height_unit TEXT DEFAULT 'cm',
      weight_unit TEXT DEFAULT 'kg',
      temp_unit TEXT DEFAULT 'celsius',
      avg_cycle_length INTEGER DEFAULT 28,
      avg_period_length INTEGER DEFAULT 5,
      goal TEXT DEFAULT 'track',
      mode TEXT DEFAULT 'tracking',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      length INTEGER,
      period_length INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cycles_start_date ON cycles(start_date);

    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      flow TEXT,
      symptoms TEXT DEFAULT '[]',
      moods TEXT DEFAULT '[]',
      energy_level TEXT,
      sleep_hours REAL,
      sleep_quality INTEGER,
      sex TEXT,
      discharge TEXT,
      cervical_position TEXT,
      bbt REAL,
      weight REAL,
      water_intake INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      article_id TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const versionRow = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
  );

  if (!versionRow) {
    await db.runAsync(
      'INSERT OR IGNORE INTO schema_version (version) VALUES (?)',
      CURRENT_SCHEMA_VERSION
    );
  }
}
