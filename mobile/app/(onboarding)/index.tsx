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

import {

  FINANCE_ONBOARDING_CATEGORIES,

  ONBOARDING_FOCUS_META,

  type OnboardingStepId,

} from '../../../shared/onboarding-helpers';

import { userApi } from '@/src/api/services';
import { useAuth } from '@/src/context/AuthContext';
import { BrandLogo } from '@/src/components/brand/BrandLogo';
import { OnboardingProgress } from '@/src/components/onboarding/OnboardingProgress';
import { markWelcomePending } from '@/src/lib/welcome-pending';
import { theme } from '@/constants/theme';



type WizardStep = OnboardingStepId;



const focusKeys = Object.keys(ONBOARDING_TEMPLATES) as OnboardingFocus[];

const FOCUS_FA_ICONS: Record<
  OnboardingFocus,
  React.ComponentProps<typeof FontAwesome>['name']
> = {
  ESTUDIO: 'graduation-cap',
  SALUD: 'heartbeat',
  FINANZAS: 'money',
  TRABAJO: 'briefcase',
  PERSONAL: 'sun-o',
  EMPRENDEDOR: 'rocket',
  FITNESS: 'heartbeat',
};



export default function OnboardingScreen() {

  const [step, setStep] = useState<WizardStep>('welcome');

  const [focus, setFocus] = useState<OnboardingFocus | null>(null);

  const [goalTitle, setGoalTitle] = useState('');

  const [task1, setTask1] = useState('');

  const [task2, setTask2] = useState('');

  const [habitName, setHabitName] = useState('');

  const [financeAmount, setFinanceAmount] = useState('');

  const [financeCategory, setFinanceCategory] = useState('Comida');

  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const { user, refreshUser } = useAuth();



  const firstName = user?.name?.split(' ')[0] ?? 'viajero';

  const meta = focus ? ONBOARDING_FOCUS_META[focus] : null;



  const applyTemplate = (key: OnboardingFocus) => {

    const t = ONBOARDING_TEMPLATES[key];

    setFocus(key);

    setGoalTitle(t.goalTitle);

    setTask1(t.taskTitles[0]);

    setTask2(t.taskTitles[1]);

    setHabitName(t.habitName);

    setFinanceAmount('');

    setFinanceCategory('Comida');

  };



  const skip = async () => {
    setLoading(true);
    try {
      const t = ONBOARDING_TEMPLATES.PERSONAL;
      await userApi.setupOnboarding({
        focus: 'PERSONAL',
        goalTitle: t.goalTitle,
        taskTitles: [...t.taskTitles],
        habitName: t.habitName,
      });
      await refreshUser();
      await markWelcomePending();
      router.replace('/(tabs)');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo continuar';
      if (/ya tienes objetivos/i.test(msg)) {
        try {
          await userApi.completeOnboarding();
          await refreshUser();
          await markWelcomePending();
          router.replace('/(tabs)');
          return;
        } catch {
          /* fall through */
        }
      }
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };



  const finish = async () => {    if (!focus || goalTitle.trim().length < 3) {

      Alert.alert('Objetivo incompleto', 'Escribe un objetivo de al menos 3 caracteres');

      return;

    }

    const tasks = [task1, task2].map((t) => t.trim()).filter(Boolean);

    if (!tasks.length || !habitName.trim()) {

      Alert.alert('Datos incompletos', 'Añade al menos una tarea y un hábito');

      return;

    }



    let initialFinance: { amount: number; category: string } | undefined;

    if (focus === 'FINANZAS') {

      const amt = parseFloat(financeAmount.replace(',', '.'));

      if (amt && amt > 0 && financeCategory.trim()) {

        initialFinance = { amount: amt, category: financeCategory.trim() };

      }

    }



    setLoading(true);

    try {

      await userApi.setupOnboarding({

        focus,

        goalTitle: goalTitle.trim(),

        taskTitles: tasks,

        habitName: habitName.trim(),

        initialFinance,

      });

      await refreshUser();

      await markWelcomePending();

      router.replace('/(tabs)');

    } catch (e) {

      const msg = e instanceof Error ? e.message : 'No se pudo guardar';

      if (/ya tienes objetivos/i.test(msg)) {

        try {

          await userApi.completeOnboarding();

          await refreshUser();

          await markWelcomePending();

          router.replace('/(tabs)');

          return;

        } catch {

          /* fall through */

        }

      }

      Alert.alert('Error', msg);

    } finally {

      setLoading(false);

    }

  };



  return (

    <LinearGradient colors={['#0a0a0f', '#1a1033', '#0a0a0f']} style={styles.container}>

      <ScrollView

        contentContainerStyle={styles.inner}

        keyboardShouldPersistTaps="handled"

        showsVerticalScrollIndicator={false}>

        <OnboardingProgress step={step} />



        {step === 'welcome' && (

          <>

            <View style={styles.logoWrap}>

              <BrandLogo size="md" />

            </View>

            <Text style={styles.title}>Hola, {firstName} 👋</Text>

            <Text style={styles.titleSub}>Bienvenido a ASCENDX</Text>

            <Text style={styles.text}>

              En 1 minuto configuramos tu objetivo, tareas y hábito. La IA y el dashboard usarán

              tus datos reales desde hoy.

            </Text>

            <View style={styles.benefits}>

              {['Objetivo SMART', 'Tareas concretas', 'Hábito con racha', 'Mentor IA contextual'].map(

                (b) => (

                  <View key={b} style={styles.benefitRow}>

                    <FontAwesome name="check-circle" size={16} color={theme.colors.success} />

                    <Text style={styles.benefitText}>{b}</Text>

                  </View>

                ),

              )}

            </View>

            <Pressable

              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}

              onPress={() => setStep('focus')}>

              <Text style={styles.buttonText}>Empezar configuración</Text>

              <FontAwesome name="arrow-right" size={16} color="#fff" style={{ marginLeft: 8 }} />

            </Pressable>

            <Pressable onPress={skip} disabled={loading} style={styles.skip}>

              <Text style={styles.skipText}>
                {loading ? 'Configurando...' : 'Configuración rápida (30 seg) →'}
              </Text>

            </Pressable>

          </>

        )}



        {step === 'focus' && (

          <>

            <Text style={styles.title}>¿En qué quieres enfocarte?</Text>

            <Text style={styles.subtitle}>Toca un área. Podrás editar todo en el siguiente paso.</Text>

            {focusKeys.map((key) => {

              const m = ONBOARDING_FOCUS_META[key];

              const selected = focus === key;

              return (

                <Pressable

                  key={key}

                  style={({ pressed }) => [

                    styles.focusCard,

                    selected && styles.focusCardSelected,

                    pressed && styles.cardPressed,

                    { borderColor: selected ? m.color : theme.colors.border },

                  ]}

                  onPress={() => {

                    applyTemplate(key);

                  }}>

                  <View style={[styles.focusIcon, { backgroundColor: m.color + '22' }]}>

                    <FontAwesome name={FOCUS_FA_ICONS[key]} size={22} color={m.color} />

                  </View>

                  <View style={styles.focusBody}>

                    <Text style={styles.focusTitle}>{m.label}</Text>

                    <Text style={styles.focusDesc}>{m.description}</Text>

                    <Text style={[styles.focusMeta, { color: m.color }]}>{m.methodology}</Text>

                  </View>

                  {selected ? (

                    <FontAwesome name="check-circle" size={22} color={m.color} />

                  ) : (

                    <FontAwesome name="circle-o" size={22} color={theme.colors.textMuted} />

                  )}

                </Pressable>

              );

            })}

            <Pressable

              style={({ pressed }) => [

                styles.button,

                pressed && styles.buttonPressed,

                !focus && styles.buttonDisabled,

              ]}

              onPress={() => focus && setStep('setup')}

              disabled={!focus}>

              <Text style={styles.buttonText}>Continuar</Text>

            </Pressable>

            <Pressable onPress={() => setStep('welcome')} style={styles.back}>

              <Text style={styles.backText}>← Atrás</Text>

            </Pressable>

          </>

        )}



        {step === 'setup' && focus && meta && (

          <>

            <View style={[styles.setupBadge, { backgroundColor: meta.color + '18' }]}>

              <FontAwesome name={FOCUS_FA_ICONS[focus]} size={18} color={meta.color} />

              <Text style={[styles.setupBadgeText, { color: meta.color }]}>

                {meta.label} · {meta.methodology}

              </Text>

            </View>

            <Text style={styles.title}>Personaliza tu inicio</Text>



            <Text style={styles.label}>Objetivo principal</Text>

            <Text style={styles.hint}>{meta.goalHint}</Text>

            <TextInput

              style={styles.input}

              value={goalTitle}

              onChangeText={setGoalTitle}

              placeholder="Tu meta clara..."

              placeholderTextColor={theme.colors.textMuted}

            />



            <Text style={styles.label}>Tareas iniciales (GTD)</Text>

            <Text style={styles.hint}>Acciones pequeñas para hoy o esta semana</Text>

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

              placeholder="Tarea 2 (opcional)"

              placeholderTextColor={theme.colors.textMuted}

            />



            <Text style={styles.label}>Hábito diario</Text>

            <Text style={styles.hint}>{meta.habitHint}</Text>

            <TextInput

              style={styles.input}

              value={habitName}

              onChangeText={setHabitName}

              placeholder="Tu hábito..."

              placeholderTextColor={theme.colors.textMuted}

            />



            {focus === 'FINANZAS' && (

              <View style={styles.financeBlock}>

                <Text style={styles.label}>Primer gasto (opcional)</Text>

                <Text style={styles.hint}>Así activas gráficos y balance desde el día uno</Text>

                <TextInput

                  style={styles.input}

                  value={financeAmount}

                  onChangeText={setFinanceAmount}

                  placeholder="Monto (ej. 25.50)"

                  keyboardType="decimal-pad"

                  placeholderTextColor={theme.colors.textMuted}

                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>

                  {FINANCE_ONBOARDING_CATEGORIES.map((c) => (

                    <Pressable

                      key={c}

                      style={[styles.chip, financeCategory === c && styles.chipActive]}

                      onPress={() => setFinanceCategory(c)}>

                      <Text

                        style={[

                          styles.chipText,

                          financeCategory === c && styles.chipTextActive,

                        ]}>

                        {c}

                      </Text>

                    </Pressable>

                  ))}

                </ScrollView>

              </View>

            )}



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

                <>

                  <FontAwesome name="rocket" size={18} color="#fff" style={{ marginRight: 8 }} />

                  <Text style={styles.buttonText}>Entrar a ASCENDX</Text>

                </>

              )}

            </Pressable>

            <Pressable onPress={() => setStep('focus')} style={styles.back}>

              <Text style={styles.backText}>← Cambiar enfoque</Text>

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

    paddingHorizontal: theme.spacing.lg,

    paddingVertical: theme.spacing.xl,

    paddingTop: 48,

  },

  logoWrap: { alignItems: 'center', marginBottom: 20 },

  title: {

    color: theme.colors.text,

    fontSize: 26,

    fontWeight: '800',

    textAlign: 'center',

    marginBottom: 4,

  },

  titleSub: {

    color: theme.colors.primaryLight,

    fontSize: 16,

    fontWeight: '600',

    textAlign: 'center',

    marginBottom: 12,

  },

  subtitle: {

    color: theme.colors.textMuted,

    textAlign: 'center',

    marginBottom: 20,

    lineHeight: 20,

  },

  text: {

    color: theme.colors.textMuted,

    fontSize: 15,

    lineHeight: 23,

    textAlign: 'center',

    marginBottom: 20,

  },

  benefits: { marginBottom: 24, gap: 10 },

  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  benefitText: { color: theme.colors.text, fontSize: 14 },

  focusCard: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 14,

    backgroundColor: theme.colors.surface,

    borderWidth: 2,

    borderRadius: 16,

    padding: 14,

    marginBottom: 10,

  },

  focusCardSelected: {

    backgroundColor: theme.colors.surfaceLight,

  },

  cardPressed: { opacity: 0.9 },

  focusIcon: {

    width: 48,

    height: 48,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

  },

  focusBody: { flex: 1 },

  focusTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },

  focusDesc: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },

  focusMeta: { fontSize: 11, fontWeight: '600', marginTop: 6 },

  setupBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

    alignSelf: 'center',

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 20,

    marginBottom: 16,

  },

  setupBadgeText: { fontSize: 13, fontWeight: '600' },

  label: {

    color: theme.colors.text,

    fontSize: 13,

    fontWeight: '600',

    marginBottom: 4,

    marginTop: 12,

  },

  hint: {

    color: theme.colors.textMuted,

    fontSize: 11,

    marginBottom: 6,

    lineHeight: 16,

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

  inputGap: { marginTop: 8 },

  financeBlock: {

    marginTop: 8,

    padding: 14,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: theme.colors.accent + '44',

    backgroundColor: theme.colors.accent + '0c',

  },

  chips: { marginTop: 10, marginBottom: 4 },

  chip: {

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 20,

    backgroundColor: theme.colors.surface,

    borderWidth: 1,

    borderColor: theme.colors.border,

    marginRight: 8,

  },

  chipActive: {

    borderColor: theme.colors.accent,

    backgroundColor: theme.colors.accent + '22',

  },

  chipText: { color: theme.colors.textMuted, fontSize: 12 },

  chipTextActive: { color: theme.colors.accent, fontWeight: '600' },

  button: {

    backgroundColor: theme.colors.primary,

    paddingVertical: 16,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

    flexDirection: 'row',

    marginTop: 24,

  },

  buttonPressed: { opacity: 0.92 },

  buttonDisabled: { opacity: 0.45 },

  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  skip: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },

  skipText: { color: theme.colors.textMuted, fontSize: 14 },

  back: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },

  backText: { color: theme.colors.primaryLight, fontSize: 14, fontWeight: '500' },

});


