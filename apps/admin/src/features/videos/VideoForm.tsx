/**
 * Create / edit video — YouTube URL only (validated), assign course + chapter.
 */
import { FormEvent, useEffect, useState } from 'react';

import type { Chapter, CourseSummary, Video } from '@sharanam/shared';

import {
  createAdminVideo,
  fetchChaptersForCourse,
  isValidYouTubeUrlClient,
  updateAdminVideo,
  uploadVideoThumbnail,
  type VideoWritePayload,
} from '@/features/videos/api';
import { ApiClientError } from '@/services/api';

type VideoFormProps = {
  video: Video | null;
  courses: CourseSummary[];
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  course_id: string;
  chapter_id: string;
  title: string;
  description: string;
  youtube_url: string;
  video_type: 'recorded' | 'live';
  thumbnail_url: string;
  duration_seconds: string;
  sort_order: string;
  is_free: boolean;
  is_published: boolean;
};

function fromVideo(video: Video | null, defaultCourseId: string): FormState {
  if (!video) {
    return {
      course_id: defaultCourseId,
      chapter_id: '',
      title: '',
      description: '',
      youtube_url: '',
      video_type: 'recorded',
      thumbnail_url: '',
      duration_seconds: '0',
      sort_order: '0',
      is_free: false,
      is_published: true,
    };
  }
  return {
    course_id: video.course_id,
    chapter_id: video.chapter_id,
    title: video.title,
    description: video.description ?? '',
    youtube_url: video.youtube_url,
    video_type: video.video_type,
    thumbnail_url: video.thumbnail_url ?? '',
    duration_seconds: String(video.duration_seconds ?? 0),
    sort_order: String(video.sort_order ?? 0),
    is_free: video.is_free,
    is_published: video.is_published,
  };
}

export function VideoForm({ video, courses, onSaved, onCancel }: VideoFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    fromVideo(video, courses[0]?.id ?? ''),
  );
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

  useEffect(() => {
    setForm(fromVideo(video, courses[0]?.id ?? ''));
    setError(null);
    setFieldErrors({});
  }, [video, courses]);

  useEffect(() => {
    if (!form.course_id) {
      setChapters([]);
      return;
    }
    let cancelled = false;
    setLoadingChapters(true);
    void fetchChaptersForCourse(form.course_id)
      .then((list) => {
        if (cancelled) return;
        setChapters(list);
        setForm((prev) => {
          if (prev.chapter_id && list.some((c) => c.id === prev.chapter_id)) {
            return prev;
          }
          return { ...prev, chapter_id: list[0]?.id ?? '' };
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? err.message : 'Failed to load chapters');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingChapters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.course_id]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.course_id) next.course_id = 'Select a course';
    if (!form.chapter_id) next.chapter_id = 'Select a chapter';
    if (form.title.trim().length < 2) next.title = 'Title must be at least 2 characters';
    if (!isValidYouTubeUrlClient(form.youtube_url)) {
      next.youtube_url = 'Paste a valid YouTube unlisted/public URL';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadVideoThumbnail(file);
      setField('thumbnail_url', url);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Thumbnail upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const payload: VideoWritePayload = {
      course_id: form.course_id,
      chapter_id: form.chapter_id,
      title: form.title.trim(),
      description: form.description.trim(),
      youtube_url: form.youtube_url.trim(),
      video_type: form.video_type,
      thumbnail_url: form.thumbnail_url.trim() || null,
      duration_seconds: Number(form.duration_seconds) || 0,
      sort_order: Number(form.sort_order) || 0,
      is_free: form.is_free,
      is_published: form.is_published,
    };

    setSaving(true);
    setError(null);
    try {
      if (video) {
        await updateAdminVideo(video.id, payload);
      } else {
        await createAdminVideo(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="course-form" onSubmit={onSubmit}>
      <div className="course-form-head">
        <h2>{video ? 'Update Video' : 'Create Video'}</h2>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Close
        </button>
      </div>

      <div className="form-grid">
        <label>
          Course *
          <select
            value={form.course_id}
            onChange={(e) => setField('course_id', e.target.value)}
            required
          >
            <option value="">Select course…</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          {fieldErrors.course_id ? (
            <span className="field-error">{fieldErrors.course_id}</span>
          ) : null}
        </label>

        <label>
          Chapter *
          <select
            value={form.chapter_id}
            onChange={(e) => setField('chapter_id', e.target.value)}
            required
            disabled={!form.course_id || loadingChapters}
          >
            <option value="">
              {loadingChapters ? 'Loading chapters…' : 'Select chapter…'}
            </option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                Chapter {chapter.chapter_number} · {chapter.title}
              </option>
            ))}
          </select>
          {fieldErrors.chapter_id ? (
            <span className="field-error">{fieldErrors.chapter_id}</span>
          ) : null}
        </label>

        <label className="span-2">
          Video Title *
          <input
            required
            minLength={2}
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. Real Numbers — Introduction"
          />
          {fieldErrors.title ? <span className="field-error">{fieldErrors.title}</span> : null}
        </label>

        <label className="span-2">
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Optional short description"
          />
        </label>

        <label className="span-2">
          YouTube URL *
          <input
            required
            type="url"
            placeholder="https://www.youtube.com/watch?v=… (unlisted)"
            value={form.youtube_url}
            onChange={(e) => setField('youtube_url', e.target.value)}
          />
          {fieldErrors.youtube_url ? (
            <span className="field-error">{fieldErrors.youtube_url}</span>
          ) : (
            <span className="hint">Paste unlisted/public YouTube link. Only URL is stored in DB.</span>
          )}
        </label>

        <div className="span-2">
          <span className="field-label">Video Type *</span>
          <div className="content-type-tabs" role="group" aria-label="Video type">
            <button
              type="button"
              className={`content-type-tab${form.video_type === 'recorded' ? ' is-active' : ''}`}
              onClick={() => setField('video_type', 'recorded')}
            >
              Recorded
            </button>
            <button
              type="button"
              className={`content-type-tab${form.video_type === 'live' ? ' is-active' : ''}`}
              onClick={() => setField('video_type', 'live')}
            >
              Live
            </button>
          </div>
        </div>

        <label className="span-2 file-upload-field">
          Thumbnail
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
          />
          {uploading ? <span className="hint">Uploading…</span> : null}
          <input
            type="url"
            placeholder="Or paste thumbnail URL (optional — YouTube default if empty)"
            value={form.thumbnail_url}
            onChange={(e) => setField('thumbnail_url', e.target.value)}
            style={{ marginTop: '0.5rem' }}
          />
        </label>

        {form.thumbnail_url ? (
          <div className="span-2 banner-preview">
            <img src={form.thumbnail_url} alt="Video thumbnail preview" />
          </div>
        ) : null}

        <label>
          Duration (seconds)
          <input
            type="number"
            min={0}
            value={form.duration_seconds}
            onChange={(e) => setField('duration_seconds', e.target.value)}
          />
        </label>

        <label>
          Sort Order
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setField('sort_order', e.target.value)}
          />
        </label>

        <label className="checkbox span-2">
          <input
            type="checkbox"
            checked={form.is_free}
            onChange={(e) => setField('is_free', e.target.checked)}
          />
          Free Preview (unlocked without purchase)
        </label>

        <label className="checkbox span-2">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setField('is_published', e.target.checked)}
          />
          Published (visible in student app)
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
