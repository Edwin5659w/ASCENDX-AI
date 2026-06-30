import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Card } from '../ui/Card';
import { theme } from '@/constants/theme';

const DEFAULT_SEC = 25 * 60;
const STORAGE_KEY = 'ascendx_pomodoro_left';

export function PomodoroTimer() {
  const [seconds, setSeconds] = useState(DEFAULT_SEC);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    void SecureStore.getItemAsync(STORAGE_KEY).then((v) => {
      const n = v ? parseInt(v, 10) : NaN;
      if (!Number.isNaN(n) && n > 0 && n <= DEFAULT_SEC) setSeconds(n);
    });
  }, []);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, seconds]);

  useEffect(() => {
    if (seconds === 0 && running) setRunning(false);
    void SecureStore.setItemAsync(STORAGE_KEY, String(seconds));
  }, [seconds, running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Pomodoro · 25 min foco</Text>
      <Text style={styles.time}>{mm}:{ss}</Text>
      <View style={styles.row}>
        <Pressable style={styles.primary} onPress={() => setRunning(!running)}>
          <Text style={styles.primaryText}>{running ? 'Pausar' : seconds < DEFAULT_SEC ? 'Reanudar' : 'Iniciar'}</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={() => {
            setRunning(false);
            setSeconds(DEFAULT_SEC);
          }}>
          <Text style={styles.secondaryText}>Reset</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: theme.spacing.md },
  title: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 6 },
  time: { color: theme.colors.primaryLight, fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'], marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  primary: { flex: 1, backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  secondaryText: { color: theme.colors.textMuted },
});
