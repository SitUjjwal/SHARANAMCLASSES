/**
 * BannerSlider — reusable, API-driven promo carousel.
 *
 * Architecture
 * ------------
 * 1) Data layer (outside this file)
 *    - GET /banners or GET /dashboard.banners → Banner[]
 *    - Admin CRUD: POST/PATCH/DELETE /admin/banners (image, redirect_url, status, sort_order)
 *
 * 2) This component (presentation + interaction only)
 *    - Receives `banners` props (API-driven; no hardcoded slides)
 *    - FlatList + paging for swipe
 *    - Auto-scroll timer (pauses while user is dragging)
 *    - Pagination dots (tap a dot to jump)
 *    - Press → opens `redirect_url` (or custom onBannerPress)
 *    - expo-image for disk/memory caching + placeholders
 *
 * 3) Empty / edge cases
 *    - 0 banners → EmptyState (admin has not published yet)
 *    - 1 banner → no auto-scroll / dots still optional
 *
 * Why separate from HomeScreen?
 * - Same slider can be reused on Courses / promotions later without copying UI.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import { Image } from 'expo-image';

import type { Banner } from '@sharanam/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { openBannerRedirect } from '@/modules/banners/openBannerRedirect';
import { colors, spacing, typography } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DEFAULT_GAP = spacing.sm;

export type BannerSliderProps = {
  banners: Banner[];
  /** Auto-advance interval in ms (default 4000). Set 0 to disable. */
  autoPlayIntervalMs?: number;
  /** Card height (default 160) */
  height?: number;
  /** Horizontal inset used when computing card width (default theme lg * 2) */
  horizontalInset?: number;
  /** Called when a banner is tapped (before default link open) */
  onBannerPress?: (banner: Banner) => void;
};

export function BannerSlider({
  banners,
  autoPlayIntervalMs = 4000,
  height = 160,
  horizontalInset = spacing.lg * 2,
  onBannerPress,
}: BannerSliderProps) {
  const cardWidth = SCREEN_WIDTH - horizontalInset;
  const interval = cardWidth + DEFAULT_GAP;

  const listRef = useRef<FlatList<Banner>>(null);
  const indexRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [index, setIndex] = useState(0);

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index == null) {
        return;
      }
      indexRef.current = first.index;
      setIndex(first.index);
    },
  ).current;

  const scrollToIndex = useCallback(
    (next: number, animated = true) => {
      if (!banners.length) {
        return;
      }
      const clamped = ((next % banners.length) + banners.length) % banners.length;
      listRef.current?.scrollToOffset({
        offset: clamped * interval,
        animated,
      });
      indexRef.current = clamped;
      setIndex(clamped);
    },
    [banners.length, interval],
  );

  // Auto scroll — pauses while dragging; disabled for 0/1 slides or interval=0
  useEffect(() => {
    if (banners.length < 2 || autoPlayIntervalMs <= 0) {
      return;
    }

    const timer = setInterval(() => {
      if (isDraggingRef.current) {
        return;
      }
      scrollToIndex(indexRef.current + 1);
    }, autoPlayIntervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [autoPlayIntervalMs, banners.length, scrollToIndex]);

  async function handlePress(banner: Banner) {
    if (onBannerPress) {
      onBannerPress(banner);
      return;
    }
    await openBannerRedirect(banner);
  }

  function onScrollBeginDrag() {
    isDraggingRef.current = true;
  }

  function onScrollEndDrag(_event: NativeSyntheticEvent<NativeScrollEvent>) {
    isDraggingRef.current = false;
  }

  if (!banners.length) {
    return (
      <EmptyState
        icon="images-outline"
        title="No banners yet"
        message="Promotional banners will show here once an admin publishes them."
      />
    );
  }

  return (
    <View>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={interval}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={styles.list}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onScrollEndDrag}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_data, i) => ({
          length: interval,
          offset: interval * i,
          index: i,
        })}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => {
              void handlePress(item);
            }}
            style={[styles.card, { width: cardWidth, height }]}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={item.id}
              transition={200}
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
            <View style={styles.overlay}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />

      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((banner, i) => (
            <Pressable
              key={banner.id}
              accessibilityRole="button"
              accessibilityLabel={`Go to banner ${i + 1}`}
              onPress={() => scrollToIndex(i)}
              hitSlop={8}
            >
              <View style={[styles.dot, i === index ? styles.dotActive : null]} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: DEFAULT_GAP,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
    backgroundColor: 'rgba(8,18,32,0.45)',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: '#D7DEE8',
    fontSize: typography.fontSize.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 18,
  },
});
