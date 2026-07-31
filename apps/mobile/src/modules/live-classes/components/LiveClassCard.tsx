/**
 * LiveClassCard — LIVE NOW with Join, or upcoming countdown.
 */
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  formatCountdown,
  formatStartTime,
} from '@/modules/live-classes/utils/formatLiveTime';
import { colors, spacing, typography } from '@/theme';
import type { LiveClassPublic } from '@sharanam/shared';

type LiveClassCardProps = {
  liveClass: LiveClassPublic;
  onJoin: (liveClass: LiveClassPublic) => void;
};

export function LiveClassCard({ liveClass, onJoin }: LiveClassCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (liveClass.status !== 'upcoming') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [liveClass.status, liveClass.id]);

  const teacher =
    liveClass.teacher_name?.trim() || 'SHARANAM Faculty';
  const startsLabel = formatStartTime(liveClass.start_time);
  const remaining = Date.parse(liveClass.start_time) - now;
  const isLive =
    liveClass.status === 'live' ||
    (liveClass.status !== 'ended' && remaining <= 0 && Date.parse(liveClass.end_time) >= now);
  const isUpcoming = liveClass.status === 'upcoming' && remaining > 0;
  const isEnded = !isLive && !isUpcoming;

  return (
    <View style={[styles.card, isLive ? styles.cardLive : null]}>
      {liveClass.thumbnail_url ? (
        <Image source={{ uri: liveClass.thumbnail_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <Ionicons name="videocam" size={28} color={colors.accent} />
        </View>
      )}

      <View style={styles.body}>
        {isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE NOW</Text>
          </View>
        ) : null}

        {isEnded ? (
          <Text style={styles.endedBadge}>ENDED</Text>
        ) : null}

        <Text style={styles.title}>{liveClass.title}</Text>
        <Text style={styles.teacher}>By {teacher}</Text>

        {isLive ? (
          <>
            <Text style={styles.meta}>Starts: {startsLabel}</Text>
            <Pressable
              style={({ pressed }) => [styles.joinBtn, pressed ? styles.joinPressed : null]}
              onPress={() => onJoin(liveClass)}
              disabled={!liveClass.youtube_url}
            >
              <Ionicons name="play" size={18} color={colors.primary} />
              <Text style={styles.joinLabel}>Join Live</Text>
            </Pressable>
          </>
        ) : null}

        {isUpcoming ? (
          <View style={styles.countdownBlock}>
            <Text style={styles.countdownLabel}>Starts in</Text>
            <Text style={styles.countdown}>{formatCountdown(remaining)}</Text>
            <Text style={styles.meta}>Starts: {startsLabel}</Text>
          </View>
        ) : null}

        {isEnded ? (
          <Text style={styles.meta}>Ended · {startsLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardLive: {
    borderColor: 'rgba(198,40,40,0.55)',
    backgroundColor: 'rgba(198,40,40,0.12)',
  },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
  },
  liveBadgeText: {
    color: '#FF8A80',
    fontSize: typography.fontSize.sm,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  endedBadge: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
  },
  teacher: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
  },
  meta: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  joinBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
  },
  joinPressed: {
    opacity: 0.88,
  },
  joinLabel: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: '800',
  },
  countdownBlock: {
    marginTop: spacing.sm,
    gap: 2,
  },
  countdownLabel: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  countdown: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
});
