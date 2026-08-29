/**
 * Open a batch: purchased → folder explorer; otherwise → Course Detail (buy).
 *
 * Nav is a structural type so Home / Courses tab composites can call this
 * (they are not `NavigationProp<AppStackParamList>`).
 */
import { fetchBatchSubjects } from '@/services/subject.service';

type OpenBatchOpts = {
  courseId: string;
  title?: string;
  isPurchased: boolean;
  /** After payment, replace the success screen instead of stacking. */
  replace?: boolean;
};

type BatchNav = {
  navigate: (
    name: 'CourseDetail' | 'SubjectList' | 'ChapterList',
    params?: object,
  ) => void;
};

function goToBatchScreen(
  navigation: BatchNav,
  name: 'SubjectList' | 'ChapterList',
  params: object,
  replace: boolean,
) {
  if (replace) {
    const withReplace = navigation as BatchNav & {
      replace?: (screen: string, nextParams?: object) => void;
    };
    if (withReplace.replace) {
      withReplace.replace(name, params);
      return;
    }
  }
  navigation.navigate(name, params);
}

export async function openBatchContent(
  navigation: BatchNav,
  opts: OpenBatchOpts,
): Promise<void> {
  if (!opts.isPurchased) {
    navigation.navigate('CourseDetail', { courseId: opts.courseId });
    return;
  }

  let hasSubjects = false;
  try {
    const subjects = await fetchBatchSubjects(opts.courseId);
    hasSubjects = subjects.length > 0;
  } catch {
    hasSubjects = false;
  }

  if (hasSubjects) {
    goToBatchScreen(
      navigation,
      'SubjectList',
      { batchId: opts.courseId, batchTitle: opts.title ?? '' },
      Boolean(opts.replace),
    );
    return;
  }

  goToBatchScreen(
    navigation,
    'ChapterList',
    { courseId: opts.courseId, courseTitle: opts.title },
    Boolean(opts.replace),
  );
}
