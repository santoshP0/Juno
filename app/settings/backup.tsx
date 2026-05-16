import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Download, Upload } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSQLiteContext } from 'expo-sqlite';

import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useColors } from '../../hooks/useTheme';
import { useCycle } from '../../hooks/useCycle';
import { exportBackup, importBackup } from '../../lib/backup';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';

export default function BackupScreen() {
  const router = useRouter();
  const colors = useColors();
  const db = useSQLiteContext();
  const { reload } = useCycle();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportBackup(db);
    } catch (e) {
      Alert.alert('Export failed', 'Could not export your data. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [db]);

  const handleImport = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      Alert.alert(
        'Restore from backup?',
        'This will replace all your current data with the backup. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              setImporting(true);
              const { success, error } = await importBackup(db, result.assets[0].uri);
              if (success) {
                await reload();
                Alert.alert('Restored!', 'Your data has been restored successfully.');
              } else {
                Alert.alert('Import failed', error ?? 'Unknown error.');
              }
              setImporting(false);
            },
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Could not open file picker.');
    }
  }, [db, reload]);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h4">Backup & Restore</Typography>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Typography variant="body2" color={colors.textSecondary}>
          Your data is stored locally on your device. Export a backup to keep a copy safe, or restore from a previous backup.
        </Typography>

        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Export
          </Typography>

          <View style={s.optionRow}>
            <View style={[s.iconBox, { backgroundColor: colors.accent + '22' }]}>
              <Download size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body">Export backup (JSON)</Typography>
              <Typography variant="caption" color={colors.textTertiary}>
                Complete backup of all your data. Use this to restore.
              </Typography>
            </View>
          </View>
          <Button
            label="Export backup"
            onPress={handleExport}
            loading={exporting}
            fullWidth
            style={{ marginTop: 12 }}
          />
        </Card>

        <Card padding={16}>
          <Typography variant="label" color={colors.textSecondary} style={{ marginBottom: 12 }}>
            Restore
          </Typography>
          <View style={s.optionRow}>
            <View style={[s.iconBox, { backgroundColor: Colors.gold + '22' }]}>
              <Upload size={20} color={Colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body">Restore from backup</Typography>
              <Typography variant="caption" color={colors.textTertiary}>
                Select a Juno JSON backup file from your device.
              </Typography>
            </View>
          </View>
          <Button
            label="Choose backup file"
            onPress={handleImport}
            loading={importing}
            variant="outline"
            fullWidth
            style={{ marginTop: 12 }}
          />
        </Card>

        <Card padding={16} style={{ borderColor: Colors.gold + '44', borderWidth: 1 }}>
          <Typography variant="label" color={Colors.goldDark} style={{ marginBottom: 6 }}>
            💡 Tip
          </Typography>
          <Typography variant="body2" color={colors.textSecondary}>
            Export a backup regularly and store it in your cloud storage (Google Drive, Dropbox, etc.) for safekeeping.
          </Typography>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  optionRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
