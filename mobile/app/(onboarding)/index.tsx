import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ONBOARDING_TEMPLATES,
  type OnboardingFocus,
} from '../../../shared/validators/onboarding.validator';
import { userApi } from '@/src/api/services';
import { useAuth } from '@/src/context/AuthContext';
import { theme } from '@/constants/theme';

type WizardStep = 'welcome' | 'focus' | 'setup';

const focusKeys = Object.keys(ONBOARDING_TEMPLATES) as OnboardingFocus[];

export default function OnboardingScreen() {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [focus, setFocus] = useState<OnboardingFocus | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [task1, setTask1] = useState('');
  const [task2, setTask2] = useState('');
  const [habitName, setHabitName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const applyTemplate = (key: OnboardingFocus) => {
    const t = ONBOARDING_TEMPLATES[key];
    setFocus(key);
    setGoalTitle(t.goalTitle);
    setTask1(t.taskTitles[0]);
    setTask2(t.taskTitles[1]);
    setHabitName(t.habitName);
  };

  const skip = async () => {
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

  const finish = async () => {
    if (!focus || goalTitle.trim().length < 3) {
      Alert.alert('Completa tu objetivo principal');
      return;
    }
    const tasks = [task1, task2].map((t) => t.trim()).filter(Boolean);
    if (!tasks.length || !habitName.trim()) {
      Alert.alert('Añade al menos una tarea y un hábito');
      return;
    }

    setLoading(true);
    try {
      await userApi.setupOnboarding({
        focus,
        goalTitle: goalTitle.trim(),
        taskTitles: tasks,
        habitName: habitName.trim(),
      });
      await refreshUser();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0a0f', '#1a1033', '#0a0a0f']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {step === 'welcome' && (
          <>
            <View style={styles.iconWrap}>
              <FontAwesome name="rocket" size={40} color={theme.colors.primaryLight} />
            </View>
            <Text style={styles.title}>Bienvenido a ASCENDX</Text>
            <Text style={styles.text}>
              Configura tu primer objetivo, tareas y hábito para que la IA tenga contexto desde el
              día uno.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => setStep('focus')}>
              <Text style={styles.buttonText}>Configurar mi espacio</Text>
            </Pressable>
            <Pressable onPress={skip} disabled={loading} style={styles.skip}>
              <Text style={styles.skipText}>{loading ? 'Omitiendo...' : 'Omitir por ahora'}</Text>
            </Pressable>
          </>
        )}

        {step === 'focus' && (
          <>
            <Text style={styles.title}>¿En qué quieres enfocarte?</Text>
            <Text style={styles.subtitle}>Elige una plantilla editable después.</Text>
            {focusKeys.map((key) => (
              <Pressable
                key={key}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => {
                  applyTemplate(key);
                  setStep('setup');
                }}>
                <Text style={styles.cardTitle}>{ONBOARDING_TEMPLATES[key].label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setStep('welcome')} style={styles.back}>
              <Text style={styles.backText}>Atrás</Text>
            </Pressable>
          </>
        )}

        {step === 'setup' && focus && (
          <>
            <Text style={styles.focusLabel}>{ONBOARDING_TEMPLATES[focus].label}</Text>
            <Text style={styles.title}>Personaliza tu inicio</Text>
            <Text style={styles.label}>Objetivo principal</Text>
            <TextInput
              style={styles.input}
              value={goalTitle}
              onChangeText={setGoalTitle}
              placeholderTextColor={theme.colors.textMuted}
            />
            <Text style={styles.label}>Tareas iniciales</Text>
            <TextInput
              style={styles.input}
              value={task1}
              onChangeText={setTask1}
              placeholder="Tarea 1"
              placeholderTextColor={theme.colors.textMuted}
            />
            <TextInput
              style={[styles.input, styles.inputGap]}
              value={task2}
              onChangeText={setTask2}
              placeholder="Tarea 2"
              placeholderTextColor={theme.colors.textMuted}
            />
            <Text style={styles.label}>Hábito diario</Text>
            <TextInput
              style={styles.input}
              value={habitName}
              onChangeText={setHabitName}
              placeholderTextColor={theme.colors.textMuted}
            />
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={finish}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Empezar con ASCENDX</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setStep('focus')} style={styles.back}>
              <Text style={styles.backText}>Cambiar enfoque</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
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
  subtitle: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  text: {
    color: theme.colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  focusLabel: {
    color: theme.colors.primaryLight,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 16,
  },
  inputGap: { marginBottom: 8 },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardPressed: { opacity: 0.85 },
  cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skip: { marginTop: 16, alignItems: 'center' },
  skipText: { color: theme.colors.textMuted, fontSize: 14 },
  back: { marginTop: 16, alignItems: 'center' },
  backText: { color: theme.colors.textMuted, fontSize: 14 },
});
