import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { FadeIn } from '@/components/motion';
import { MentorMark } from '@/components/brand/MentorMark';
import { AppText, Button, Card, Chip, ChipGroup, errorMessage, Icon, LoadingView, Screen, SegmentedControl, TextField } from '@/components/ui';
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
      <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm }}>
        <MentorMark size={64} animate />
        <AppText variant="title" align="center" accessibilityRole="header">
          Tu mentor ASCENDX AI
        </AppText>
        <AppText color="textMuted" align="center" style={{ maxWidth: 340 }}>
          Explica tu situación con las cifras que calculó la app. Nunca inventa números.
        </AppText>
      </View>

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
          <SegmentedControl
            accessibilityLabel="Tipo de ayuda"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'diagnostico', label: 'Diagnóstico' },
              { value: 'plan', label: 'Plan' },
              { value: 'chat', label: 'Preguntar' },
            ]}
          />
          {status.data ? <ModeNotice external={status.data.external} /> : null}
          {mode === 'diagnostico' ? <Analysis kind="diagnostico" remaining={remaining(status.data?.limits.analysis)} /> : null}
          {mode === 'plan' ? <Analysis kind="plan" remaining={remaining(status.data?.limits.analysis)} /> : null}
          {mode === 'chat' ? <Chat remaining={remaining(status.data?.limits.chat)} /> : null}
        </>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xs }}>
        <Icon name="info" color="textSubtle" size={16} />
        <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
          Orientación educativa: no es asesoría financiera profesional, no promete rendimientos ni garantiza créditos.
        </AppText>
      </View>
    </Screen>
  );
}

function remaining(bucket?: { used: number; limit: number }) {
  return bucket ? Math.max(0, bucket.limit - bucket.used) : null;
}

function ModeNotice({ external }: { external: boolean }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.violetSoft }}>
      <Icon name={external ? 'sparkle' : 'settings'} color="violetText" size={18} />
      <AppText variant="caption" style={{ flex: 1 }}>
        {external
          ? 'Respuestas con IA. Cada cifra se compara con tus datos antes de mostrarse.'
          : 'Modo sin IA externa: las explicaciones se arman con reglas a partir de tus cifras, sin enviar datos a terceros.'}
      </AppText>
    </View>
  );
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
    <Card elevated>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <MentorMark size={28} />
        <AppText variant="heading" style={{ flex: 1 }}>
          {title}
        </AppText>
      </View>
      <AppText>{answer.resumen}</AppText>
      <DataUsedList items={result.dataUsed} />
      <View style={{ gap: spacing.xs, padding: spacing.md, borderRadius: 12, backgroundColor: colors.primarySoft }}>
        <AppText variant="overline" color="primary">
          Recomendación principal
        </AppText>
        <AppText variant="bodyStrong">{answer.recomendacion}</AppText>
      </View>
      <Section title="Pasos concretos" items={answer.pasos} numbered />
      <Section title="Alternativas" items={answer.alternativas} />
      <Section title="Supuestos y límites" items={answer.supuestos} muted />
      <VerificationBadge verification={result.verification} source={result.source} />
    </Card>
  );
}

function Section({ title, items, numbered, muted }: { title: string; items: string[]; numbered?: boolean; muted?: boolean }) {
  const { spacing } = useTheme();
  if (!items.length) return null;
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="overline" color="textMuted">
        {title}
      </AppText>
      {items.map((item, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <AppText variant="label" color={muted ? 'textMuted' : 'violetText'}>
            {numbered ? `${index + 1}.` : '•'}
          </AppText>
          <AppText variant={muted ? 'caption' : 'body'} color={muted ? 'textMuted' : 'text'} style={{ flex: 1 }}>
            {item}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function DataUsedList({ items }: { items: DataUsed[] }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="overline" color="textMuted">
        Datos usados
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {items.map((item) => (
          <View key={item.label} style={{ paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
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
  const { colors, radius, spacing } = useTheme();
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

  return (
    <View style={{ gap: spacing.md }}>
      {messages.length === 0 ? (
        <ChipGroup>
          {QUICK_QUESTIONS.map((question) => (
            <Chip key={question} label={question} onPress={() => send(question)} />
          ))}
        </ChipGroup>
      ) : null}
      {messages.map((message) => {
        const mine = message.role === 'user';
        const link = message.meta?.funcion ? FUNCTION_LINKS[message.meta.funcion] : null;
        return (
          <FadeIn key={message.id}>
            <View
              accessibilityLabel={`${mine ? 'Tú' : 'Mentor'}: ${message.content}`}
              style={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                gap: spacing.sm,
                padding: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: mine ? colors.primarySoft : colors.surface,
                borderWidth: 1,
                borderColor: mine ? colors.primary : colors.border,
              }}
            >
              <AppText>{message.content}</AppText>
              {!mine ? <VerificationBadge verification={message.meta?.verification} source={message.meta?.source} /> : null}
              {link ? <Button title={link.label} variant="secondary" onPress={() => router.push(link.href)} /> : null}
            </View>
          </FadeIn>
        );
      })}
      {sending ? <LoadingView label="El mentor está revisando tus cifras…" /> : null}
      {error ? <AppText color="danger">{error}</AppText> : null}
      <TextField
        label="Tu pregunta"
        value={text}
        onChangeText={setText}
        placeholder="Ej.: ¿cómo puedo llegar antes a mi meta?"
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={() => send()}
      />
      <Button title="Enviar" onPress={() => send()} loading={sending} disabled={remainingNow === 0} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="caption" color="textMuted">
          {remainingNow === null ? '' : remainingNow === 0 ? 'Llegaste al límite de mensajes por hoy.' : `Te quedan ${remainingNow} mensajes hoy.`}
        </AppText>
        {messages.length ? <Button title="Borrar historial" variant="ghost" onPress={clear} /> : null}
      </View>
    </View>
  );
}
