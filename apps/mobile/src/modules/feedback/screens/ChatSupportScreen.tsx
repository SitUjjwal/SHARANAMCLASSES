/**
 * ChatSupportScreen — student ↔ admin chat with poll, unread clear, typing placeholder.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { ChatBubble } from '@/modules/feedback/components/ChatBubble';
import { TypingIndicator } from '@/modules/feedback/components/TypingIndicator';
import {
  fetchSupportChat,
  markSupportChatRead,
  sendSupportChatMessage,
} from '@/modules/feedback/services/chatSupportService';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';
import type { SupportChatMessage } from '@sharanam/shared';

type Props = NativeStackScreenProps<AppStackParamList, 'ChatSupport'>;

const POLL_MS = 3500;

export function ChatSupportScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const listRef = useRef<FlatList<SupportChatMessage>>(null);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [adminTyping, setAdminTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null);
    try {
      const thread = await fetchSupportChat();
      setMessages(thread.messages);
      setAdminTyping(thread.conversation.admin_typing);
      await markSupportChatRead();
    } catch (err) {
      if (!opts?.silent) {
        setError(getApiErrorMessage(err, 'Could not load chat'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
      const id = setInterval(() => {
        void load({ silent: true });
      }, POLL_MS);
      return () => clearInterval(id);
    }, [load]),
  );

  useEffect(() => {
    if (messages.length) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length, adminTyping]);

  async function onSend() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      const msg = await sendSupportChatMessage(body);
      setMessages((prev) => [...prev, msg]);
      setDraft('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send message'));
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen>
      <LoadingOverlay visible={loading} message="Loading chat…" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>Chat support</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Message our team. Replies appear here with your conversation history.
        </Text>

        {error && !loading ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : null}

        {!loading ? (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState
                icon="chatbubble-ellipses-outline"
                title="Start a conversation"
                message="Describe your issue and our team will reply here."
              />
            }
            ListFooterComponent={<TypingIndicator visible={adminTyping} />}
            renderItem={({ item }) => (
              <ChatBubble
                message={{
                  id: item.id,
                  body: item.body,
                  from_support: item.from_support,
                  created_at: item.created_at,
                }}
              />
            )}
          />
        ) : (
          <View style={styles.flex} />
        )}

        <View style={[styles.composer, { borderTopColor: theme.cardBorder }]}>
          <AppTextField
            label="Message"
            value={draft}
            onChangeText={setDraft}
            placeholder="Type your message…"
            multiline
          />
          <AppButton label="Send" onPress={() => void onSend()} loading={sending} />
          <AppButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  composer: {
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
});
