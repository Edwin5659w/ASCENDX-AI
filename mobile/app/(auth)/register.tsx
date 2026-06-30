import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { AuthScreenShell } from '@/src/components/brand/AuthScreenShell';
import { formatApiError } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { Button } from '@/src/components/ui/Button';
import { ValidatedInput } from '@/src/components/auth/ValidatedInput';
import { PasswordStrength } from '@/src/components/auth/PasswordStrength';
import { RETENTION_MESSAGES } from '../../../shared/retention';
import {
  validateEmail,
  validateFullName,
  validatePassword,
} from '@/src/lib/auth.rules';
import { theme } from '@/constants/theme';
import { setPendingProCheckout } from '@/src/lib/pending-pro-checkout';

const WEB_ORIGIN = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://ascendx.ai';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useLocalSearchParams<{ ref?: string; plan?: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(
    typeof params.ref === 'string' ? params.ref.toUpperCase() : '',
  );
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const wantsPro = params.plan === 'pro';

  const nameVal = useMemo(() => validateFullName(name, touched.name), [name, touched.name]);
  const emailVal = useMemo(() => validateEmail(email, touched.email), [email, touched.email]);
  const passwordVal = useMemo(
    () => validatePassword(password, touched.password),
    [password, touched.password],
  );

  const isFormValid =
    nameVal.status === 'valid' &&
    emailVal.status === 'valid' &&
    passwordVal.status === 'valid' &&
    acceptedTerms;

  const handleRegister = async () => {
    setTouched({ name: true, email: true, password: true });
    setSubmitError('');
    if (!isFormValid) return;

    setLoading(true);
    try {
      const referralBonus = await register(
        name.trim().replace(/\s+/g, ' '),
        email.trim().toLowerCase(),
        password,
        referralCode.trim() || undefined,
      );
      if (referralBonus > 0) {
        showToast(RETENTION_MESSAGES.referralBonus(referralBonus), 'success');
      }
      if (wantsPro) await setPendingProCheckout();
      router.replace('/(onboarding)');
    } catch (e) {
      setSubmitError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      title="Crear cuenta"
      subtitle="Nombre completo, correo y contraseña segura">
          <View style={styles.form}>
            <ValidatedInput
              label="Nombre completo"
              placeholder="Juan Pérez"
              value={name}
              onChangeText={setName}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              validation={nameVal}
              autoCapitalize="words"
              autoComplete="name"
            />
            <ValidatedInput
              label="Correo electrónico"
              placeholder="nombre@gmail.com"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              validation={emailVal}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <ValidatedInput
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              validation={passwordVal}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.showBtn}>
              <Text style={styles.showBtnText}>{showPassword ? 'Ocultar' : 'Mostrar'} contraseña</Text>
            </Pressable>
            <PasswordStrength
              checks={passwordVal.checks}
              strength={passwordVal.strength}
              visible={touched.password || password.length > 0}
            />
            <Text style={styles.refLabel}>Código de referido (opcional)</Text>
            <TextInput
              value={referralCode}
              onChangeText={(t) => setReferralCode(t.toUpperCase())}
              placeholder="Ej: JUAN1A2B"
              placeholderTextColor={theme.colors.textMuted}
              maxLength={12}
              autoCapitalize="characters"
              style={styles.refInput}
            />
            <Text style={styles.refHint}>+50 XP para ti y quien te invitó</Text>
            <Pressable onPress={() => setAcceptedTerms(!acceptedTerms)} style={styles.termsRow}>
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxOn]} />
              <Text style={styles.termsText}>
                Acepto los Términos y la Política de privacidad. Tengo al menos 16 años.
              </Text>
            </Pressable>
            <View style={styles.legalLinks}>
              <Pressable onPress={() => void Linking.openURL(`${WEB_ORIGIN}/terms`)}>
                <Text style={styles.legalLink}>Términos</Text>
              </Pressable>
              <Text style={styles.legalSep}>·</Text>
              <Pressable onPress={() => void Linking.openURL(`${WEB_ORIGIN}/privacy`)}>
                <Text style={styles.legalLink}>Privacidad</Text>
              </Pressable>
            </View>
            {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
            <Button
              title="Crear cuenta"
              onPress={handleRegister}
              loading={loading}
              disabled={!isFormValid}
            />
          </View>

          <Link href="/(auth)/login" asChild>
            <Text style={styles.link}>
              ¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text>
            </Text>
          </Link>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  form: { marginBottom: theme.spacing.lg },
  showBtn: { marginTop: -8, marginBottom: theme.spacing.sm },
  showBtnText: { color: theme.colors.primaryLight, fontSize: 13, textAlign: 'right' },
  refLabel: { color: theme.colors.textMuted, fontSize: 13, marginTop: theme.spacing.sm, marginBottom: 6 },
  refInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 15,
    letterSpacing: 1,
  },
  refHint: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4, marginBottom: theme.spacing.sm },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  termsText: { flex: 1, color: theme.colors.textMuted, fontSize: 12, lineHeight: 17 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: theme.spacing.sm },
  legalLink: { color: theme.colors.primaryLight, fontSize: 12 },
  legalSep: { color: theme.colors.textMuted, fontSize: 12 },
  error: { color: theme.colors.danger, marginBottom: theme.spacing.sm, textAlign: 'center' },
  link: { color: theme.colors.textMuted, textAlign: 'center', fontSize: 15 },
  linkBold: { color: theme.colors.accent, fontWeight: '600' },
});
