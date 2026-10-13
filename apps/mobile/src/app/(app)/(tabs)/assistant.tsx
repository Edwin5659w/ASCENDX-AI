import { router } from 'expo-router';
import { AppText, Button, ComingSoon, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';

/** Fase 4 (sprints 9–10): RF-23 a RF-26. Requiere el permiso de IA (RF-06). */
export default function AssistantScreen() {
  const { user } = useAuth();
  const allowed = user?.consents.ia.granted ?? false;
  return (
    <Screen scroll>
      <AppText variant="title" accessibilityRole="header">
        Asistente
      </AppText>
      <ComingSoon
        icon="assistant"
        title="Explicaciones con tus propias cifras"
        description="La IA solo explica lo que la app ya calculó; nunca inventa cifras ni te recomienda endeudarte. Se construye en la fase 4."
        features={[
          'Resumen del mes explicado en lenguaje sencillo (RF-23)',
          'Plan de acción con 3 a 5 pasos concretos (RF-24)',
          'Chat sobre tus finanzas con límite diario (RF-25)',
          'Borrar tu historial cuando quieras (RF-26)',
        ]}
      />
      {!allowed ? (
        <>
          <AppText variant="caption" color="textMuted" align="center">
            Aún no has autorizado el análisis con IA. Puedes hacerlo desde tu perfil.
          </AppText>
          <Button title="Revisar permisos" variant="secondary" onPress={() => router.push('/profile')} />
        </>
      ) : null}
    </Screen>
  );
}
