/**
 * Admin Notifications — compose, edit, delete, and send push campaigns.
 */
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { NotificationAudienceType, NotificationType } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { fetchAdminCourses } from '@/features/courses/api';
import {
  createAdminNotification,
  deleteAdminNotification,
  listAdminNotifications,
  sendAdminNotification,
  updateAdminNotification,
  type AdminNotificationCampaign,
} from '@/features/notifications/api';
import { ApiClientError } from '@/services/api';

const TYPES: { value: NotificationType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'live_class', label: 'Live class' },
  { value: 'course_update', label: 'Course update' },
  { value: 'test_reminder', label: 'Test reminder' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'course_expiry', label: 'Course expiry' },
  { value: 'missed_class', label: 'Missed class' },
  { value: 'payment', label: 'Payment' },
];

const CLASS_LEVELS = ['6', '7', '8', '9', '10', '11', '12', 'competitive', 'computer'];

type CourseOption = { id: string; title: string };

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function asNotificationType(value: string): NotificationType {
  return (TYPES.find((t) => t.value === value)?.value ?? 'general') as NotificationType;
}

export function NotificationsPage() {
  const [items, setItems] = useState<AdminNotificationCampaign[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>('general');
  const [audienceType, setAudienceType] = useState<NotificationAudienceType>('all_users');
  const [audienceUserId, setAudienceUserId] = useState('');
  const [audienceClass, setAudienceClass] = useState('10');
  const [audienceCourseId, setAudienceCourseId] = useState('');
  const [sendNow, setSendNow] = useState(true);

  const resetForm = useCallback((keepCourseId?: string) => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setDeepLink('');
    setNotificationType('general');
    setAudienceType('all_users');
    setAudienceUserId('');
    setAudienceClass('10');
    setAudienceCourseId(keepCourseId ?? '');
    setSendNow(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaigns, coursePage] = await Promise.all([
        listAdminNotifications(40),
        fetchAdminCourses({ page: 1, pageSize: 100, status: 'all' }),
      ]);
      setItems(campaigns);
      const courseOptions = (coursePage.items ?? []).map((c) => ({
        id: c.id,
        title: c.title,
      }));
      setCourses(courseOptions);
      if (!audienceCourseId && courseOptions[0]?.id) {
        setAudienceCourseId(courseOptions[0].id);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else {
        setError('Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  }, [audienceCourseId]);

  useEffect(() => {
    void load();
  }, []);

  function openEdit(item: AdminNotificationCampaign) {
    setEditingId(item.id);
    setTitle(item.title);
    setBody(item.body);
    setDeepLink(item.deep_link ?? '');
    setNotificationType(asNotificationType(String(item.notification_type)));
    setAudienceType(item.audience_type);
    setAudienceUserId(item.audience_user_id ?? '');
    setAudienceClass(item.audience_class_level ?? '10');
    setAudienceCourseId(item.audience_course_id ?? courses[0]?.id ?? '');
    setSendNow(item.status === 'draft');
    setMessage(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const payload = {
      title: title.trim(),
      body: body.trim(),
      deep_link: deepLink.trim() || null,
      notification_type: notificationType,
      audience_type: audienceType,
      audience_user_id:
        audienceType === 'single_user' ? audienceUserId.trim() : undefined,
      audience_class_level: audienceType === 'class' ? audienceClass : undefined,
      audience_course_id:
        audienceType === 'course' ? audienceCourseId || undefined : undefined,
      send: sendNow,
    };
    try {
      if (editingId) {
        await updateAdminNotification(editingId, payload);
        setMessage(
          sendNow
            ? 'Notification updated (sent if it was still a draft).'
            : 'Notification updated.',
        );
      } else {
        await createAdminNotification(payload);
        setMessage(sendNow ? 'Notification saved and sent.' : 'Notification saved as draft.');
      }
      resetForm(audienceCourseId || courses[0]?.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function onSendDraft(id: string) {
    try {
      await sendAdminNotification(id);
      setMessage('Draft sent.');
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Send failed');
    }
  }

  async function onDelete(item: AdminNotificationCampaign) {
    const ok = window.confirm(
      `Delete notification “${item.title}”? This removes the campaign and student inbox rows.`,
    );
    if (!ok) return;
    try {
      await deleteAdminNotification(item.id);
      if (editingId === item.id) {
        resetForm(audienceCourseId || courses[0]?.id);
      }
      setMessage('Notification deleted.');
      await load();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Notifications"
        description="Compose, edit, and delete push campaigns. Delivery stats live under Delivery Reports."
      />

      <p className="hint">
        After sending, open <Link to="/delivery-reports">Delivery Reports</Link> for
        delivered / opened / failed KPIs.
      </p>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="hint">{message}</p> : null}

      <form className="admin-form card-panel" onSubmit={(e) => void onSubmit(e)}>
        <h2 className="section-title">{editingId ? 'Edit notification' : 'Compose'}</h2>

        <label className="field">
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
          />
        </label>

        <label className="field">
          <span>Body</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={1000}
            required
          />
        </label>

        <label className="field">
          <span>Deep link (optional)</span>
          <input
            value={deepLink}
            onChange={(e) => setDeepLink(e.target.value)}
            placeholder="sharanam://course/…"
          />
        </label>

        <div className="form-row">
          <label className="field">
            <span>Type</span>
            <select
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value as NotificationType)}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Audience</span>
            <select
              value={audienceType}
              onChange={(e) =>
                setAudienceType(e.target.value as NotificationAudienceType)
              }
            >
              <option value="all_users">All users</option>
              <option value="class">Class</option>
              <option value="course">Course</option>
              <option value="single_user">Single user</option>
            </select>
          </label>
        </div>

        {audienceType === 'class' ? (
          <label className="field">
            <span>Class level</span>
            <select value={audienceClass} onChange={(e) => setAudienceClass(e.target.value)}>
              {CLASS_LEVELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {audienceType === 'course' ? (
          <label className="field">
            <span>Course</span>
            <select
              value={audienceCourseId}
              onChange={(e) => setAudienceCourseId(e.target.value)}
              required
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {audienceType === 'single_user' ? (
          <label className="field">
            <span>User ID (UUID)</span>
            <input
              value={audienceUserId}
              onChange={(e) => setAudienceUserId(e.target.value)}
              required
              placeholder="student profile uuid"
            />
          </label>
        ) : null}

        <label className="field checkbox-field">
          <input
            type="checkbox"
            checked={sendNow}
            onChange={(e) => setSendNow(e.target.checked)}
          />
          <span>
            {editingId
              ? 'Send immediately if still a draft'
              : 'Send immediately'}
          </span>
        </label>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving
              ? 'Saving…'
              : editingId
                ? 'Update'
                : sendNow
                  ? 'Save & send'
                  : 'Save draft'}
          </button>
          {editingId ? (
            <button
              type="button"
              className="btn ghost"
              disabled={saving}
              onClick={() => resetForm(audienceCourseId || courses[0]?.id)}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <h2 className="section-title">Recent campaigns</h2>
      {loading ? <p className="hint">Loading…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="hint">No campaigns yet.</p>
      ) : (
        <div className="banner-admin-list">
          {items.map((item) => (
            <article key={item.id} className="banner-admin-card">
              <div className="banner-admin-meta">
                <strong>{item.title}</strong>
                <span className="hint">
                  {item.notification_type} · {item.audience_type} · {item.status}
                  {item.target_user_count
                    ? ` · ${item.push_success_count}/${item.target_user_count} delivered`
                    : ''}
                </span>
                <span className="banner-admin-link">{item.body}</span>
                <span className="hint">
                  Created {formatWhen(item.created_at)}
                  {item.sent_at ? ` · Sent ${formatWhen(item.sent_at)}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn ghost" onClick={() => openEdit(item)}>
                  Edit
                </button>
                {item.status === 'draft' ? (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => void onSendDraft(item.id)}
                  >
                    Send
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => void onDelete(item)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
