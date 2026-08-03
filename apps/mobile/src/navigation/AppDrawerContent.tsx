/**
 * App drawer — modern sidebar: hero header, grouped menu, social footer.
 * Social links come from Admin → System Settings (public platform config).
 */
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME, SOCIAL_LINKS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/hooks/useAuthMutations';
import { usePublicPlatformQuery } from '@/modules/platform/hooks/usePublicPlatformQuery';
import { ProfilePhoto } from '@/modules/profile/components/ProfilePhoto';
import { useProfileQuery } from '@/modules/profile/hooks/useProfileQuery';
import { useAppTheme } from '@/theme/ThemeProvider';
import { openExternalUrl } from '@/utils/openExternal';
import { colors, spacing, typography } from '@/theme';

type MenuItem = {
  key: string;
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  onPress: () => void;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type SocialKey = 'facebook' | 'instagram' | 'telegram' | 'youtube' | 'whatsapp' | 'phone';

const SOCIAL_META: {
  key: SocialKey;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { key: 'facebook', icon: 'logo-facebook', color: '#1877F2' },
  { key: 'instagram', icon: 'logo-instagram', color: '#E4405F' },
  { key: 'telegram', icon: 'paper-plane', color: '#229ED9' },
  { key: 'youtube', icon: 'logo-youtube', color: '#FF0000' },
  { key: 'whatsapp', icon: 'logo-whatsapp', color: '#25D366' },
  { key: 'phone', icon: 'call', color: colors.accent },
];

function toTelUrl(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  if (/^tel:/i.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
}

export function AppDrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const isDark = theme.canvas === '#0B1F3A';
  const { user } = useAuth();
  const logoutMutation = useLogoutMutation();
  const profileQuery = useProfileQuery();
  const platformQuery = usePublicPlatformQuery();
  const platform = platformQuery.data;
  const platformReady = platformQuery.isSuccess;
  const profile = profileQuery.data;

  const displayName =
    profile?.full_name?.trim() ||
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email?.split('@')[0] ||
    'Student';

  const brandName = platform?.app_name?.trim() || APP_NAME;

  // Once settings load, empty admin values hide the icon. Before load / on error, use fallbacks.
  const socialUrls: Record<SocialKey, string> = platformReady
    ? {
        facebook: platform?.social_facebook?.trim() || '',
        instagram: platform?.social_instagram?.trim() || '',
        telegram: platform?.social_telegram?.trim() || '',
        youtube: platform?.social_youtube?.trim() || '',
        whatsapp: platform?.social_whatsapp?.trim() || '',
        phone: toTelUrl(platform?.support_phone ?? ''),
      }
    : {
        facebook: SOCIAL_LINKS.facebook,
        instagram: SOCIAL_LINKS.instagram,
        telegram: SOCIAL_LINKS.telegram,
        youtube: SOCIAL_LINKS.youtube,
        whatsapp: SOCIAL_LINKS.whatsapp,
        phone: SOCIAL_LINKS.phone,
      };

  const visibleSocials = SOCIAL_META.filter((s) => Boolean(socialUrls[s.key]));

  function goTab(screen: 'HomeTab' | 'LiveTab' | 'ProfileTab' | 'MyLearningTab' | 'TestsTab') {
    navigation.navigate('Tabs', { screen });
    navigation.closeDrawer();
  }

  function goStack(
    screen:
      | 'PurchaseHistory'
      | 'Leaderboard'
      | 'TestAnalytics'
      | 'NotificationCenter'
      | 'Settings'
      | 'Feedback'
      | 'AppReview',
  ) {
    navigation.closeDrawer();
    const parent = navigation.getParent();
    parent?.navigate(screen);
  }

  async function openUrl(url: string) {
    await openExternalUrl(url);
  }

  async function onShare() {
    try {
      await Share.share({
        message: `Learn with ${brandName} — courses, tests, and live classes.`,
      });
    } catch {
      // user cancelled
    }
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

  const sections: MenuSection[] = [
    {
      title: 'Explore',
      items: [
        {
          key: 'home',
          label: 'Home',
          icon: 'home-outline',
          onPress: () => goTab('HomeTab'),
        },
        {
          key: 'live',
          label: 'Live',
          subtitle: 'Upcoming classes',
          icon: 'videocam-outline',
          onPress: () => goTab('LiveTab'),
        },
        {
          key: 'notifications',
          label: 'Notifications',
          icon: 'notifications-outline',
          onPress: () => goStack('NotificationCenter'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          key: 'purchases',
          label: 'Purchases',
          icon: 'wallet-outline',
          onPress: () => goStack('PurchaseHistory'),
        },
        {
          key: 'settings',
          label: 'Settings',
          icon: 'settings-outline',
          onPress: () => goStack('Settings'),
        },
        {
          key: 'refer',
          label: 'Refer & Earn',
          icon: 'gift-outline',
          onPress: onRefer,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          key: 'tutorial',
          label: 'App Tutorial',
          icon: 'play-circle-outline',
          onPress: onTutorial,
        },
        {
          key: 'rate',
          label: 'Rate',
          icon: 'star-outline',
          onPress: () => goStack('AppReview'),
        },
        {
          key: 'feedback',
          label: 'Feedback & Support',
          icon: 'chatbubbles-outline',
          onPress: () => goStack('Feedback'),
        },
        {
          key: 'share',
          label: 'Share app',
          icon: 'share-social-outline',
          onPress: () => {
            void onShare();
          },
        },
        {
          key: 'logout',
          label: 'Logout',
          icon: 'log-out-outline',
          danger: true,
          onPress: onLogout,
        },
      ],
    },
  ];

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.canvas,
          paddingTop: insets.top + 10,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View
        style={[
          styles.hero,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <View style={styles.heroGlow} pointerEvents="none">
          <View style={[styles.heroOrb, { backgroundColor: colors.accent }]} />
        </View>

        <View style={styles.avatarRing}>
          <View style={[styles.avatarInner, { backgroundColor: theme.canvas }]}>
            <ProfilePhoto
              name={displayName}
              avatarUrl={profile?.avatar_url}
              size={48}
            />
          </View>
        </View>

        <View style={styles.headerText}>
          <Text style={[styles.brand, { color: colors.accent }]} numberOfLines={1}>
            {brandName}
          </Text>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => goTab('ProfileTab')}
            style={({ pressed }) => [
              styles.profileChip,
              {
                backgroundColor: isDark ? 'rgba(201,162,39,0.16)' : 'rgba(201,162,39,0.12)',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={styles.profileChipText}>View profile</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.accent} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              {section.title}
            </Text>
            {section.items.map((item) => {
              const iconColor = item.danger ? theme.danger : colors.accent;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                      opacity: pressed ? 0.88 : 1,
                      transform: [{ scale: pressed ? 0.985 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: item.danger
                          ? 'rgba(242,139,130,0.16)'
                          : isDark
                            ? 'rgba(201,162,39,0.16)'
                            : 'rgba(201,162,39,0.12)',
                      },
                    ]}
                  >
                    <Ionicons name={item.icon} size={18} color={iconColor} />
                  </View>
                  <View style={styles.rowText}>
                    <Text
                      style={[
                        styles.rowLabel,
                        { color: item.danger ? theme.danger : theme.textPrimary },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle ? (
                      <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        ))}

        {visibleSocials.length > 0 ? (
          <View style={styles.footer}>
            <Text style={[styles.follow, { color: theme.textSecondary }]}>Follow us</Text>
            <View style={styles.socialRow}>
              {visibleSocials.map((social) => (
                <Pressable
                  key={social.key}
                  accessibilityRole="button"
                  accessibilityLabel={social.key}
                  onPress={() => {
                    void openUrl(socialUrls[social.key]);
                  }}
                  style={({ pressed }) => [
                    styles.socialBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(11,31,58,0.05)',
                      borderColor: theme.cardBorder,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons name={social.icon} size={18} color={social.color} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOrb: {
    position: 'absolute',
    top: -36,
    left: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.14,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: 'rgba(201,162,39,0.2)',
  },
  avatarInner: {
    padding: 2,
    borderRadius: 24,
    overflow: 'hidden',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  brand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  profileChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  profileChipText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  rowLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  rowSubtitle: {
    fontSize: 12,
  },
  footer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  follow: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
