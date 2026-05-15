import { useState } from 'react';
import { Text, View, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { userApi } from '@/src/api/services';
import { useAuth } from '@/src/context/AuthContext';
import { theme } from '@/constants/theme';

const steps = [
  { icon: 'star' as const, title: 'Bienvenido a ASCENDX', text: 'Tu Life OS: objetivos, tareas, hábitos y finanzas.' },
  { icon: 'bullseye' as const, title: 'Define objetivos', text: 'Metas con prioridad y progreso con tus tareas.' },
  { icon: 'fire' as const, title: 'Construye rachas', text: 'Completa hábitos una vez al día. +15 XP por día.' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();
  const cur = steps[step];

  const finish = async () => {
    setLoading(true);
    try {
      await userApi.completeOnboarding();
      await refreshUser();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo continuar');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else void finish();
  };

  return (
    <LinearGradient colors={['#0a0a0f', '#1a1033', '#0a0a0f']} style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <FontAwesome name={cur.icon} size={40} color={theme.colors.primaryLight} />
        </View>
        <Text style={styles.title}>{cur.title}</Text>
        <Text style={styles.text}>{cur.text}</Text>
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
          onPress={next}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{step < steps.length - 1 ? 'Siguiente' : 'Empezar'}</Text>
          )}
        </Pressable>
        {step > 0 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} style={styles.back}>
            <Text style={styles.backText}>Atrás</Text>
          </Pressable>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  text: {
    color: theme.colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border },
  dotActive: { width: 28, backgroundColor: theme.colors.primary },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  back: { marginTop: 16, alignItems: 'center' },
  backText: { color: theme.colors.textMuted, fontSize: 14 },
});
