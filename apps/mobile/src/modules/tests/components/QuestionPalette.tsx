/**
 * QuestionPalette — numbered jump grid for every question.
 *
 * Colors:
 *   current  → accent ring
 *   marked   → warning/amber fill
 *   answered → success tint
 *   blank    → muted outline
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AnswerMap } from '@/modules/tests/utils/answers';
import { colors, spacing, typography } from '@/theme';

type Props = {
  total: number;
  currentIndex: number;
  answers: AnswerMap;
  questionIds: string[];
  onJump: (index: number) => void;
};

export function QuestionPalette({
  total,
  currentIndex,
  answers,
  questionIds,
  onJump,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Question palette</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {Array.from({ length: total }, (_, index) => {
            const id = questionIds[index];
            const draft = id ? answers[id] : undefined;
            const answered = draft?.selected_answer != null;
            const marked = Boolean(draft?.is_marked_for_review);
            const current = index === currentIndex;

            return (
              <Pressable
                key={id ?? index}
                accessibilityRole="button"
                accessibilityLabel={`Question ${index + 1}`}
                onPress={() => onJump(index)}
                style={[
                  styles.cell,
                  answered ? styles.answered : null,
                  marked ? styles.marked : null,
                  current ? styles.current : null,
                ]}
              >
                <Text
                  style={[
                    styles.cellText,
                    answered || marked || current ? styles.cellTextEmphasis : null,
                  ]}
                >
                  {index + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.legend}>
        <LegendDot color={colors.accent} label="Current" />
        <LegendDot color={colors.success} label="Answered" />
        <LegendDot color="#E6A817" label="Review" />
        <LegendDot color="rgba(255,255,255,0.25)" label="Blank" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  title: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    maxWidth: 360,
  },
  cell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  answered: {
    backgroundColor: 'rgba(46,125,50,0.35)',
    borderColor: colors.success,
  },
  marked: {
    backgroundColor: 'rgba(230,168,23,0.35)',
    borderColor: '#E6A817',
  },
  current: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  cellText: {
    color: '#A8B3C5',
    fontWeight: '700',
    fontSize: typography.fontSize.sm,
  },
  cellTextEmphasis: {
    color: colors.surface,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
  },
});
