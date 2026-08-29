/**
 * Folder explorer header: back · truncated title · search (matches batch screenshots).
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { folderTheme } from '@/modules/folders/theme';
import { spacing, typography } from '@/theme';

type Props = {
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  onBack: () => void;
};

export function FolderBrowserHeader({
  title,
  search,
  onSearchChange,
  onBack,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);

  function toggleSearch() {
    if (searchOpen) {
      onSearchChange('');
    }
    setSearchOpen((open) => !open);
  }

  return (
    <View style={styles.wrap}>
      <StatusBar style="light" />
      <View style={styles.row}>
        <Pressable
          onPress={onBack}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={folderTheme.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Pressable
          onPress={toggleSearch}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={searchOpen ? 'Close search' : 'Search'}
        >
          <Ionicons
            name={searchOpen ? 'close' : 'search'}
            size={20}
            color={folderTheme.text}
          />
        </Pressable>
      </View>
      {searchOpen ? (
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search"
          placeholderTextColor={folderTheme.textMuted}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.search}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: folderTheme.text,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  search: {
    height: 42,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    color: folderTheme.text,
    backgroundColor: folderTheme.searchBg,
    borderWidth: 1,
    borderColor: folderTheme.border,
    fontSize: typography.fontSize.md,
  },
});
