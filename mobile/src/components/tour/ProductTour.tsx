import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { PRODUCT_TOUR_STEPS, type ProductTourIcon } from '../../../../shared/product-tour';
import { BrandLogo } from '@/src/components/brand/BrandLogo';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { userApi } from '@/src/api/services';
import { XP } from '../../../../shared/retention';
import { PLAN_LIMITS, PLAN_PRICING } from '../../../../shared/plans';

const ICON_MAP: Record<ProductTourIcon, React.ComponentProps<typeof FontAwesome>['name']> = {
  wave: 'hand-paper-o',
  home: 'home',
  tasks: 'check-square-o',
  habits: 'fire',
  brain: 'lightbulb-o',
  trophy: 'trophy',
  compare: 'star',
  rocket: 'rocket',
};

interface ProductTourProps {
  visible: boolean;
  userName?: string;
  onClose: () => void;
}

function createStyles(theme: AppTheme) {
  return {
    root: { flex: 1, backgroundColor: theme.colors.background },
    progressWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    progressHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 8,
    },
    progressLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' as const },
    skip: { color: theme.colors.textMuted, fontSize: 12 },
    progressTrack: {
      height: 10,
      backgroundColor: theme.colors.surfaceLight,
      borderRadius: 8,
      overflow: 'hidden' as const,
    },
    progressFill: { height: '100%' as const, borderRadius: 8 },
    scroll: { paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center' as const },
    logoWrap: { marginVertical: 24 },
    iconCircle: {
      width: 112,
      height: 112,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary + '55',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginVertical: 24,
    },
    bubble: {
      width: '100%' as const,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 20,
      marginBottom: 16,
    },
    title: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '800' as const,
      textAlign: 'center' as const,
      marginBottom: 10,
    },
    body: {
      color: theme.colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center' as const,
    },
    bulletRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 10,
      width: '100%' as const,
      backgroundColor: theme.colors.surfaceLight,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    check: { color: '#34d399', fontSize: 14, fontWeight: '700' as const },
    bulletText: { flex: 1, color: theme.colors.text, fontSize: 14, lineHeight: 20 },
    compareBox: {
      width: '100%' as const,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 14,
      marginTop: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    compareRow: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 6, lineHeight: 18 },
    compareFree: { color: '#34d399', fontWeight: '700' as const },
    comparePro: { color: theme.colors.primaryLight, fontWeight: '700' as const },
    xpRow: { flexDirection: 'row' as const, gap: 12, width: '100%' as const, marginTop: 8 },
    xpChip: {
      flex: 1,
      backgroundColor: theme.colors.primary + '22',
      borderRadius: 12,
      padding: 12,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: theme.colors.primary + '44',
    },
    xpVal: { color: theme.colors.primaryLight, fontWeight: '800' as const, fontSize: 18 },
    xpLbl: { color: theme.colors.textMuted, fontSize: 10, marginTop: 2 },
    footer: {
      padding: 20,
      paddingBottom: 36,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    cta: { borderRadius: 16, overflow: 'hidden' as const, marginBottom: 8 },
    ctaGrad: { paddingVertical: 16, alignItems: 'center' as const },
    ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' as const },
    secondary: {
      color: theme.colors.textMuted,
      textAlign: 'center' as const,
      fontSize: 14,
      paddingVertical: 10,
    },
    hint: { color: theme.colors.textMuted, textAlign: 'center' as const, fontSize: 11 },
  };
}

export function ProductTour({ visible, userName, onClose }: ProductTourProps) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const bounce = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  const steps = PRODUCT_TOUR_STEPS;
  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  const isLast = step === steps.length - 1;
  const firstName = userName?.split(' ')[0] ?? 'viajero';
  const title =
    current?.id === 'welcome' ? current.title.replace('!', `, ${firstName}!`) : current?.title ?? '';

  useEffect(() => {
    if (visible) {
      setStep(0);
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [visible, fade]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -8,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounce, step]);

  const finish = useCallback(
    async (goTasks: boolean) => {
      setFinishing(true);
      try {
        await userApi.completeProductTour();
      } catch {
        /* ok */
      }
      onClose();
      if (goTasks) router.push('/(tabs)/tasks' as never);
    },
    [onClose, router],
  );

  const next = () => {
    if (isLast) void finish(true);
    else setStep((s) => s + 1);
  };

  if (!current) return null;

  const iconName = ICON_MAP[current.icon];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.root}>
        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Paso {step + 1} de {steps.length}
            </Text>
            <Pressable onPress={() => void finish(false)} hitSlop={12}>
              <Text style={styles.skip}>Saltar</Text>
            </Pressable>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fade, transform: [{ translateY: bounce }] }}>
            {current.id === 'welcome' ? (
              <View style={styles.logoWrap}>
                <BrandLogo size="md" />
              </View>
            ) : (
              <View style={styles.iconCircle}>
                <FontAwesome name={iconName} size={44} color={theme.colors.accent} />
              </View>
            )}
          </Animated.View>

          <View style={styles.bubble}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{current.body}</Text>
          </View>

          {current.bullets?.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}

          {current.id === 'plans' ? (
            <View style={styles.compareBox}>
              <Text style={styles.compareRow}>
                <Text style={styles.compareFree}>Gratis: </Text>
                {PLAN_LIMITS.FREE.aiChatPerDay} IA/día · {PLAN_LIMITS.FREE.maxGoals} objetivos
              </Text>
              <Text style={styles.compareRow}>
                <Text style={styles.comparePro}>Pro ${PLAN_PRICING.PRO.price}/mes: </Text>
                {PLAN_LIMITS.PRO.aiChatPerDay} IA/día · resumen semanal
              </Text>
            </View>
          ) : null}

          {current.id === 'finish' ? (
            <View style={styles.xpRow}>
              <View style={styles.xpChip}>
                <Text style={styles.xpVal}>+{XP.TASK_COMPLETE} XP</Text>
                <Text style={styles.xpLbl}>primera tarea</Text>
              </View>
              <View style={styles.xpChip}>
                <Text style={styles.xpVal}>+{XP.HABIT_COMPLETE} XP</Text>
                <Text style={styles.xpLbl}>hábito hoy</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.cta} onPress={next} disabled={finishing}>
            <LinearGradient
              colors={[theme.colors.primary, '#00A3FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGrad}>
              <Text style={styles.ctaText}>
                {finishing ? 'Preparando...' : isLast ? current.cta : current.cta ?? 'Continuar'} →
              </Text>
            </LinearGradient>
          </Pressable>
          {isLast ? (
            <Pressable onPress={() => void finish(false)}>
              <Text style={styles.secondary}>Explorar el dashboard</Text>
            </Pressable>
          ) : (
            <Text style={styles.hint}>Gratis para siempre · Pro desde ${PLAN_PRICING.PRO.price}/mes</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
