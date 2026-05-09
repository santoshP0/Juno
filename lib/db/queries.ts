import * as SQLite from 'expo-sqlite';
import type {
  UserProfile,
  Cycle,
  DailyLog,
  Symptom,
  Mood,
} from '../../types';

// ─── User ─────────────────────────────────────────────────────────────────────

type RawUser = {
  id: number;
  name: string;
  birth_year: number | null;
  height: number | null;
  weight: number | null;
  height_unit: string;
  weight_unit: string;
  temp_unit: string;
  avg_cycle_length: number;
  avg_period_length: number;
  goal: string;
  mode: string;
  created_at: string;
};

function mapUser(row: RawUser): UserProfile {
  return {
    id: row.id,
    name: row.name ?? '',
    birthYear: row.birth_year ?? 0,
    height: row.height,
    weight: row.weight,
    heightUnit: (row.height_unit as UserProfile['heightUnit']) ?? 'cm',
    weightUnit: (row.weight_unit as UserProfile['weightUnit']) ?? 'kg',
    tempUnit: (row.temp_unit as UserProfile['tempUnit']) ?? 'celsius',
    avgCycleLength: row.avg_cycle_length ?? 28,
    avgPeriodLength: row.avg_period_length ?? 5,
    goal: (row.goal as UserProfile['goal']) ?? 'track',
    mode: (row.mode as UserProfile['mode']) ?? 'tracking',
    createdAt: row.created_at,
  };
}

export async function getUser(db: SQLite.SQLiteDatabase): Promise<UserProfile | null> {
  const row = await db.getFirstAsync<RawUser>('SELECT * FROM users WHERE id = 1');
  return row ? mapUser(row) : null;
}

export async function upsertUser(
  db: SQLite.SQLiteDatabase,
  data: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
): Promise<void> {
  await db.runAsync(
    `INSERT INTO users (id, name, birth_year, height, weight, height_unit, weight_unit, temp_unit,
       avg_cycle_length, avg_period_length, goal, mode)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       birth_year = excluded.birth_year,
       height = excluded.height,
       weight = excluded.weight,
       height_unit = excluded.height_unit,
       weight_unit = excluded.weight_unit,
       temp_unit = excluded.temp_unit,
       avg_cycle_length = excluded.avg_cycle_length,
       avg_period_length = excluded.avg_period_length,
       goal = excluded.goal,
       mode = excluded.mode`,
    data.name ?? '',
    data.birthYear ?? null,
    data.height ?? null,
    data.weight ?? null,
    data.heightUnit ?? 'cm',
    data.weightUnit ?? 'kg',
    data.tempUnit ?? 'celsius',
    data.avgCycleLength ?? 28,
    data.avgPeriodLength ?? 5,
    data.goal ?? 'track',
    data.mode ?? 'tracking'
  );
}

// ─── Cycles ───────────────────────────────────────────────────────────────────

type RawCycle = {
  id: number;
  start_date: string;
  end_date: string | null;
  length: number | null;
  period_length: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapCycle(row: RawCycle): Cycle {
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    length: row.length,
    periodLength: row.period_length,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCycles(db: SQLite.SQLiteDatabase): Promise<Cycle[]> {
  const rows = await db.getAllAsync<RawCycle>(
    'SELECT * FROM cycles ORDER BY start_date DESC'
  );
  return rows.map(mapCycle);
}

export async function insertCycle(
  db: SQLite.SQLiteDatabase,
  startDate: string
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO cycles (start_date) VALUES (?)',
    startDate
  );
  return result.lastInsertRowId;
}

export async function updateCycle(
  db: SQLite.SQLiteDatabase,
  id: number,
  data: Partial<Pick<Cycle, 'endDate' | 'length' | 'periodLength' | 'notes'>>
): Promise<void> {
  await db.runAsync(
    `UPDATE cycles SET
       end_date = COALESCE(?, end_date),
       length = COALESCE(?, length),
       period_length = COALESCE(?, period_length),
       notes = COALESCE(?, notes),
       updated_at = datetime('now')
     WHERE id = ?`,
    data.endDate ?? null,
    data.length ?? null,
    data.periodLength ?? null,
    data.notes ?? null,
    id
  );
}

export async function deleteCycle(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM cycles WHERE id = ?', id);
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

type RawLog = {
  id: number;
  date: string;
  flow: string | null;
  symptoms: string;
  moods: string;
  energy_level: string | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  sex: string | null;
  discharge: string | null;
  cervical_position: string | null;
  bbt: number | null;
  weight: number | null;
  water_intake: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapLog(row: RawLog): DailyLog {
  return {
    id: row.id,
    date: row.date,
    flow: (row.flow as DailyLog['flow']) ?? null,
    symptoms: JSON.parse(row.symptoms || '[]') as Symptom[],
    moods: JSON.parse(row.moods || '[]') as Mood[],
    energyLevel: (row.energy_level as DailyLog['energyLevel']) ?? null,
    sleepHours: row.sleep_hours,
    sleepQuality: row.sleep_quality as DailyLog['sleepQuality'],
    sex: (row.sex as DailyLog['sex']) ?? null,
    discharge: (row.discharge as DailyLog['discharge']) ?? null,
    cervicalPosition: (row.cervical_position as DailyLog['cervicalPosition']) ?? null,
    bbt: row.bbt,
    weight: row.weight,
    waterIntake: row.water_intake,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllLogs(db: SQLite.SQLiteDatabase): Promise<DailyLog[]> {
  const rows = await db.getAllAsync<RawLog>(
    'SELECT * FROM daily_logs ORDER BY date DESC'
  );
  return rows.map(mapLog);
}

export async function getLogsByDateRange(
  db: SQLite.SQLiteDatabase,
  from: string,
  to: string
): Promise<DailyLog[]> {
  const rows = await db.getAllAsync<RawLog>(
    'SELECT * FROM daily_logs WHERE date BETWEEN ? AND ? ORDER BY date DESC',
    from,
    to
  );
  return rows.map(mapLog);
}

export async function getLogByDate(
  db: SQLite.SQLiteDatabase,
  date: string
): Promise<DailyLog | null> {
  const row = await db.getFirstAsync<RawLog>(
    'SELECT * FROM daily_logs WHERE date = ?',
    date
  );
  return row ? mapLog(row) : null;
}

export async function upsertLog(
  db: SQLite.SQLiteDatabase,
  log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  await db.runAsync(
    `INSERT INTO daily_logs
       (date, flow, symptoms, moods, energy_level, sleep_hours, sleep_quality,
        sex, discharge, cervical_position, bbt, weight, water_intake, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       flow = excluded.flow,
       symptoms = excluded.symptoms,
       moods = excluded.moods,
       energy_level = excluded.energy_level,
       sleep_hours = excluded.sleep_hours,
       sleep_quality = excluded.sleep_quality,
       sex = excluded.sex,
       discharge = excluded.discharge,
       cervical_position = excluded.cervical_position,
       bbt = excluded.bbt,
       weight = excluded.weight,
       water_intake = excluded.water_intake,
       notes = excluded.notes,
       updated_at = datetime('now')`,
    log.date,
    log.flow,
    JSON.stringify(log.symptoms),
    JSON.stringify(log.moods),
    log.energyLevel,
    log.sleepHours,
    log.sleepQuality,
    log.sex,
    log.discharge,
    log.cervicalPosition,
    log.bbt,
    log.weight,
    log.waterIntake,
    log.notes
  );
}

export async function deleteLog(
  db: SQLite.SQLiteDatabase,
  date: string
): Promise<void> {
  await db.runAsync('DELETE FROM daily_logs WHERE date = ?', date);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSetting(
  db: SQLite.SQLiteDatabase,
  key: string
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export async function setSetting(
  db: SQLite.SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    key,
    value
  );
}

export async function getAllSettings(
  db: SQLite.SQLiteDatabase
): Promise<Record<string, string>> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings'
  );
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export async function getBookmarks(
  db: SQLite.SQLiteDatabase
): Promise<string[]> {
  const rows = await db.getAllAsync<{ article_id: string }>(
    'SELECT article_id FROM bookmarks ORDER BY created_at DESC'
  );
  return rows.map((r) => r.article_id);
}

export async function addBookmark(
  db: SQLite.SQLiteDatabase,
  articleId: string
): Promise<void> {
  await db.runAsync(
    'INSERT OR IGNORE INTO bookmarks (article_id) VALUES (?)',
    articleId
  );
}

export async function removeBookmark(
  db: SQLite.SQLiteDatabase,
  articleId: string
): Promise<void> {
  await db.runAsync('DELETE FROM bookmarks WHERE article_id = ?', articleId);
}

// ─── Data export / wipe ──────────────────────────────────────────────────────

export async function exportAllData(db: SQLite.SQLiteDatabase): Promise<object> {
  const [user, cycles, logs, settings, bookmarks] = await Promise.all([
    db.getFirstAsync<RawUser>('SELECT * FROM users WHERE id = 1'),
    db.getAllAsync<RawCycle>('SELECT * FROM cycles ORDER BY start_date'),
    db.getAllAsync<RawLog>('SELECT * FROM daily_logs ORDER BY date'),
    db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings'),
    db.getAllAsync<{ article_id: string }>('SELECT article_id FROM bookmarks'),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user,
    cycles,
    dailyLogs: logs,
    settings,
    bookmarks,
  };
}

export async function deleteAllData(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM daily_logs;
    DELETE FROM cycles;
    DELETE FROM bookmarks;
    DELETE FROM settings;
    DELETE FROM users;
  `);
}
