/**
 * FAQ domain types.
 */
export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateFaqInput = {
  question: string;
  answer: string;
  category?: string | null;
  sort_order?: number;
  is_published?: boolean;
};

export type UpdateFaqInput = Partial<CreateFaqInput>;

export type ReorderFaqsInput = {
  ordered_ids: string[];
};
