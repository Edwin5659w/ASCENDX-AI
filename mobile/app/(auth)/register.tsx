import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AuthScreenShell } from '@/src/components/brand/AuthScreenShell';
import { formatApiError } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/Button';
import { ValidatedInput } from '@/src/components/auth/ValidatedInput';
import { PasswordStrength } from '@/src/components/auth/PasswordStrength';
import {
  validateEmail,
  validateFullName,
  validatePassword,
} from '@/src/lib/auth.rules';
import { theme } from '@/constants/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const nameVal = useMemo(() => validateFullName(name, touched.name), [name, touched.name]);
  const emailVal = useMemo(() => validateEmail(email, touched.email), [email, touched.email]);
  const passwordVal = useMemo(
    () => validatePassword(password, touched.password),
    [password, touched.password],
  );

  const isFormValid =
    nameVal.status === 'valid' && emailVal.status === 'valid' && passwordVal.status === 'valid';

  const handleRegister = async () => {
    setTouched({ name: true, email: true, password: true });
    setSubmitError('');
    if (!isFormValid) return;

    setLoading(true);
    try {
      await register(name.trim().replace(/\s+/g, ' '), email.trim().toLowerCase(), password);
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
  error: { color: theme.colors.danger, marginBottom: theme.spacing.sm, textAlign: 'center' },
  link: { color: theme.colors.textMuted, textAlign: 'center', fontSize: 15 },
  linkBold: { color: theme.colors.accent, fontWeight: '600' },
});
