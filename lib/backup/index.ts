import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import * as SQLite from 'expo-sqlite';
import { exportAllData, deleteAllData } from '../db/queries';
import { initializeDatabase } from '../db/schema';

const BACKUP_DIR = FileSystem.documentDirectory + 'juno_backups/';
const BACKUP_VERSION = '1.0';

export interface BackupData {
  version: string;
  exportedAt: string;
  schemaVersion: number;
  user: object | null;
  cycles: object[];
  dailyLogs: object[];
  settings: object[];
  bookmarks: object[];
}

async function ensureBackupDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(BACKUP_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
  }
}

export async function exportBackup(db: SQLite.SQLiteDatabase): Promise<void> {
  await ensureBackupDir();

  const data = await exportAllData(db);
  const backup: BackupData = {
    version: BACKUP_VERSION,
    ...(data as Omit<BackupData, 'version'>),
  };

  const filename = `juno_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
  const uri = BACKUP_DIR + filename;

  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save Juno Backup',
      UTI: 'public.json',
    });
  }
}

export async function exportCSV(db: SQLite.SQLiteDatabase): Promise<void> {
  await ensureBackupDir();

  const data = (await exportAllData(db)) as BackupData;
  const logs = data.dailyLogs as Record<string, unknown>[];

  if (logs.length === 0) return;

  const headers = [
    'date', 'flow', 'symptoms', 'moods', 'energy_level',
    'sleep_hours', 'sleep_quality', 'sex', 'discharge',
    'cervical_position', 'bbt', 'weight', 'water_intake', 'notes',
  ];

  const rows = logs.map((log) =>
    headers
      .map((h) => {
        const v = log[h];
        if (v === null || v === undefined) return '';
        if (typeof v === 'string' && v.startsWith('[')) {
          return (JSON.parse(v) as string[]).join(';');
        }
        return String(v).replace(/,/g, ';');
      })
      .join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const filename = `juno_export_${format(new Date(), 'yyyyMMdd')}.csv`;
  const uri = BACKUP_DIR + filename;

  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Juno Data as CSV',
    });
  }
}

export async function importBackup(
  db: SQLite.SQLiteDatabase,
  uri: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const backup = JSON.parse(content) as BackupData;

    if (!backup.version || !backup.exportedAt) {
      return { success: false, error: 'Invalid backup file format.' };
    }

    // Wipe existing data
    await deleteAllData(db);
    await initializeDatabase(db);

    // Re-insert user
    if (backup.user) {
      const u = backup.user as Record<string, unknown>;
      await db.runAsync(
        `INSERT OR REPLACE INTO users
           (id, name, birth_year, height, weight, height_unit, weight_unit, temp_unit,
            avg_cycle_length, avg_period_length, goal, mode, created_at)
         VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?)`,
        u.name as string,
        u.birth_year as number,
        u.height as number,
        u.weight as number,
        (u.height_unit as string) ?? 'cm',
        (u.weight_unit as string) ?? 'kg',
        (u.temp_unit as string) ?? 'celsius',
        (u.avg_cycle_length as number) ?? 28,
        (u.avg_period_length as number) ?? 5,
        (u.goal as string) ?? 'track',
        (u.mode as string) ?? 'tracking',
        u.created_at as string
      );
    }

    // Re-insert cycles
    for (const c of backup.cycles as Record<string, unknown>[]) {
      await db.runAsync(
        `INSERT OR IGNORE INTO cycles (id, start_date, end_date, length, period_length, notes, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        c.id as number,
        c.start_date as string,
        c.end_date as string,
        c.length as number,
        c.period_length as number,
        c.notes as string,
        c.created_at as string,
        c.updated_at as string
      );
    }

    // Re-insert daily logs
    for (const l of backup.dailyLogs as Record<string, unknown>[]) {
      await db.runAsync(
        `INSERT OR IGNORE INTO daily_logs
           (id, date, flow, symptoms, moods, energy_level, sleep_hours, sleep_quality,
            sex, discharge, cervical_position, bbt, weight, water_intake, notes, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        l.id as number,
        l.date as string,
        l.flow as string,
        l.symptoms as string,
        l.moods as string,
        l.energy_level as string,
        l.sleep_hours as number,
        l.sleep_quality as number,
        l.sex as string,
        l.discharge as string,
        l.cervical_position as string,
        l.bbt as number,
        l.weight as number,
        l.water_intake as number,
        l.notes as string,
        l.created_at as string,
        l.updated_at as string
      );
    }

    // Re-insert bookmarks
    for (const b of backup.bookmarks as Record<string, unknown>[]) {
      await db.runAsync(
        'INSERT OR IGNORE INTO bookmarks (article_id, created_at) VALUES (?,?)',
        b.article_id as string,
        b.created_at as string
      );
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error during import.',
    };
  }
}
