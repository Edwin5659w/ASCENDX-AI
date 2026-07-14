import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

const ACCENTS = ['#7c3aed', '#c026d3', '#00a3ff', '#059669', '#d97706', '#e11d48'] as const;

function initialsFromName(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function accentFromName(name?: string | null): string {
  const s = name ?? 'user';
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

interface ProfileAvatarProps {
  name?: string | null;
  size?: number;
}

export function ProfileAvatar({ name, size = 88 }: ProfileAvatarProps) {
  const initials = initialsFromName(name);
  const bg = accentFromName(name);
  const fontSize = Math.round(size * 0.34);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg + '33',
          borderColor: bg,
        },
      ]}>
      <Text style={[styles.initials, { fontSize, color: bg }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  initials: {
    fontWeight: '800',
    letterSpacing: 1,
  },
});
