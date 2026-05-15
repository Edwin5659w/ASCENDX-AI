import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/Button';
import { ValidatedInput } from '@/src/components/auth/ValidatedInput';
import { PasswordStrength } from '@/src/components/auth/PasswordStrength';
import {
  validateEmail,
  validateFullName,
  validatePassword,
} from '../../../../shared/validators/auth.rules';
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
      setSubmitError(e instanceof Error ? e.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0a0f', '#1a1033', '#0a0a0f']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Nombre completo, correo y contraseña segura</Text>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg },
  logo: { fontSize: 32, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  subtitle: { color: theme.colors.textMuted, textAlign: 'center', marginBottom: 32, fontSize: 15 },
  form: { marginBottom: theme.spacing.lg },
  showBtn: { marginTop: -8, marginBottom: theme.spacing.sm },
  showBtnText: { color: theme.colors.primaryLight, fontSize: 13, textAlign: 'right' },
  error: { color: theme.colors.danger, marginBottom: theme.spacing.sm, textAlign: 'center' },
  link: { color: theme.colors.textMuted, textAlign: 'center', fontSize: 15 },
  linkBold: { color: theme.colors.primaryLight, fontWeight: '600' },
});
