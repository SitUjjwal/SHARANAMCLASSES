/**
 * ReviewQuestionCard — one reviewed MCQ:
 * question, selected answer, correct answer, explanation.
 * Green when correct; red when wrong; muted when skipped.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import type {
  QuestionCorrectAnswer,
  TestAttemptReviewItem,
} from '@sharanam/shared';

type Props = {
  index: number;
  item: TestAttemptReviewItem;
  onReport?: () => void;
};

function optionText(
  item: TestAttemptReviewItem,
  key: QuestionCorrectAnswer,
): string {
  if (key === 'A') return item.option_a;
  if (key === 'B') return item.option_b;
  if (key === 'C') return item.option_c;
  return item.option_d;
}

function formatAnswer(
  item: TestAttemptReviewItem,
  key: QuestionCorrectAnswer | null,
): string {
  if (!key) return 'Not answered';
  return `${key}. ${optionText(item, key)}`;
}

export function ReviewQuestionCard({ index, item, onReport }: Props) {
  const isCorrect = item.outcome === 'correct';
  const isWrong = item.outcome === 'wrong';
  const isSkipped = item.outcome === 'skipped';

  return (
    <View
      style={[
        styles.card,
        isCorrect ? styles.cardCorrect : null,
        isWrong ? styles.cardWrong : null,
        isSkipped ? styles.cardSkipped : null,
      ]}
      accessibilityLabel={`Question ${index + 1}, ${item.outcome}`}
    >
      <View style={styles.cardTop}>
        <Text style={styles.qIndex}>Question {index + 1}</Text>
        <View
          style={[
            styles.badge,
            isCorrect ? styles.badgeCorrect : null,
            isWrong ? styles.badgeWrong : null,
            isSkipped ? styles.badgeSkipped : null,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isCorrect ? styles.textCorrect : null,
              isWrong ? styles.textWrong : null,
              isSkipped ? styles.textSkipped : null,
            ]}
          >
            {isCorrect ? 'Correct' : isWrong ? 'Wrong' : 'Skipped'}
          </Text>
        </View>
      </View>

      <Text style={styles.stem}>{item.question_text}</Text>

      <View style={styles.answerBlock}>
        <Text style={styles.answerLabel}>Selected answer</Text>
        <Text
          style={[
            styles.answerValue,
            isCorrect ? styles.textCorrect : null,
            isWrong ? styles.textWrong : null,
            isSkipped ? styles.textSkipped : null,
          ]}
        >
          {formatAnswer(item, item.selected_answer)}
        </Text>
      </View>

      <View style={[styles.answerBlock, styles.correctBlock]}>
        <Text style={styles.answerLabel}>Correct answer</Text>
        <Text style={[styles.answerValue, styles.textCorrect]}>
          {formatAnswer(item, item.correct_answer)}
        </Text>
      </View>

      {item.explanation ? (
        <View style={styles.explanationBlock}>
          <Text style={styles.answerLabel}>Explanation</Text>
          <Text style={styles.explanation}>{item.explanation}</Text>
        </View>
      ) : (
        <Text style={styles.noExplanation}>No explanation provided.</Text>
      )}

      {onReport ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Report question ${index + 1}`}
          onPress={onReport}
          style={styles.reportBtn}
        >
          <Text style={styles.reportText}>Report incorrect question</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardCorrect: {
    borderColor: 'rgba(46,125,50,0.55)',
    backgroundColor: 'rgba(46,125,50,0.1)',
  },
  cardWrong: {
    borderColor: 'rgba(198,40,40,0.55)',
    backgroundColor: 'rgba(198,40,40,0.1)',
  },
  cardSkipped: {
    borderColor: 'rgba(255,255,255,0.14)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qIndex: {
    color: '#A8B3C5',
    fontWeight: '700',
    fontSize: typography.fontSize.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badgeCorrect: {
    backgroundColor: 'rgba(46,125,50,0.28)',
  },
  badgeWrong: {
    backgroundColor: 'rgba(198,40,40,0.28)',
  },
  badgeSkipped: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    fontWeight: '700',
    fontSize: typography.fontSize.sm,
    color: colors.surface,
  },
  stem: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    lineHeight: 26,
  },
  answerBlock: {
    gap: spacing.xs,
  },
  correctBlock: {
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: 'rgba(46,125,50,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(46,125,50,0.35)',
  },
  answerLabel: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerValue: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    lineHeight: 22,
  },
  textCorrect: {
    color: '#81C784',
  },
  textWrong: {
    color: '#EF9A9A',
  },
  textSkipped: {
    color: '#A8B3C5',
  },
  explanationBlock: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  explanation: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  noExplanation: {
    color: '#7A8799',
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
  reportBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  reportText: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
});
