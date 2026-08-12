/**
 * SettingsPage — production System Settings (branding, legal, maintenance, version).
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

import type { PlatformGeneralSettings } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePlatform } from '@/features/platform/PlatformProvider';
import { ApiClientError } from '@/services/api';
import {
  fetchPlatformSettings,
  savePlatformSettings,
  uploadPlatformLogo,
} from '@/services/settingService';

const EMPTY: PlatformGeneralSettings = {
  app_name: 'SHARANAM CLASSES',
  logo_url: '',
  logo_storage_key: '',
  primary_color: '#0B6E4F',
  support_email: 'sharanam.sp@gmail.com',
  support_phone: '',
  privacy_policy: '',
  terms: '',
  maintenance_mode: false,
  app_version: '1.0.0',
  min_app_version: '1.0.0',
  recommended_app_version: '1.0.0',
  force_update: false,
  optional_update: true,
  release_notes: '',
  android_build_number: 1,
  ios_build_number: '1',
  store_url_android: 'https://play.google.com/store/apps/details?id=com.sharanam.classes',
  store_url_ios: '',
  timezone: 'Asia/Kolkata',
  social_facebook: '',
  social_instagram: '',
  social_telegram: '',
  social_youtube: '',
  social_whatsapp: '',
};

export function SettingsPage() {
  const { can } = useAuth();
  const { refresh } = usePlatform();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<PlatformGeneralSettings>(EMPTY);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const canRead = can('settings:read') || can('settings:manage');
  const canWrite = can('settings:update') || can('settings:manage');

  const load = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      setError('You do not have permission to view settings.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlatformSettings();
      setForm({ ...EMPTY, ...data.general });
      setUpdatedAt(data.updated_at);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const data = await savePlatformSettings(form);
      setForm({ ...EMPTY, ...data.general });
      setUpdatedAt(data.updated_at);
      setSaved(true);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const onLogoChange = async (file: File | null) => {
    if (!file || !canWrite) return;
    setUploading(true);
    setError(null);
    setSaved(false);
    try {
      const data = await uploadPlatformLogo(file);
      setForm({ ...EMPTY, ...data.general });
      setUpdatedAt(data.updated_at);
      setSaved(true);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Logo upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!canRead) {
    return (
      <div className="page">
        <PageHeader title="System Settings" description="Access restricted." />
        <p className="form-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="System Settings"
        description="App branding, support contacts, legal copy, version, and maintenance."
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading settings…</p> : null}
      {updatedAt ? (
        <p className="hint">Last updated {new Date(updatedAt).toLocaleString('en-IN')}</p>
      ) : null}
      {saved ? <p className="hint">Settings saved.</p> : null}

      {!loading ? (
        <form className="form-card settings-form" onSubmit={(e) => void onSubmit(e)}>
          <fieldset disabled={!canWrite}>
            <legend>Branding</legend>
            <label>
              App name
              <input
                value={form.app_name}
                onChange={(e) => setForm((f) => ({ ...f, app_name: e.target.value }))}
                required
                maxLength={120}
              />
            </label>

            <div className="settings-logo-row">
              <div>
                <p className="hint" style={{ marginTop: 0 }}>
                  Logo (JPEG / PNG / WebP, max 2MB)
                </p>
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="App logo"
                    className="settings-logo-preview"
                  />
                ) : (
                  <p className="hint">No logo uploaded — admin will use the default asset.</p>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading || !canWrite}
                  onChange={(e) => void onLogoChange(e.target.files?.[0] ?? null)}
                />
                {uploading ? <p className="hint">Uploading logo…</p> : null}
              </div>
              <label>
                Primary color
                <div className="settings-color-row">
                  <input
                    type="color"
                    value={
                      /^#[0-9A-Fa-f]{6}$/.test(form.primary_color)
                        ? form.primary_color
                        : '#0B6E4F'
                    }
                    onChange={(e) =>
                      setForm((f) => ({ ...f, primary_color: e.target.value.toUpperCase() }))
                    }
                  />
                  <input
                    value={form.primary_color}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, primary_color: e.target.value }))
                    }
                    pattern="^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$"
                    required
                  />
                </div>
              </label>
            </div>
          </fieldset>

          <fieldset disabled={!canWrite}>
            <legend>Support</legend>
            <label>
              Support email
              <input
                type="email"
                value={form.support_email}
                onChange={(e) => setForm((f) => ({ ...f, support_email: e.target.value }))}
              />
            </label>
            <label>
              Support phone
              <input
                value={form.support_phone}
                onChange={(e) => setForm((f) => ({ ...f, support_phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </label>
            <label>
              Timezone
              <input
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                required
              />
            </label>
          </fieldset>

          <fieldset disabled={!canWrite}>
            <legend>Social media (student app drawer)</legend>
            <p className="hint" style={{ marginTop: 0 }}>
              Paste full links (https://…). Leave blank to hide that icon. WhatsApp example:
              https://wa.me/91XXXXXXXXXX
            </p>
            <label>
              Facebook
              <input
                type="text"
                inputMode="url"
                value={form.social_facebook}
                onChange={(e) => setForm((f) => ({ ...f, social_facebook: e.target.value }))}
                placeholder="https://www.facebook.com/…"
              />
            </label>
            <label>
              Instagram
              <input
                type="text"
                inputMode="url"
                value={form.social_instagram}
                onChange={(e) => setForm((f) => ({ ...f, social_instagram: e.target.value }))}
                placeholder="https://www.instagram.com/…"
              />
            </label>
            <label>
              Telegram
              <input
                type="text"
                inputMode="url"
                value={form.social_telegram}
                onChange={(e) => setForm((f) => ({ ...f, social_telegram: e.target.value }))}
                placeholder="https://t.me/…"
              />
            </label>
            <label>
              YouTube
              <input
                type="text"
                inputMode="url"
                value={form.social_youtube}
                onChange={(e) => setForm((f) => ({ ...f, social_youtube: e.target.value }))}
                placeholder="https://www.youtube.com/@…"
              />
            </label>
            <label>
              WhatsApp
              <input
                type="text"
                inputMode="url"
                value={form.social_whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, social_whatsapp: e.target.value }))}
                placeholder="https://wa.me/91XXXXXXXXXX"
              />
            </label>
          </fieldset>

          <fieldset disabled={!canWrite}>
            <legend>Legal</legend>
            <label>
              Privacy Policy
              <textarea
                rows={8}
                value={form.privacy_policy}
                onChange={(e) => setForm((f) => ({ ...f, privacy_policy: e.target.value }))}
                placeholder="Markdown or plain text shown in the student app…"
              />
            </label>
            <label>
              Terms
              <textarea
                rows={8}
                value={form.terms}
                onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
                placeholder="Terms of service / use…"
              />
            </label>
          </fieldset>

          <fieldset disabled={!canWrite}>
            <legend>Release & maintenance</legend>
            <p className="hint">
              Full SemVer / force update / history: open <a href="/versions">App versions</a>.
            </p>
            <label>
              App version
              <input
                value={form.app_version}
                onChange={(e) => setForm((f) => ({ ...f, app_version: e.target.value }))}
                pattern="\d+\.\d+\.\d+"
                required
              />
            </label>
            <label>
              Minimum app version (force below)
              <input
                value={form.min_app_version}
                onChange={(e) => setForm((f) => ({ ...f, min_app_version: e.target.value }))}
                pattern="\d+\.\d+\.\d+"
                required
              />
            </label>
            <label>
              Recommended version (optional below)
              <input
                value={form.recommended_app_version}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recommended_app_version: e.target.value }))
                }
                pattern="\d+\.\d+\.\d+"
              />
            </label>
            <label>
              Android build number
              <input
                type="number"
                min={1}
                value={form.android_build_number}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    android_build_number: Number(e.target.value) || 1,
                  }))
                }
              />
            </label>
            <label>
              iOS build number
              <input
                value={form.ios_build_number}
                onChange={(e) => setForm((f) => ({ ...f, ios_build_number: e.target.value }))}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.force_update}
                onChange={(e) => setForm((f) => ({ ...f, force_update: e.target.checked }))}
              />
              Force update (clients below latest)
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.optional_update}
                onChange={(e) => setForm((f) => ({ ...f, optional_update: e.target.checked }))}
              />
              Optional update prompts
            </label>
            <label>
              Release notes
              <textarea
                rows={4}
                value={form.release_notes}
                onChange={(e) => setForm((f) => ({ ...f, release_notes: e.target.value }))}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.maintenance_mode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maintenance_mode: e.target.checked }))
                }
              />
              Maintenance mode (blocks students/API clients; staff can still access)
            </label>
          </fieldset>

          {canWrite ? (
            <button type="submit" className="btn primary" disabled={saving || uploading}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          ) : (
            <p className="hint">You can view settings but cannot edit them.</p>
          )}
        </form>
      ) : null}
    </div>
  );
}
