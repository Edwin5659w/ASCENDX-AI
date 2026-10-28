import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import type { Palette } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * Íconos de la app. En Android se usan Material Symbols; se incluye el
 * equivalente de iOS (SF Symbols) para no romper si algún día se compila allí.
 */
const ICONS = {
  home: { android: 'home', ios: 'house.fill', web: 'home' },
  movements: { android: 'receipt_long', ios: 'list.bullet.rectangle', web: 'receipt_long' },
  goals: { android: 'flag', ios: 'flag.fill', web: 'flag' },
  simulator: { android: 'calculate', ios: 'function', web: 'calculate' },
  profile: { android: 'person', ios: 'person.crop.circle', web: 'person' },
  check: { android: 'check_circle', ios: 'checkmark.circle.fill', web: 'check_circle' },
  pending: { android: 'radio_button_unchecked', ios: 'circle', web: 'radio_button_unchecked' },
  warning: { android: 'warning', ios: 'exclamationmark.triangle.fill', web: 'warning' },
  info: { android: 'info', ios: 'info.circle', web: 'info' },
  sparkle: { android: 'auto_awesome', ios: 'sparkles', web: 'auto_awesome' },
  shield: { android: 'shield', ios: 'lock.shield', web: 'shield' },
  trending: { android: 'trending_up', ios: 'chart.line.uptrend.xyaxis', web: 'trending_up' },
  logout: { android: 'logout', ios: 'rectangle.portrait.and.arrow.right', web: 'logout' },
  mail: { android: 'mail', ios: 'envelope', web: 'mail' },
  lock: { android: 'lock', ios: 'lock', web: 'lock' },
  person: { android: 'person', ios: 'person', web: 'person' },
  eye: { android: 'visibility', ios: 'eye', web: 'visibility' },
  eyeOff: { android: 'visibility_off', ios: 'eye.slash', web: 'visibility_off' },
  back: { android: 'arrow_back', ios: 'chevron.left', web: 'arrow_back' },
  checkSmall: { android: 'check', ios: 'checkmark', web: 'check' },
  error: { android: 'error', ios: 'exclamationmark.circle', web: 'error' },
  add: { android: 'add', ios: 'plus', web: 'add' },
  assistant: { android: 'auto_awesome', ios: 'sparkles', web: 'auto_awesome' },
  chevronRight: { android: 'chevron_right', ios: 'chevron.right', web: 'chevron_right' },
  settings: { android: 'settings', ios: 'gearshape', web: 'settings' },
  savings: { android: 'savings', ios: 'banknote', web: 'savings' },
  debt: { android: 'credit_card', ios: 'creditcard', web: 'credit_card' },
  calendar: { android: 'event', ios: 'calendar', web: 'event' },
  trash: { android: 'delete', ios: 'trash', web: 'delete' },
  close: { android: 'close', ios: 'xmark', web: 'close' },
  key: { android: 'key', ios: 'key', web: 'key' },
  wallet: { android: 'account_balance_wallet', ios: 'wallet.pass', web: 'account_balance_wallet' },
  camera: { android: 'document_scanner', ios: 'doc.viewfinder', web: 'document_scanner' },
  edit: { android: 'edit', ios: 'pencil', web: 'edit' },
  document: { android: 'description', ios: 'doc.text', web: 'description' },
  sun: { android: 'light_mode', ios: 'sun.max.fill', web: 'light_mode' },
  moon: { android: 'dark_mode', ios: 'moon.fill', web: 'dark_mode' },
  phone: { android: 'smartphone', ios: 'iphone', web: 'smartphone' },
  search: { android: 'search', ios: 'magnifyingglass', web: 'search' },
  category: { android: 'category', ios: 'square.grid.2x2', web: 'category' },
  chart: { android: 'bar_chart', ios: 'chart.bar', web: 'bar_chart' },
  income: { android: 'south_west', ios: 'arrow.down.left', web: 'south_west' },
  expense: { android: 'north_east', ios: 'arrow.up.right', web: 'north_east' },
  pause: { android: 'pause_circle', ios: 'pause.circle', web: 'pause_circle' },
  play: { android: 'play_circle', ios: 'play.circle', web: 'play_circle' },
  refresh: { android: 'refresh', ios: 'arrow.clockwise', web: 'refresh' },
  offline: { android: 'cloud_off', ios: 'icloud.slash', web: 'cloud_off' },
  sync: { android: 'sync', ios: 'arrow.triangle.2.circlepath', web: 'sync' },
  repeat: { android: 'event_repeat', ios: 'repeat', web: 'event_repeat' },
  bell: { android: 'notifications', ios: 'bell', web: 'notifications' },
  trophy: { android: 'emoji_events', ios: 'trophy', web: 'emoji_events' },
  bank: { android: 'account_balance', ios: 'building.columns', web: 'account_balance' },
  send: { android: 'send', ios: 'paperplane.fill', web: 'send' },
  history: { android: 'history', ios: 'clock.arrow.circlepath', web: 'history' },
  compare: { android: 'compare_arrows', ios: 'arrow.left.arrow.right', web: 'compare_arrows' },
  bookmark: { android: 'bookmark', ios: 'bookmark', web: 'bookmark' },
  flame: { android: 'local_fire_department', ios: 'flame', web: 'local_fire_department' },
  lightbulb: { android: 'lightbulb', ios: 'lightbulb', web: 'lightbulb' },
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: keyof Palette;
  /** Color directo (p. ej. el que entrega la barra de pestañas) */
  tint?: ColorValue;
}

export function Icon({ name, size = 22, color = 'text', tint }: IconProps) {
  const { colors } = useTheme();
  return (
    <SymbolView
      name={ICONS[name] as ComponentProps<typeof SymbolView>['name']}
      size={size}
      tintColor={tint ?? colors[color]}
    />
  );
}
