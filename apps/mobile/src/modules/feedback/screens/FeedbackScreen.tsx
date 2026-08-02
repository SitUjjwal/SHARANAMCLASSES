/**
 * FeedbackScreen — hub for student feedback tickets, reviews, support.
 */
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { Screen } from '@/components/ui/Screen';
import { SettingItem } from '@/modules/profile/components/SettingItem';
import { fetchSupportChatUnreadCount } from '@/modules/feedback/services/chatSupportService';
import type { AppStackParamList } from '@/types/navigation';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Feedback'>;

export function FeedbackScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const [chatUnread, setChatUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void fetchSupportChatUnreadCount()
        .then(setChatUnread)
        .catch(() => setChatUnread(0));
    }, []),
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>Feedback</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Submit tickets, chat with support, and share course reviews.
        </Text>

        <Text style={[styles.section, { color: theme.textSecondary }]}>
          Chat support
        </Text>
        <View style={styles.list}>
          <SettingItem
            label="Chat with us"
            subtitle="Send a message and get admin replies"
            badgeCount={chatUnread}
            onPress={() => navigation.navigate('ChatSupport', {})}
          />
        </View>

        <Text style={[styles.section, { color: theme.textSecondary }]}>
          Student feedback
        </Text>
        <View style={styles.list}>
          <SettingItem
            label="Submit feedback"
            subtitle="General, course, teacher, suggestion, complaint"
            onPress={() => navigation.navigate('SubmitFeedback', {})}
          />
          <SettingItem
            label="My feedback"
            subtitle="Track ticket status"
            onPress={() => navigation.navigate('MyFeedback')}
          />
        </View>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Reviews</Text>
        <View style={styles.list}>
          <SettingItem
            label="Write a review"
            subtitle="Open a course to rate it (1–5 stars)"
            onPress={() => navigation.navigate('AppReview', {})}
          />
        </View>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Support</Text>
        <View style={styles.list}>
          <SettingItem
            label="FAQ"
            onPress={() => navigation.navigate('FAQ')}
          />
          <SettingItem
            label="Contact us"
            onPress={() => navigation.navigate('ContactUs')}
          />
        </View>

        <Text style={[styles.section, { color: theme.textSecondary }]}>
          Content quality
        </Text>
        <View style={styles.list}>
          <SettingItem
            label="Report content"
            subtitle="Incorrect video/PDF, broken link, bad question"
            onPress={() => navigation.navigate('ReportContent', {})}
          />
          <SettingItem
            label="My content reports"
            subtitle="Track investigation status"
            onPress={() => navigation.navigate('MyContentReports')}
          />
        </View>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Shortcuts</Text>
        <View style={styles.list}>
          <SettingItem
            label="Report a bug"
            subtitle="Describe issue, screen, screenshot"
            onPress={() => navigation.navigate('BugReport')}
          />
          <SettingItem
            label="My bug reports"
            subtitle="Track investigation status"
            onPress={() => navigation.navigate('MyBugReports')}
          />
          <SettingItem
            label="Feature request"
            onPress={() =>
              navigation.navigate('SubmitFeedback', { type: 'suggestion' })
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: spacing.sm,
  },
});
