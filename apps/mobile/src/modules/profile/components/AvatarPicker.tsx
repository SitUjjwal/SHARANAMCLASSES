/**
 * AvatarPicker — tap photo to choose a new profile image (local preview).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { ProfilePhoto } from '@/modules/profile/components/ProfilePhoto';
import { colors, spacing, typography } from '@/theme';

type Props = {
  name: string;
  /** Remote URL already saved on the profile */
  remoteUrl?: string | null;
  /** Local file URI after picking (takes preview priority) */
  localUri?: string | null;
  onPicked: (uri: string, mimeType: string) => void;
  disabled?: boolean;
};

export function AvatarPicker({
  name,
  remoteUrl,
  localUri,
  onPicked,
  disabled,
}: Props) {
  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mime =
      asset.mimeType && asset.mimeType.startsWith('image/')
        ? asset.mimeType
        : 'image/jpeg';

    if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') {
      return;
    }

    onPicked(asset.uri, mime);
  }

  const preview = localUri || remoteUrl || null;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => {
          void pickImage();
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Change profile photo"
        style={({ pressed }) => [styles.press, pressed ? styles.pressed : null]}
      >
        <ProfilePhoto name={name} avatarUrl={preview} size={104} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Change photo</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  press: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(201,162,39,0.2)',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  badgeText: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
});
