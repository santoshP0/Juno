import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { useColors } from '../../hooks/useTheme';
import { Radius, Shadow, Spacing } from '../../constants/theme';
import { Colors } from '../../constants/colors';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const colors = useColors();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface },
                Shadow.lg,
              ]}
            >
              <Typography variant="h4" align="center" style={{ marginBottom: Spacing.sm }}>
                {title}
              </Typography>
              <Typography
                variant="body2"
                align="center"
                color={colors.textSecondary}
                style={{ marginBottom: Spacing.xl }}
              >
                {message}
              </Typography>

              <View style={styles.buttons}>
                <Button
                  label={cancelLabel}
                  onPress={onCancel}
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <Button
                  label={confirmLabel}
                  onPress={onConfirm}
                  variant={destructive ? 'danger' : 'primary'}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
