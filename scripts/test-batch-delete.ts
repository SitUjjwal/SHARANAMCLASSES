/**
 * Reproduces the admin "delete batch" flow directly against Supabase to find
 * which constraint blocks it. Creates a throwaway batch with linked rows,
 * then runs the same steps as deleteCourse(). Prints pass/fail only.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(__dirname, '../apps/api/.env') });

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const slug = `zz-delete-test-${Date.now()}`;
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .insert({
      title: 'ZZ Delete Test Batch',
      slug,
      class_level: '10',
      medium: 'hindi',
      board: 'bihar_board',
      academic_year: '2026-2027',
      price: 999,
      is_published: false,
    })
    .select('id')
    .single();
  if (courseErr) {
    console.log('CREATE_COURSE_FAIL', courseErr.message);
    return;
  }
  const courseId = course.id as string;
  console.log('created course', courseId);

  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .limit(1)
    .single();

  if (subject) {
    const { data: bs, error: bsErr } = await supabase
      .from('batch_subjects')
      .insert({ batch_id: courseId, subject_id: subject.id })
      .select('id')
      .single();
    console.log('batch_subject', bsErr ? `FAIL ${bsErr.message}` : 'ok');

    if (bs) {
      const { error: chErr } = await supabase
        .from('chapters')
        .insert({
          course_id: courseId,
          batch_subject_id: bs.id,
          title: 'ZZ Test Chapter',
        });
      console.log('chapter', chErr ? `FAIL ${chErr.message}` : 'ok');
    }
  }

  // Now the exact deleteCourse() sequence
  const { error: orderErr } = await supabase
    .from('payment_orders')
    .update({ course_id: null })
    .eq('course_id', courseId);
  console.log('unlink payment_orders', orderErr ? `FAIL ${orderErr.message}` : 'ok');

  const { error: purchasedErr } = await supabase
    .from('purchased_courses')
    .delete()
    .eq('course_id', courseId);
  console.log('clear purchased_courses', purchasedErr ? `FAIL ${purchasedErr.message}` : 'ok');

  const { error: delErr, count } = await supabase
    .from('courses')
    .delete({ count: 'exact' })
    .eq('id', courseId);
  console.log(
    'DELETE course',
    delErr ? `FAIL code=${delErr.code} ${delErr.message}` : `ok (count=${count})`,
  );
}

void main();
