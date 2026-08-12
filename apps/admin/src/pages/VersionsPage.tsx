/**
 * Admin — publish SemVer releases, release notes, force/optional policy, history.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import type { AppVersionHistoryEntry, PlatformGeneralSettings } from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePlatform } from '@/features/platform/PlatformProvider';
import { ApiClientError } from '@/services/api';
import {
  fetchAppVersionHistory,
  fetchPlatformSettings,
  publishAppVersion,
  savePlatformSettings,
} from '@/services/settingService';

const EMPTY_POLICY: Pick<
  PlatformGeneralSettings,
  | 'app_version'
  | 'min_app_version'
  | 'recommended_app_version'
  | 'force_update'
  | 'optional_update'
  | 'release_notes'
  | 'android_build_number'
  | 'ios_build_number'
  | 'store_url_android'
  | 'store_url_ios'
> = {
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
};

export function VersionsPage() {
  const { can } = useAuth();
  const { refresh } = usePlatform();
  const canRead = can('settings:read') || can('settings:manage');
  const canWrite = can('settings:update') || can('settings:manage');

  const [policy, setPolicy] = useState(EMPTY_POLICY);
  const [history, setHistory] = useState<AppVersionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [publishForm, setPublishForm] = useState({
    version: '1.0.1',
    release_notes: '',
    android_build_number: 2,
    ios_build_number: '2',
    force_update: false,
    optional_update: true,
    min_app_version: '1.0.0',
    publish_as_current: true,
  });

  const load = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      setError('You do not have permission to view versions.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [settings, hist] = await Promise.all([
        fetchPlatformSettings(),
        fetchAppVersionHistory(),
      ]);
      setPolicy({
        app_version: settings.general.app_version,
        min_app_version: settings.general.min_app_version,
        recommended_app_version: settings.general.recommended_app_version || settings.general.app_version,
        force_update: settings.general.force_update,
        optional_update: settings.general.optional_update,
        release_notes: settings.general.release_notes,
        android_build_number: settings.general.android_build_number,
        ios_build_number: settings.general.ios_build_number,
        store_url_android: settings.general.store_url_android,
        store_url_ios: settings.general.store_url_ios,
      });
      setHistory(hist);
      setPublishForm((f) => ({
        ...f,
        version: bumpPatch(settings.general.app_version),
        android_build_number: settings.general.android_build_number + 1,
        ios_build_number: String(Number(settings.general.ios_build_number || '1') + 1),
        min_app_version: settings.general.min_app_version,
        optional_update: settings.general.optional_update,
      }));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    void load();
  }, [load]);

  const savePolicy = async (e: FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setOk(null);
    setError(null);
    try {
      const current = await fetchPlatformSettings();
      await savePlatformSettings({
        ...current.general,
        ...policy,
      });
      await refresh();
      setOk('Live update policy saved.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async (e: FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setPublishing(true);
    setOk(null);
    setError(null);
    try {
      await publishAppVersion({
        version: publishForm.version,
        release_notes: publishForm.release_notes,
        android_build_number: publishForm.android_build_number,
        ios_build_number: publishForm.ios_build_number,
        force_update: publishForm.force_update,
        optional_update: publishForm.optional_update,
        min_app_version: publishForm.min_app_version,
        publish_as_current: publishForm.publish_as_current,
      });
      await refresh();
      setOk(`Published ${publishForm.version}.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="App versions"
        description="Semantic versioning, release notes, force / optional updates, and build numbers."
      />

      {error ? <p className="error-banner">{error}</p> : null}
      {ok ? <p className="success-banner">{ok}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      {!loading ? (
        <>
          <form className="settings-form" onSubmit={savePolicy}>
            <fieldset disabled={!canWrite}>
              <legend>Live policy (what mobile checks)</legend>
              <p className="hint">
                Force if client &lt; min version, or force_update + below latest. Optional if
                optional_update and below recommended/latest.
              </p>
              <div className="form-grid-2">
                <label>
                  Latest app version (SemVer)
                  <input
                    value={policy.app_version}
                    onChange={(e) => setPolicy((p) => ({ ...p, app_version: e.target.value }))}
                    pattern="\d+\.\d+\.\d+"
                    required
                  />
                </label>
                <label>
                  Minimum (force below this)
                  <input
                    value={policy.min_app_version}
                    onChange={(e) => setPolicy((p) => ({ ...p, min_app_version: e.target.value }))}
                    pattern="\d+\.\d+\.\d+"
                    required
                  />
                </label>
                <label>
                  Recommended (optional below this)
                  <input
                    value={policy.recommended_app_version}
                    onChange={(e) =>
                      setPolicy((p) => ({ ...p, recommended_app_version: e.target.value }))
                    }
                    pattern="\d+\.\d+\.\d+"
                  />
                </label>
                <label>
                  Android build number (versionCode)
                  <input
                    type="number"
                    min={1}
                    value={policy.android_build_number}
                    onChange={(e) =>
                      setPolicy((p) => ({
                        ...p,
                        android_build_number: Number(e.target.value) || 1,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  iOS build number
                  <input
                    value={policy.ios_build_number}
                    onChange={(e) => setPolicy((p) => ({ ...p, ios_build_number: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={policy.force_update}
                  onChange={(e) => setPolicy((p) => ({ ...p, force_update: e.target.checked }))}
                />
                Force update (all clients below latest must update)
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={policy.optional_update}
                  onChange={(e) => setPolicy((p) => ({ ...p, optional_update: e.target.checked }))}
                />
                Optional update prompts enabled
              </label>
              <label>
                Release notes (shown in-app)
                <textarea
                  rows={5}
                  value={policy.release_notes}
                  onChange={(e) => setPolicy((p) => ({ ...p, release_notes: e.target.value }))}
                  placeholder="What’s new in this version…"
                />
              </label>
              <label>
                Play Store URL
                <input
                  value={policy.store_url_android}
                  onChange={(e) => setPolicy((p) => ({ ...p, store_url_android: e.target.value }))}
                />
              </label>
              <label>
                App Store URL
                <input
                  value={policy.store_url_ios}
                  onChange={(e) => setPolicy((p) => ({ ...p, store_url_ios: e.target.value }))}
                  placeholder="https://apps.apple.com/…"
                />
              </label>
              {canWrite ? (
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save live policy'}
                </button>
              ) : null}
            </fieldset>
          </form>

          <form className="settings-form" onSubmit={onPublish} style={{ marginTop: '1.5rem' }}>
            <fieldset disabled={!canWrite}>
              <legend>Publish new release</legend>
              <p className="hint">
                Writes version history and (by default) updates live policy. Also bump{' '}
                <code>APP_VERSION</code> / <code>ANDROID_VERSION_CODE</code> in{' '}
                <code>apps/mobile/app.config.js</code> before the next EAS build.
              </p>
              <div className="form-grid-2">
                <label>
                  Version
                  <input
                    value={publishForm.version}
                    onChange={(e) => setPublishForm((f) => ({ ...f, version: e.target.value }))}
                    pattern="\d+\.\d+\.\d+"
                    required
                  />
                </label>
                <label>
                  Min version after publish
                  <input
                    value={publishForm.min_app_version}
                    onChange={(e) =>
                      setPublishForm((f) => ({ ...f, min_app_version: e.target.value }))
                    }
                    pattern="\d+\.\d+\.\d+"
                    required
                  />
                </label>
                <label>
                  Android versionCode
                  <input
                    type="number"
                    min={1}
                    value={publishForm.android_build_number}
                    onChange={(e) =>
                      setPublishForm((f) => ({
                        ...f,
                        android_build_number: Number(e.target.value) || 1,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  iOS build
                  <input
                    value={publishForm.ios_build_number}
                    onChange={(e) =>
                      setPublishForm((f) => ({ ...f, ios_build_number: e.target.value }))
                    }
                    required
                  />
                </label>
              </div>
              <label>
                Release notes
                <textarea
                  rows={4}
                  value={publishForm.release_notes}
                  onChange={(e) =>
                    setPublishForm((f) => ({ ...f, release_notes: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={publishForm.force_update}
                  onChange={(e) =>
                    setPublishForm((f) => ({ ...f, force_update: e.target.checked }))
                  }
                />
                Mark force update for this release
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={publishForm.optional_update}
                  onChange={(e) =>
                    setPublishForm((f) => ({ ...f, optional_update: e.target.checked }))
                  }
                />
                Keep optional updates on
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={publishForm.publish_as_current}
                  onChange={(e) =>
                    setPublishForm((f) => ({ ...f, publish_as_current: e.target.checked }))
                  }
                />
                Apply as live policy now
              </label>
              {canWrite ? (
                <button type="submit" className="btn primary" disabled={publishing}>
                  {publishing ? 'Publishing…' : 'Publish release'}
                </button>
              ) : null}
            </fieldset>
          </form>

          <section style={{ marginTop: '2rem' }}>
            <h2>Version history</h2>
            {history.length === 0 ? (
              <p className="hint">No releases recorded yet. Run the migration, then publish.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Android</th>
                      <th>iOS</th>
                      <th>Force</th>
                      <th>Published</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.version}</strong>
                        </td>
                        <td>{row.android_build_number ?? '—'}</td>
                        <td>{row.ios_build_number ?? '—'}</td>
                        <td>{row.force_update ? 'Yes' : 'No'}</td>
                        <td>{new Date(row.published_at).toLocaleString()}</td>
                        <td style={{ maxWidth: 280, whiteSpace: 'pre-wrap' }}>
                          {row.release_notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function bumpPatch(version: string): string {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!m) return '1.0.1';
  return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}
