import { Pressable, ScrollView, Text } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

function createStyles(theme: AppTheme) {
  return {
    scroll: { marginBottom: 8, maxHeight: 44 },
    chip: {
      marginRight: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.4)',
      backgroundColor: 'rgba(139, 92, 246, 0.12)',
    },
    chipDisabled: { opacity: 0.5 },
    chipText: { color: theme.colors.primaryLight, fontSize: 12 },
  };
}

export function SuggestedPrompts({ prompts, onSelect, disabled }: SuggestedPromptsProps) {
  const styles = useThemedStyles(createStyles);

  if (!prompts.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      {prompts.map((p) => (
        <Pressable
          key={p}
          style={[styles.chip, disabled && styles.chipDisabled]}
          onPress={() => onSelect(p)}
          disabled={disabled}>
          <Text style={styles.chipText}>{p}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
