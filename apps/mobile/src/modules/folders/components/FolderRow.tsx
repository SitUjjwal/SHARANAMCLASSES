/**
 * Folder / content row — cyan glow card with circular icon (folder, video, PDF, test).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { folderTheme } from '@/modules/folders/theme';
import { spacing, typography } from '@/theme';

export type FolderRowKind = 'folder' | 'video' | 'pdf' | 'test';

type Props = {
  kind: FolderRowKind;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

function RowIcon({ kind }: { kind: FolderRowKind }) {
  if (kind === 'video') {
    return (
      <View style={styles.iconRing}>
        <View style={styles.playInner}>
          <Ionicons name="play" size={16} color="#FFFFFF" style={styles.playNudge} />
        </View>
      </View>
    );
  }
  if (kind === 'pdf') {
    return (
      <View style={styles.iconRing}>
        <Ionicons name="document-text" size={22} color={folderTheme.folderIcon} />
      </View>
    );
  }
  if (kind === 'test') {
    return (
      <View style={styles.iconRing}>
        <Ionicons name="clipboard" size={22} color={folderTheme.folderIcon} />
      </View>
    );
  }
  return (
    <View style={styles.iconRing}>
      <Ionicons name="folder" size={22} color={folderTheme.folderIcon} />
    </View>
  );
}

export function FolderRow({ kind, title, subtitle, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <RowIcon kind={kind} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: folderTheme.border,
    backgroundColor: folderTheme.card,
  },
  pressed: {
    opacity: 0.88,
  },
  iconRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: folderTheme.iconRing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: folderTheme.play,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playNudge: {
    marginLeft: 2,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: folderTheme.text,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  subtitle: {
    color: folderTheme.textMuted,
    fontSize: typography.fontSize.sm,
  },
});
