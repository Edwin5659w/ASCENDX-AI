import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { FadeIn, PressableScale } from '@/components/motion';
import { MentorMark } from '@/components/brand/MentorMark';
import { AppText, Button, Card, Chip, ChipGroup, errorMessage, GradientCard, GradientFill, Icon, LoadingView, MENTOR_GRADIENT, ACTION_GRADIENT, OnGradient, Screen, type IconName } from '@/components/ui';
import { updateConsents } from '@/features/account/api';
import {
  clearConversations,
  getAiStatus,
  requestPlan,
  requestSummary,
  sendChat,
  type AnalysisResult,
  type AppFunction,
  type ChatMessage,
  type DataUsed,
  type Verification,
} from '@/features/assistant/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { getGoals } from '@/features/finance/api';
import { formatCop } from '@/lib/format';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

type Mode = 'diagnostico' | 'plan' | 'chat';

const FUNCTION_LINKS: Record<NonNullable<AppFunction>, { label: string; href: Href }> = {
  simulador: { label: 'Abrir el simulador', href: '/simulator' },
  metas: { label: 'Ver mis metas', href: '/goals' },
  movimientos: { label: 'Ver mis movimientos', href: '/movements' },
  deudas: { label: 'Ver mis deudas', href: '/debts' },
  perfil: { label: 'Ir a mi perfil', href: '/profile' },
};

const QUICK_QUESTIONS = ['¿Cómo voy este mes?', '¿En qué gasto más?', '¿Mi meta está en riesgo?', '¿Me conviene financiar una compra?'];

/**
 * Mentor ASCENDX AI (sección 15.6, RF-23 a RF-26). Cada respuesta muestra el
 * resumen, los datos usados, la recomendación, los pasos, las alternativas y
 * los supuestos, y avisa si las cifras pasaron la verificación.
 */
export default function AssistantScreen() {
  const { user, setUser } = useAuth();
  const { spacing } = useTheme();
  const status = useQuery(user ? 'assistant:status' : null, getAiStatus);
  const [mode, setMode] = useState<Mode>('diagnostico');
  const [granting, setGranting] = useState(false);
  const allowed = user?.consents.ia.granted ?? false;

  async function grant() {
    setGranting(true);
    try {
      const { user: updated } = await updateConsents({ ia: true });
      setUser(updated);
      status.refetch();
    } finally {
      setGranting(false);
    }
  }

  return (
    <Screen scroll animateIn={false}>
      <GradientCard tone="violet">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <MentorMark size={56} animate />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <OnGradient variant="caption" soft>
              Asistente
            </OnGradient>
            <OnGradient variant="title" style={{ fontSize: 24, lineHeight: 29 }}>
              Tu mentor ASCENDX AI
            </OnGradient>
          </View>
        </View>
        <OnGradient soft>Te explica tu situación con las cifras que calculó la app. Nunca inventa números.</OnGradient>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Pill icon="check" label="Cifras verificadas" />
          <Pill icon="shield" label="Solo ve totales" />
          {status.data && !status.data.external ? <Pill icon="settings" label="Modo reglas" /> : null}
        </View>
      </GradientCard>

      {!allowed ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name="shield" color="violetText" />
            <AppText variant="heading" style={{ flex: 1 }}>
              Autoriza el análisis con IA
            </AppText>
          </View>
          <AppText color="textMuted">
            Solo se envían totales y promedios calculados: nunca tu nombre, tu correo ni las descripciones de tus movimientos.
            Puedes revocarlo cuando quieras en tu perfil.
          </AppText>
          <Button title="Autorizar y continuar" onPress={grant} loading={granting} />
        </Card>
      ) : (
        <>
          <AppText variant="heading" style={{ fontSize: 18, marginTop: spacing.xs }} accessibilityRole="header">
            ¿En qué te ayudo?
          </AppText>
          <View accessibilityRole="radiogroup" accessibilityLabel="Tipo de ayuda" style={{ flexDirection: 'row', gap: spacing.md }}>
            <ModeTile icon="chart" title="Diagnóstico" detail="Tu mes" selected={mode === 'diagnostico'} onPress={() => setMode('diagnostico')} />
            <ModeTile icon="goals" title="Plan" detail="Para tu meta" selected={mode === 'plan'} onPress={() => setMode('plan')} />
            <ModeTile icon="sparkle" title="Preguntar" detail="Chat conmigo" selected={mode === 'chat'} onPress={() => setMode('chat')} />
          </View>
          {mode === 'diagnostico' ? <Analysis kind="diagnostico" remaining={remaining(status.data?.limits.analysis)} /> : null}
          {mode === 'plan' ? <Analysis kind="plan" remaining={remaining(status.data?.limits.analysis)} /> : null}
          {mode === 'chat' ? <Chat remaining={remaining(status.data?.limits.chat)} /> : null}
        </>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xs }}>
        <Icon name="info" color="textSubtle" size={16} />
        <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
          Orientación educativa: no es asesoría financiera profesional, no promete rendimientos ni garantiza créditos.
          {status.data && !status.data.external ? ' Modo sin IA externa: las explicaciones se arman con reglas a partir de tus cifras.' : ''}
        </AppText>
      </View>
    </Screen>
  );
}

function Pill({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' }}>
      <Icon name={icon} size={13} tint="#FFFFFF" />
      <OnGradient variant="caption" style={{ fontSize: 12 }}>
        {label}
      </OnGradient>
    </View>
  );
}

/** Opción de ayuda como tarjeta independiente, con ícono, nombre y para qué sirve. */
function ModeTile({ icon, title, detail, selected, onPress }: { icon: IconName; title: string; detail: string; selected: boolean; onPress: () => void }) {
  const { colors, isDark, elevate } = useTheme();
  const [from, to] = MENTOR_GRADIENT[isDark ? 'dark' : 'light'];
  return (
    <PressableScale
      scaleTo={0.94}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}: ${detail}`}
      onPress={onPress}
      containerStyle={{ flex: 1 }}
      style={[
        { height: 128, padding: 12, gap: 10, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: selected ? 'transparent' : colors.border, backgroundColor: colors.surface },
        selected ? [elevate('high'), { shadowColor: from, shadowOpacity: 0.4 }] : null,
      ]}
    >
      {selected ? <GradientFill from={from} to={to} radius={22} /> : null}
      <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? 'rgba(255,255,255,0.18)' : colors.violetSoft }}>
        <Icon name={icon} size={21} tint={selected ? '#FFFFFF' : colors.violetText} />
      </View>
      <View style={{ gap: 2 }}>
        <AppText variant="label" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: selected ? '#FFFFFF' : colors.text, fontSize: 13.5 }}>
          {title}
        </AppText>
        <AppText variant="caption" style={{ color: selected ? 'rgba(255,255,255,0.8)' : colors.textMuted, fontSize: 12 }} numberOfLines={1}>
          {detail}
        </AppText>
      </View>
    </PressableScale>
  );
}

function remaining(bucket?: { used: number; limit: number }) {
  return bucket ? Math.max(0, bucket.limit - bucket.used) : null;
}

function Analysis({ kind, remaining: left }: { kind: 'diagnostico' | 'plan'; remaining: number | null }) {
  const { spacing } = useTheme();
  const goals = useQuery(kind === 'plan' ? 'goals' : null, getGoals);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = (goals.data?.goals ?? []).filter((g) => g.status === 'activa');

  async function run() {
    setLoading(true);
    setError(null);
    try {
      setResult(kind === 'diagnostico' ? await requestSummary() : await requestPlan(goalId));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ gap: spacing.lg }}>
      {kind === 'plan' && active.length ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="label" color="textMuted">
            ¿Para qué meta?
          </AppText>
          <ChipGroup>
            <Chip label="La más urgente" selected={!goalId} onPress={() => setGoalId(null)} />
            {active.map((goal) => (
              <Chip key={goal.id} label={goal.name} selected={goalId === goal.id} onPress={() => setGoalId(goal.id)} />
            ))}
          </ChipGroup>
        </View>
      ) : null}
      <Button title={kind === 'diagnostico' ? 'Analizar mi situación' : 'Proponer un plan'} onPress={run} loading={loading} disabled={left === 0} />
      {left !== null ? (
        <AppText variant="caption" color="textMuted" align="center">
          {left === 0 ? 'Llegaste al límite de análisis por hoy.' : `Te quedan ${left} ${left === 1 ? 'análisis' : 'análisis'} hoy.`}
        </AppText>
      ) : null}
      {loading ? <LoadingView label="Revisando tus cifras…" /> : null}
      {error ? <AppText color="danger">{error}</AppText> : null}
      {result ? (
        <FadeIn>
          <AnswerView result={result} title={kind === 'diagnostico' ? 'Tu situación' : 'Tu plan'} />
        </FadeIn>
      ) : null}
    </View>
  );
}

function AnswerView({ result, title }: { result: AnalysisResult; title: string }) {
  const { colors, spacing } = useTheme();
  const { answer } = result;
  return (
    <View style={{ gap: spacing.lg }}>
      <Card elevated>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.violetSoft }}>
            <MentorMark size={28} />
          </View>
          <AppText variant="heading" style={{ flex: 1, fontSize: 18 }}>
            {title}
          </AppText>
        </View>
        <AppText style={{ lineHeight: 25 }}>{answer.resumen}</AppText>
        <VerificationBadge verification={result.verification} source={result.source} />
      </Card>

      <GradientCard tone="brand">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="lightbulb" size={18} tint="#FFFFFF" />
          <OnGradient variant="label" soft>
            Recomendación principal
          </OnGradient>
        </View>
        <OnGradient variant="heading" style={{ fontSize: 19, lineHeight: 26 }}>
          {answer.recomendacion}
        </OnGradient>
      </GradientCard>

      <DataUsedList items={result.dataUsed} />
      <Section icon="check" title="Pasos concretos" items={answer.pasos} numbered />
      <Section icon="compare" title="Alternativas" items={answer.alternativas} />
      <Section icon="info" title="Supuestos y límites" items={answer.supuestos} muted />
    </View>
  );
}

function Section({ icon, title, items, numbered, muted }: { icon: IconName; title: string; items: string[]; numbered?: boolean; muted?: boolean }) {
  const { colors, spacing } = useTheme();
  if (!items.length) return null;
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Icon name={icon} size={18} color={muted ? 'textMuted' : 'violetText'} />
        <AppText variant="label" color={muted ? 'textMuted' : 'text'}>
          {title}
        </AppText>
      </View>
      {items.map((item, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
          {numbered ? (
            <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.violetSoft }}>
              <AppText variant="label" color="violetText" style={{ fontSize: 13 }}>
                {index + 1}
              </AppText>
            </View>
          ) : (
            <View style={{ width: 7, height: 7, borderRadius: 4, marginTop: 9, backgroundColor: muted ? colors.textSubtle : colors.violet }} />
          )}
          <AppText variant={muted ? 'caption' : 'body'} color={muted ? 'textMuted' : 'text'} style={{ flex: 1 }}>
            {item}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

function DataUsedList({ items }: { items: DataUsed[] }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" color="textMuted" style={{ paddingHorizontal: spacing.xs }}>
        Datos que usó (calculados por la app)
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {items.map((item) => (
          <View key={item.label} style={{ width: '47%', flexGrow: 1, paddingHorizontal: spacing.md, paddingVertical: 12, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <AppText variant="caption" color="textMuted">
              {item.label}
            </AppText>
            <AppText variant="label">{item.kind === 'money' ? formatCop(item.value) : `${String(item.value).replace('.', ',')} %`}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function VerificationBadge({ verification, source }: { verification?: Verification; source?: string }) {
  const { spacing } = useTheme();
  if (!verification) return null;
  const text = verification.fallback
    ? 'La IA propuso cifras que no están en tus datos; te mostramos la explicación con reglas.'
    : verification.ok
      ? `${verification.checked} ${verification.checked === 1 ? 'cifra verificada' : 'cifras verificadas'} con tus datos${source === 'reglas' ? ' · explicación con reglas' : ' · generado con IA'}.`
      : 'Algunas cifras no se pudieron verificar.';
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
      <Icon name={verification.ok ? 'check' : 'warning'} size={16} color={verification.ok ? 'success' : 'warning'} />
      <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

function Chat({ remaining: initialRemaining }: { remaining: number | null }) {
  const { colors, isDark, spacing } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const remainingNow = left ?? initialRemaining;

  async function send(question = text) {
    const message = question.trim();
    if (message.length < 2) return;
    setSending(true);
    setError(null);
    setMessages((current) => [...current, { id: `local-${Date.now()}`, role: 'user', content: message, createdAt: new Date().toISOString() }]);
    setText('');
    try {
      const result = await sendChat(message, conversationId);
      setConversationId(result.conversationId);
      setMessages((current) => [...current, result.message]);
      setLeft(result.remaining);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function clear() {
    await clearConversations();
    setMessages([]);
    setConversationId(null);
  }

  const [from, to] = ACTION_GRADIENT[isDark ? 'dark' : 'light'];
  return (
    <View style={{ gap: spacing.md }}>
      {messages.length === 0 ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <MentorMark size={36} />
            <AppText style={{ flex: 1 }}>¡Hola! Pregúntame sobre tus gastos, tus metas o un crédito. Te respondo con tus propias cifras.</AppText>
          </View>
          <AppText variant="label" color="textMuted">
            Prueba con:
          </AppText>
          <View style={{ gap: spacing.sm }}>
            {QUICK_QUESTIONS.map((question) => (
              <PressableScale
                key={question}
                accessibilityRole="button"
                accessibilityLabel={question}
                onPress={() => send(question)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 14, borderRadius: 16, backgroundColor: pressed ? colors.violetSoft : colors.surfaceAlt })}
              >
                <Icon name="sparkle" size={16} color="violetText" />
                <AppText variant="label" style={{ flex: 1 }}>
                  {question}
                </AppText>
                <Icon name="chevronRight" size={16} color="textSubtle" />
              </PressableScale>
            ))}
          </View>
        </Card>
      ) : null}
      {messages.map((message) => {
        const mine = message.role === 'user';
        const link = message.meta?.funcion ? FUNCTION_LINKS[message.meta.funcion] : null;
        return (
          <FadeIn key={message.id}>
            <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: spacing.sm }}>
              {!mine ? (
                <View style={{ width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.violetSoft }}>
                  <MentorMark size={24} />
                </View>
              ) : null}
              <View
                accessibilityLabel={`${mine ? 'Tú' : 'Mentor'}: ${message.content}`}
                style={{
                  maxWidth: '82%',
                  gap: spacing.sm,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 22,
                  borderBottomRightRadius: mine ? 6 : 22,
                  borderBottomLeftRadius: mine ? 22 : 6,
                  overflow: 'hidden',
                  backgroundColor: mine ? 'transparent' : colors.surface,
                  borderWidth: mine ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                {mine ? <GradientFill from={from} to={to} /> : null}
                <AppText style={{ color: mine ? colors.onPrimary : colors.text }}>{message.content}</AppText>
                {!mine ? <VerificationBadge verification={message.meta?.verification} source={message.meta?.source} /> : null}
                {link ? <Button title={link.label} variant="secondary" onPress={() => router.push(link.href)} /> : null}
              </View>
            </View>
          </FadeIn>
        );
      })}
      {sending ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: 40 }}>
          <AppText variant="caption" color="violetText">
            El mentor está revisando tus cifras…
          </AppText>
        </View>
      ) : null}
      {error ? <AppText color="danger">{error}</AppText> : null}

      {/* Barra para escribir */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 6, paddingLeft: 18, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        <TextInput
          accessibilityLabel="Tu pregunta"
          value={text}
          onChangeText={setText}
          placeholder="Escribe tu pregunta…"
          placeholderTextColor={colors.textSubtle}
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => send()}
          style={{ flex: 1, minHeight: 44, color: colors.text, fontSize: 16 }}
        />
        <PressableScale
          scaleTo={0.9}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          disabled={sending || remainingNow === 0 || text.trim().length < 2}
          onPress={() => send()}
          style={{ width: 46, height: 46, borderRadius: 23, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', opacity: text.trim().length < 2 ? 0.5 : 1 }}
        >
          <GradientFill from={from} to={to} />
          <Icon name="send" size={20} color="onPrimary" />
        </PressableScale>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xs }}>
        <AppText variant="caption" color="textMuted">
          {remainingNow === null ? '' : remainingNow === 0 ? 'Llegaste al límite de mensajes por hoy.' : `Te quedan ${remainingNow} mensajes hoy.`}
        </AppText>
        {messages.length ? <Button title="Borrar historial" variant="ghost" onPress={clear} /> : null}
      </View>
    </View>
  );
}
