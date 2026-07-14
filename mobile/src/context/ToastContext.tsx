import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Text } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      position: 'absolute' as const,
      top: 52,
      left: 16,
      right: 16,
      zIndex: 9999,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: 14,
      borderLeftWidth: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    text: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<ToastType>('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accent =
    type === 'success'
      ? theme.colors.success
      : type === 'error'
        ? theme.colors.danger
        : theme.colors.primary;

  const showToast = useCallback(
    (msg: string, t: ToastType = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(msg);
      setType(t);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2600),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMessage(null));
      timer.current = setTimeout(() => setMessage(null), 3200);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <Animated.View style={[styles.wrap, { opacity, borderLeftColor: accent }]}>
          <Text style={styles.text} numberOfLines={3}>
            {message}
          </Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast requiere ToastProvider');
  return ctx;
}
