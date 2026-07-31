/**
 * PurchaseHistoryRow — Course, Amount, Date, Payment ID, Status, Download Receipt.
 */
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PurchaseHistoryItem } from '@sharanam/shared';

import { downloadReceiptFile } from '@/modules/payments/utils/downloadReceipt';
import { fetchPurchaseReceipt } from '@/services/payment.service';
import { getApiErrorMessage } from '@/utils/apiErrors';
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

function statusColor(status: PurchaseHistoryItem['status']): string {
  if (status === 'paid') return '#81C784';
  if (status === 'failed') return '#E57373';
  if (status === 'expired') return '#FFB74D';
  return '#A8B3C5';
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
  const [downloading, setDownloading] = useState(false);

  async function onDownloadReceipt() {
    setDownloading(true);
    try {
      const receipt = await fetchPurchaseReceipt(
        item.payment_id ?? item.order_id,
      );
      await downloadReceiptFile(receipt.filename, receipt.receipt_text);
    } catch (error) {
      Alert.alert('Receipt', getApiErrorMessage(error, 'Could not download receipt.'));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.course} numberOfLines={2}>
        {item.course_title}
      </Text>

      <Row label="Amount" value={item.amount_display} accent />
      <Row label="Date" value={formatDate(item.date)} />
      <Row label="Payment ID" value={item.payment_id ?? '—'} mono />
      <View style={styles.row}>
        <Text style={styles.label}>Status</Text>
        <Text style={[styles.value, { color: statusColor(item.status) }]}>
          {statusLabel(item.status)}
        </Text>
      </View>

      <Pressable
        style={[styles.downloadBtn, downloading && styles.downloadDisabled]}
        onPress={() => {
          void onDownloadReceipt();
        }}
        disabled={downloading}
        accessibilityRole="button"
        accessibilityLabel="Download Receipt"
      >
        <Text style={styles.downloadText}>
          {downloading ? 'Preparing…' : 'Download Receipt'}
        </Text>
      </Pressable>
    </View>
  );
}

function Row({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[styles.value, accent ? styles.amount : null, mono ? styles.mono : null]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  course: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    color: '#7A8799',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  value: {
    flexShrink: 1,
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    textAlign: 'right',
  },
  amount: {
    color: colors.accent,
    fontSize: typography.fontSize.lg,
  },
  mono: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  downloadBtn: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  downloadDisabled: {
    opacity: 0.7,
  },
  downloadText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: '800',
  },
});
