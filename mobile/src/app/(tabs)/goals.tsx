import { AppText, ComingSoon, Screen } from '@/components/ui';

export default function GoalsScreen() {
  return (
    <Screen scroll>
      <AppText variant="title">Metas</AppText>
      <ComingSoon
        icon="goals"
        title="Varias metas al mismo tiempo"
        description="Moto, computador, viaje o fondo de emergencia: cada una con su propio plan."
        features={[
          'Valor objetivo, fecha deseada y ahorro inicial',
          'Aportes y porcentaje de avance',
          'Proyección de la fecha en que la alcanzarías',
          'Aviso cuando una meta no encaja con tu capacidad de ahorro',
        ]}
      />
    </Screen>
  );
}
