import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { theme } from '@/constants/theme';

export function LoadMoreFooter({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 16, alignItems: 'center' },
});
