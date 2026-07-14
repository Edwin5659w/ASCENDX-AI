import { useEffect } from 'react';
import { Pressable, Text, View, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { AppTheme } from '@/constants/theme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

WebBrowser.maybeCompleteAuthSession();

interface OAuthButtonsProps {
  referralCode?: string;
  onGoogleSuccess: (idToken: string) => Promise<void>;
  onAppleSuccess: (identityToken: string, fullName?: string) => Promise<void>;
  onError: (message: string) => void;
}

function createStyles(theme: AppTheme) {
  return {
    wrap: { marginTop: theme.spacing.md, gap: 10 },
    dividerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 4 },
    line: { flex: 1, height: 1, backgroundColor: theme.colors.border },
    dividerText: { color: theme.colors.textMuted, fontSize: 12 },
    btn: {
      backgroundColor: theme.colors.surfaceLight,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: theme.colors.text, fontWeight: '600' as const },
    appleBtn: { width: '100%' as const, height: 48 },
    refHint: { color: theme.colors.textMuted, fontSize: 11, textAlign: 'center' as const },
  };
}

function googleConfiguredForPlatform(): boolean {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  if (Platform.OS === 'ios') return !!iosClientId;
  if (Platform.OS === 'android') return !!androidClientId;
  return !!webClientId;
}

/** Solo montar cuando hay client ID de la plataforma; useAuthRequest exige iosClientId en iOS. */
function GoogleSignInButton({
  onGoogleSuccess,
  onError,
}: {
  onGoogleSuccess: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
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

  return (
    <Pressable
      style={[styles.btn, !request && styles.btnDisabled]}
      disabled={!request}
      onPress={() => void promptAsync()}>
      <Text style={styles.btnText}>Continuar con Google</Text>
    </Pressable>
  );
}

export function OAuthButtons({ referralCode, onGoogleSuccess, onAppleSuccess, onError }: OAuthButtonsProps) {
  const styles = useThemedStyles(createStyles);
  const showGoogle = googleConfiguredForPlatform();
  const showApple = Platform.OS === 'ios';

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

  if (!showGoogle && !showApple) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>o continúa con</Text>
        <View style={styles.line} />
      </View>
      {showGoogle ? (
        <GoogleSignInButton onGoogleSuccess={onGoogleSuccess} onError={onError} />
      ) : null}
      {showApple ? (
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
