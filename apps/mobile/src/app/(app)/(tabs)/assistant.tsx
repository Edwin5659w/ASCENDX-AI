import { router } from 'expo-router';
import { View } from 'react-native';
import { MentorMark } from '@/components/brand/MentorMark';
import { AppText, Button, Card, Icon, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTheme } from '@/theme/useTheme';

/** Estructura de cada respuesta del mentor (sección 15.6). */
const ANSWER_STRUCTURE = [
  { title: 'Resumen de tu situación', detail: 'En dos o tres frases, sin tecnicismos.' },
  { title: 'Objetivo analizado', detail: 'La meta o decisión sobre la que preguntaste.' },
  { title: 'Datos utilizados', detail: 'Las cifras calculadas por la app en las que se basa.' },
  { title: 'Recomendación principal', detail: 'Una sola idea clara.' },
  { title: 'Pasos concretos', detail: 'Acciones que puedes hacer hoy dentro de la app.' },
  { title: 'Alternativas', detail: 'Otros caminos y lo que implica cada uno.' },
  { title: 'Supuestos y límites', detail: 'Qué no sabe y qué podría cambiar el resultado.' },
];

/**
 * Mentor ASCENDX AI (secciones 11 y 15.6). Se construye en la fase 4
 * (RF-23 a RF-26). Mientras tanto se muestra cómo funcionará, sin simular
 * respuestas.
 */
export default function AssistantScreen() {
  const { user } = useAuth();
  const { spacing } = useTheme();
  const allowed = user?.consents.ia.granted ?? false;

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg }}>
        <MentorMark size={88} animate />
        <AppText variant="title" align="center" accessibilityRole="header">
          Tu mentor ASCENDX AI
        </AppText>
        <AppText color="textMuted" align="center" style={{ maxWidth: 340 }}>
          Explica tu situación y tus escenarios con las cifras que calculó la app. Nunca inventa números ni te
          recomienda endeudarte.
        </AppText>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="info" color="violetText" size={20} />
          <AppText variant="heading">En desarrollo · fase 4</AppText>
        </View>
        <AppText variant="caption" color="textMuted">
          Así estará organizada cada respuesta:
        </AppText>
        <View style={{ gap: spacing.md }}>
          {ANSWER_STRUCTURE.map((item) => (
            <View key={item.title} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <Icon name="pending" size={16} color="violetText" />
              <View style={{ flex: 1 }}>
                <AppText variant="label">{item.title}</AppText>
                <AppText variant="caption" color="textMuted">
                  {item.detail}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name={allowed ? 'check' : 'shield'} color={allowed ? 'primary' : 'textMuted'} size={20} />
          <AppText variant="bodyStrong" style={{ flex: 1 }}>
            {allowed ? 'Autorizaste el análisis con IA' : 'Aún no autorizas el análisis con IA'}
          </AppText>
        </View>
        <AppText variant="caption" color="textMuted">
          Solo se enviarán totales y promedios calculados; nunca tu nombre, tu correo ni las descripciones de tus
          movimientos. Puedes cambiarlo cuando quieras.
        </AppText>
        <Button title="Revisar permisos" variant="secondary" onPress={() => router.push('/profile')} />
      </Card>
    </Screen>
  );
}
