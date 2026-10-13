import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { AppText, Button, TextField } from '@/components/ui';
import { requestPasswordReset, resetPassword } from '@/features/account/api';
import { AuthShell, FormError, FormNotice } from '@/features/auth/AuthShell';
import { isPasswordValid, PasswordStrength } from '@/features/auth/PasswordStrength';
import { ApiError } from '@/lib/api';

/**
 * RF-03, paso 2: código de 6 dígitos + nueva contraseña.
 * El código sirve una sola vez y permite 5 intentos; al cambiar la
 * contraseña se cierran todas las sesiones abiertas.
 */
export default function ResetPasswordScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ code?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(`Si ${email} tiene una cuenta, te enviamos el código.`);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    const localErrors: typeof errors = {};
    if (!/^\d{6}$/.test(code)) localErrors.code = 'Escribe los 6 dígitos del código';
    if (!isPasswordValid(password)) localErrors.password = 'La contraseña aún no cumple los requisitos';
    setErrors(localErrors);
    setFormError(null);
    if (Object.keys(localErrors).length > 0) return;

    setLoading(true);
    try {
      await resetPassword({ email, code, newPassword: password });
      setDone(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setFormError(null);
    try {
      await requestPasswordReset(email);
      setNotice('Te enviamos un código nuevo. El anterior ya no sirve.');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo reenviar el código.');
    }
  }

  if (done) {
    return (
      <AuthShell title="Contraseña actualizada" subtitle="Por seguridad cerramos las sesiones abiertas en otros dispositivos.">
        <Button title="Iniciar sesión" onPress={() => router.replace('/login')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Escribe el código" subtitle="Revisa tu correo, incluida la carpeta de spam.">
      {notice ? <FormNotice message={notice} /> : null}
      <TextField
        label="Código de 6 dígitos"
        icon="key"
        value={code}
        onChangeText={(text) => {
          setCode(text.replace(/\D/g, '').slice(0, 6));
          setErrors((e) => ({ ...e, code: undefined }));
        }}
        placeholder="000000"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        error={errors.code}
        style={{ letterSpacing: 6 }}
      />
      <TextField
        label="Nueva contraseña"
        icon="lock"
        revealable
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setErrors((e) => ({ ...e, password: undefined }));
        }}
        placeholder="Crea una contraseña"
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        error={errors.password}
      />
      <PasswordStrength value={password} />
      {formError ? <FormError message={formError} /> : null}
      <Button title="Cambiar contraseña" onPress={handleSubmit} loading={loading} />
      <Pressable accessibilityRole="button" onPress={resend} hitSlop={8} style={{ alignSelf: 'center', minHeight: 40, justifyContent: 'center' }}>
        <AppText variant="label" color="primary">
          Reenviar código
        </AppText>
      </Pressable>
    </AuthShell>
  );
}
