import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/src/components/ui/Card';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { userApi } from '@/src/api/services';
import { theme } from '@/constants/theme';

function isFocusToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getUTCFullYear() === today.getUTCFullYear() &&
    d.getUTCMonth() === today.getUTCMonth() &&
    d.getUTCDate() === today.getUTCDate()
  );
}

export function DailyFocus() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [focus, setFocus] = useState(
    user?.dailyFocus && isFocusToday(user.dailyFocusDate) ? user.dailyFocus : '',
  );
  const [saving, setSaving] = useState(false);

  const hasTodayFocus = user?.dailyFocus && isFocusToday(user.dailyFocusDate);

  const save = async () => {
    if (!focus.trim() || focus.trim().length < 3) {
      showToast('Escribe tu foco del día (mín. 3 caracteres)', 'info');
      return;
    }
    setSaving(true);
    try {
      await userApi.setDailyFocus(focus.trim());
      await refreshUser();
      showToast('Foco del día guardado ✓', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="crosshairs" size={18} color={theme.colors.accent} />
        <Text style={styles.title}>Foco del día</Text>
      </View>
      {hasTodayFocus ? (
        <Text style={styles.focusText}>&ldquo;{user?.dailyFocus}&rdquo;</Text>
      ) : (
        <>
          <Text style={styles.hint}>Una sola prioridad. La IA la usará en tu plan.</Text>
          <View style={styles.row}>
            <TextInput
              value={focus}
              onChangeText={setFocus}
              placeholder="Ej: Terminar el informe"
              placeholderTextColor={theme.colors.textMuted}
              maxLength={120}
              style={styles.input}
            />
            <Pressable
              onPress={() => void save()}
              disabled={saving}
              style={[styles.btn, saving && styles.btnDisabled]}>
              <Text style={styles.btnText}>{saving ? '...' : 'Fijar'}</Text>
            </Pressable>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  hint: { color: theme.colors.textMuted, fontSize: 12, marginBottom: 10 },
  focusText: { color: theme.colors.accent, fontSize: 15, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
    fontSize: 14,
  },
  btn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: theme.colors.background, fontWeight: '700', fontSize: 14 },
});
