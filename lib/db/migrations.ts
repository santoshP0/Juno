import * as SQLite from 'expo-sqlite';
import { CURRENT_SCHEMA_VERSION } from './schema';

type Migration = {
  version: number;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
};

const migrations: Migration[] = [
  // Version 1 — baseline schema (handled by initializeDatabase)
  // Add future migrations here:
  // {
  //   version: 2,
  //   up: async (db) => {
  //     await db.execAsync(`ALTER TABLE users ADD COLUMN ...`);
  //   },
  // },
];

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const versionRow = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
  );
  const currentVersion = versionRow?.version ?? 0;

  const pending = migrations.filter((m) => m.version > currentVersion);
  if (pending.length === 0) return;

  for (const migration of pending.sort((a, b) => a.version - b.version)) {
    await migration.up(db);
    await db.runAsync(
      'INSERT OR REPLACE INTO schema_version (version) VALUES (?)',
      migration.version
    );
  }
}
