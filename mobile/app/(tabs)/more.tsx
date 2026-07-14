import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps } from 'react';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

type LinkHref = '/(tabs)/goals' | '/(tabs)/finance' | '/(tabs)/achievements' | '/(tabs)/profile';

function getLinks(theme: AppTheme): {
  href: LinkHref;
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof FontAwesome>['name'];
  color: string;
}[] {
  return [
    {
      href: '/(tabs)/goals',
      title: 'Objetivos',
      subtitle: 'Metas claras y progreso con tus tareas',
      icon: 'flag',
      color: theme.colors.primary,
    },
    {
      href: '/(tabs)/finance',
      title: 'Finanzas',
      subtitle: 'Ingresos, gastos y balance',
      icon: 'money',
      color: theme.colors.success,
    },
    {
      href: '/(tabs)/achievements',
      title: 'Logros',
      subtitle: 'Insignias y rachas desbloqueadas',
      icon: 'trophy',
      color: theme.colors.warning,
    },
    {
      href: '/(tabs)/profile',
      title: 'Perfil',
      subtitle: 'Tu nombre, plan y preferencias',
      icon: 'user',
      color: theme.colors.accent,
    },
  ];
}

function createStyles(theme: AppTheme) {
  return {
    screen: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 16, gap: 10, paddingBottom: 32 },
    lead: { color: theme.colors.textMuted, fontSize: 14, marginBottom: 8, lineHeight: 20 },
    card: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      padding: 14,
    },
    cardPressed: { opacity: 0.85 },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: theme.colors.surfaceLight,
    },
    copy: { flex: 1 },
    title: { color: theme.colors.text, fontSize: 16, fontWeight: '700' as const },
    subtitle: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  };
}

export default function MoreScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const links = getLinks(theme);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>Más herramientas de tu espacio: objetivos, dinero, logros y cuenta.</Text>
      {links.map((item) => (
        <Pressable
          key={item.href}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push(item.href)}>
          <View style={styles.iconWrap}>
            <FontAwesome name={item.icon} size={20} color={item.color} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={theme.colors.textMuted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
