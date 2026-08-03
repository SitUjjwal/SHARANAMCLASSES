/**
 * PurchaseHistoryRow — modern payment card with status chip + receipt CTA.
 */
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PurchaseHistoryItem } from '@sharanam/shared';

import { downloadReceiptFile } from '@/modules/payments/utils/downloadReceipt';
import { fetchPurchaseReceipt } from '@/services/payment.service';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { colors, spacing, typography } from '@/theme';

type Props = {
  item: PurchaseHistoryItem;
};

function statusLabel(status: PurchaseHistoryItem['status']): string {
  if (status === 'paid') return 'Paid';
  if (status === 'failed') return 'Failed';
  if (status === 'expired') return 'Expired';
  return 'Pending';
}

function statusTone(status: PurchaseHistoryItem['status']): {
  bg: string;
  fg: string;
} {
  if (status === 'paid') return { bg: 'rgba(129,199,132,0.18)', fg: '#81C784' };
  if (status === 'failed') return { bg: 'rgba(229,115,115,0.18)', fg: '#E57373' };
  if (status === 'expired') return { bg: 'rgba(255,183,77,0.18)', fg: '#FFB74D' };
  return { bg: 'rgba(168,179,197,0.16)', fg: '#A8B3C5' };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function PurchaseHistoryRow({ item }: Props) {
  const theme = useAppTheme();
  const isDark = theme.canvas === '#0B1F3A';
  const [downloading, setDownloading] = useState(false);
  const tone = statusTone(item.status);
  const title = item.title?.trim() || item.course_title?.trim() || 'Course purchase';
  const canDownload = item.status === 'paid' || Boolean(item.payment_id);

  async function onDownloadReceipt() {
    setDownloading(true);
    try {
      const receipt = await fetchPurchaseReceipt(item.payment_id ?? item.order_id);
      await downloadReceiptFile(receipt.filename, receipt.receipt_text);
    } catch (error) {
      Alert.alert('Receipt', getApiErrorMessage(error, 'Could not download receipt.'));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />

      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: isDark ? 'rgba(201,162,39,0.16)' : 'rgba(201,162,39,0.12)',
            },
          ]}
        >
          <Ionicons name="wallet-outline" size={18} color={colors.accent} />
        </View>

        <View style={styles.titleCol}>
          <Text style={[styles.course, { color: theme.textPrimary }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {formatDate(item.date)}
            {item.receipt_number ? ` · #${item.receipt_number}` : ''}
          </Text>
        </View>

        <View style={[styles.statusChip, { backgroundColor: tone.bg }]}>
          <Text style={[styles.statusText, { color: tone.fg }]}>{statusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.amountBlock}>
        <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Amount</Text>
        <Text style={styles.amount}>{item.amount_display}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

      <MetaRow
        label="Payment ID"
        value={item.payment_id ?? '—'}
        mono
        labelColor={theme.textSecondary}
        valueColor={theme.textPrimary}
      />
      <MetaRow
        label="Order"
        value={item.order_id.slice(0, 8) + '…'}
        mono
        labelColor={theme.textSecondary}
        valueColor={theme.textPrimary}
      />

      <Pressable
        style={({ pressed }) => [
          styles.downloadBtn,
          {
            backgroundColor: canDownload ? colors.accent : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(11,31,58,0.06)',
            opacity: pressed || downloading ? 0.85 : 1,
          },
        ]}
        onPress={() => {
          void onDownloadReceipt();
        }}
        disabled={downloading}
        accessibilityRole="button"
        accessibilityLabel="Download Receipt"
      >
        {downloading ? (
          <ActivityIndicator color={canDownload ? colors.primary : theme.textSecondary} />
        ) : (
          <>
            <Ionicons
              name="download-outline"
              size={18}
              color={canDownload ? colors.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.downloadText,
                { color: canDownload ? colors.primary : theme.textSecondary },
              ]}
            >
              Download Receipt
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function MetaRow({
  label,
  value,
  mono,
  labelColor,
  valueColor,
}: {
  label: string;
  value: string;
  mono?: boolean;
  labelColor: string;
  valueColor: string;
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, { color: labelColor }]}>{label}</Text>
      <Text
        style={[styles.metaValue, { color: valueColor }, mono ? styles.mono : null]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    gap: 3,
    paddingTop: 1,
  },
  course: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  amountBlock: {
    marginTop: spacing.xs,
    marginLeft: 52,
    gap: 2,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  amount: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
    marginLeft: 52,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginLeft: 52,
  },
  metaLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  metaValue: {
    flexShrink: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    textAlign: 'right',
  },
  mono: {
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  downloadBtn: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  downloadText: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
  },
});
