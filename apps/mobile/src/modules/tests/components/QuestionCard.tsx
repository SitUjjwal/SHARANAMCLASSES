/**
 * QuestionCard — single-question view: stem + four OptionChoice rows + marks.
 *
 * Only one question is mounted at a time (parent swaps by index).
 */
import { StyleSheet, Text, View } from 'react-native';

import { OptionChoice } from '@/modules/tests/components/OptionChoice';
import { colors, spacing, typography } from '@/theme';
import type { QuestionCorrectAnswer, QuestionPublic } from '@sharanam/shared';

type Props = {
  index: number;
  total: number;
  question: QuestionPublic;
  selectedAnswer: QuestionCorrectAnswer | null;
  disabled?: boolean;
  onSelect: (key: QuestionCorrectAnswer) => void;
};

export function QuestionCard({
  index,
  total,
  question,
  selectedAnswer,
  disabled,
  onSelect,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          Question {index + 1} of {total}
        </Text>
        <Text style={styles.marks}>
          +{question.marks}
          {question.negative_marks > 0 ? ` / −${question.negative_marks}` : ''}
        </Text>
      </View>
      <Text style={styles.stem}>{question.question_text}</Text>
      <View style={styles.options}>
        <OptionChoice
          optionKey="A"
          label={question.option_a}
          selected={selectedAnswer === 'A'}
          disabled={disabled}
          onSelect={onSelect}
        />
        <OptionChoice
          optionKey="B"
          label={question.option_b}
          selected={selectedAnswer === 'B'}
          disabled={disabled}
          onSelect={onSelect}
        />
        <OptionChoice
          optionKey="C"
          label={question.option_c}
          selected={selectedAnswer === 'C'}
          disabled={disabled}
          onSelect={onSelect}
        />
        <OptionChoice
          optionKey="D"
          label={question.option_d}
          selected={selectedAnswer === 'D'}
          disabled={disabled}
          onSelect={onSelect}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  marks: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  stem: {
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    lineHeight: 26,
  },
  options: {
    gap: spacing.sm,
  },
});
