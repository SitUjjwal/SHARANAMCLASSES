/**
 * CourseSearchBar — drives server-side `search` on the list query.
 */
import { StyleSheet, View } from 'react-native';

import { AppTextField } from '@/components/ui/AppTextField';
import { spacing } from '@/theme';

export type CourseSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function CourseSearchBar({ value, onChangeText }: CourseSearchBarProps) {
  return (
    <View style={styles.wrap}>
      <AppTextField
        label="Search"
        placeholder="Search courses or teachers…"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
  },
});
