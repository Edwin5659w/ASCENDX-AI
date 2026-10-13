import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AppText, Button, TextField } from '@/components/ui';
import { requestPasswordReset } from '@/features/account/api';
import { AuthShell, FormError } from '@/features/auth/AuthShell';
import { ApiError } from '@/lib/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** RF-03, paso 1: pedir el código de 6 dígitos al correo. */
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Escribe el correo con el que creaste tu cuenta');
      return;
    }
    setError(null);
    setFormError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      router.replace({ pathname: '/reset-password', params: { email: email.trim() } });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo enviar el código.');
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Recupera tu contraseña"
      subtitle="Te enviaremos un código de 6 dígitos a tu correo. Vence en 15 minutos."
    >
      <TextField
        label="Correo electrónico"
        icon="mail"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError(null);
        }}
        placeholder="nombre@correo.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
        error={error ?? undefined}
      />
      {formError ? <FormError message={formError} /> : null}
      <Button title="Enviar código" onPress={handleSubmit} loading={loading} />
      <AppText variant="caption" color="textSubtle" align="center">
        Por seguridad, la respuesta es la misma exista o no una cuenta con ese correo.
      </AppText>
    </AuthShell>
  );
}
