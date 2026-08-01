/**
 * App drawer sidebar — profile header, menu rows, Follow us socials.
 */
import { Alert, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME, SOCIAL_LINKS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/hooks/useAuthMutations';
import { colors, spacing, typography } from '@/theme';

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

const SOCIALS: {
  key: keyof typeof SOCIAL_LINKS;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { key: 'facebook', icon: 'logo-facebook', color: '#1877F2' },
  { key: 'instagram', icon: 'logo-instagram', color: '#E4405F' },
  { key: 'telegram', icon: 'paper-plane', color: '#229ED9' },
  { key: 'youtube', icon: 'logo-youtube', color: '#FF0000' },
  { key: 'whatsapp', icon: 'logo-whatsapp', color: '#25D366' },
  { key: 'phone', icon: 'call', color: '#0B1F3A' },
];

export function AppDrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const logoutMutation = useLogoutMutation();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email?.split('@')[0] ||
    'Student';

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'SC';

  function goTab(screen: 'HomeTab' | 'LiveTab' | 'ProfileTab' | 'MyLearningTab' | 'TestsTab') {
    navigation.navigate('Tabs', { screen });
    navigation.closeDrawer();
  }

  function goStack(screen: 'PurchaseHistory' | 'Leaderboard' | 'TestAnalytics') {
    navigation.closeDrawer();
    const parent = navigation.getParent();
    parent?.navigate(screen);
  }

  async function openUrl(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open link');
    }
  }

  async function onShare() {
    try {
      await Share.share({
        message: `Learn with ${APP_NAME} — courses, tests, and live classes.`,
      });
    } catch {
      // user cancelled
    }
  }

  function onRate() {
    Alert.alert('Rate App', 'Store listing link will open here once the app is published.');
  }

  function onTutorial() {
    Alert.alert('App Tutorial', 'Tutorial video / walkthrough coming soon.');
  }

  function onRefer() {
    Alert.alert('Refer & Earn', 'Referral rewards will be available soon.');
  }

  function onLogout() {
    navigation.closeDrawer();
    logoutMutation.mutate();
  }

  const items: MenuItem[] = [
    {
      key: 'home',
      label: 'Home',
      icon: 'home-outline',
      onPress: () => goTab('HomeTab'),
    },
    {
      key: 'purchases',
      label: 'Purchases',
      icon: 'wallet-outline',
      onPress: () => goStack('PurchaseHistory'),
    },
    {
      key: 'tutorial',
      label: 'App Tutorial',
      icon: 'play-circle-outline',
      onPress: onTutorial,
    },
    {
      key: 'live',
      label: 'Live',
      icon: 'calendar-outline',
      onPress: () => goTab('LiveTab'),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: 'settings-outline',
      onPress: () => goTab('ProfileTab'),
    },
    {
      key: 'refer',
      label: 'Refer & Earn',
      icon: 'gift-outline',
      onPress: onRefer,
    },
    {
      key: 'rate',
      label: 'Rate',
      icon: 'star-outline',
      onPress: onRate,
    },
    {
      key: 'share',
      label: 'Share',
      icon: 'share-social-outline',
      onPress: () => {
        void onShare();
      },
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: 'log-out-outline',
      onPress: onLogout,
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.brand} numberOfLines={1}>
            {APP_NAME}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      </View>

      <View style={styles.menu}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={item.onPress}
            style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
          >
            <Ionicons name={item.icon} size={22} color="#4A5568" />
            <Text style={styles.rowLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.follow}>Follow us</Text>
        <View style={styles.socialCol}>
          {SOCIALS.map((social) => (
            <Pressable
              key={social.key}
              accessibilityRole="button"
              accessibilityLabel={social.key}
              onPress={() => {
                void openUrl(SOCIAL_LINKS[social.key]);
              }}
              style={styles.socialBtn}
            >
              <Ionicons name={social.icon} size={20} color={social.color} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: typography.fontSize.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  brand: {
    color: '#6B7280',
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  name: {
    color: '#111827',
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
  },
  menu: {
    flex: 1,
    paddingTop: spacing.md,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  rowPressed: {
    backgroundColor: '#F3F4F6',
  },
  rowLabel: {
    color: '#1F2937',
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    gap: spacing.sm,
  },
  follow: {
    color: '#6B7280',
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  socialCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
});
