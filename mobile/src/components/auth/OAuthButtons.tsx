import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { theme } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

interface OAuthButtonsProps {
  referralCode?: string;
  onGoogleSuccess: (idToken: string) => Promise<void>;
  onAppleSuccess: (identityToken: string, fullName?: string) => Promise<void>;
  onError: (message: string) => void;
}

export function OAuthButtons({ referralCode, onGoogleSuccess, onAppleSuccess, onError }: OAuthButtonsProps) {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const hasGoogle = !!(webClientId || iosClientId || androidClientId);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId,
    iosClientId,
    androidClientId,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.authentication?.idToken ?? response.params?.id_token;
    if (!idToken) {
      onError('No se recibió token de Google');
      return;
    }
    void onGoogleSuccess(idToken).catch((e) =>
      onError(e instanceof Error ? e.message : 'Error con Google'),
    );
  }, [response, onGoogleSuccess, onError]);

  const signInApple = async () => {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!cred.identityToken) {
        onError('Token de Apple inválido');
        return;
      }
      const fullName = cred.fullName
        ? [cred.fullName.givenName, cred.fullName.familyName].filter(Boolean).join(' ')
        : undefined;
      await onAppleSuccess(cred.identityToken, fullName);
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      onError(e instanceof Error ? e.message : 'Error con Apple');
    }
  };

  if (!hasGoogle && Platform.OS !== 'ios') return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>o continúa con</Text>
        <View style={styles.line} />
      </View>
      {hasGoogle ? (
        <Pressable
          style={[styles.btn, !request && styles.btnDisabled]}
          disabled={!request}
          onPress={() => void promptAsync()}>
          <Text style={styles.btnText}>Continuar con Google</Text>
        </Pressable>
      ) : null}
      {Platform.OS === 'ios' ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={styles.appleBtn}
          onPress={() => void signInApple()}
        />
      ) : null}
      {referralCode ? <Text style={styles.refHint}>Referido: {referralCode}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: theme.spacing.md, gap: 10 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  line: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.textMuted, fontSize: 12 },
  btn: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: theme.colors.text, fontWeight: '600' },
  appleBtn: { width: '100%', height: 48 },
  refHint: { color: theme.colors.textMuted, fontSize: 11, textAlign: 'center' },
});
