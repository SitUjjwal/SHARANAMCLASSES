/**
 * PdfViewerHeader — back, title, download action.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '@/theme';

type PdfViewerHeaderProps = {
  title: string;
  subtitle?: string;
  cached?: boolean;
  downloading?: boolean;
  onBack: () => void;
  onDownload: () => void;
};

export function PdfViewerHeader({
  title,
  subtitle,
  cached = false,
  downloading = false,
  onBack,
  onDownload,
}: PdfViewerHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} style={styles.iconBtn} accessibilityLabel="Go back">
        <Ionicons name="chevron-back" size={22} color={colors.surface} />
      </Pressable>

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
            {cached ? ' · Cached offline' : ''}
          </Text>
        ) : cached ? (
          <Text style={styles.subtitle}>Cached offline</Text>
        ) : null}
      </View>

      <Pressable
        onPress={onDownload}
        style={styles.iconBtn}
        disabled={downloading}
        accessibilityLabel="Download PDF"
      >
        {downloading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Ionicons name="download-outline" size={22} color={colors.accent} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
});
