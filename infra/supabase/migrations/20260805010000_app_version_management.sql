-- App version history + extend platform_settings.general with update policy fields.

CREATE TABLE IF NOT EXISTS public.app_version_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  android_build_number integer,
  ios_build_number text,
  release_notes text NOT NULL DEFAULT '',
  force_update boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_version_history_version_semver
    CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+')
);

CREATE INDEX IF NOT EXISTS app_version_history_published_at_idx
  ON public.app_version_history (published_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS app_version_history_version_uidx
  ON public.app_version_history (version);

ALTER TABLE public.app_version_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_version_history_deny_all ON public.app_version_history;
CREATE POLICY app_version_history_deny_all
  ON public.app_version_history
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.app_version_history IS
  'Published mobile app releases (SemVer + notes + build numbers). API service role only.';

-- Additive keys on existing general settings JSON
UPDATE public.platform_settings
SET value = value
  || jsonb_build_object(
    'recommended_app_version', coalesce(value ->> 'recommended_app_version', value ->> 'app_version', '1.0.0'),
    'force_update', coalesce((value ->> 'force_update')::boolean, false),
    'optional_update', coalesce((value ->> 'optional_update')::boolean, true),
    'release_notes', coalesce(value ->> 'release_notes', ''),
    'android_build_number', coalesce((value ->> 'android_build_number')::int, 1),
    'ios_build_number', coalesce(value ->> 'ios_build_number', '1'),
    'store_url_android', coalesce(
      value ->> 'store_url_android',
      'https://play.google.com/store/apps/details?id=com.sharanamclasses.app'
    ),
    'store_url_ios', coalesce(value ->> 'store_url_ios', '')
  ),
  updated_at = now()
WHERE key = 'general';

-- Seed first history row if empty
INSERT INTO public.app_version_history (
  version,
  android_build_number,
  ios_build_number,
  release_notes,
  force_update,
  published_at
)
SELECT
  coalesce(value ->> 'app_version', '1.0.0'),
  coalesce((value ->> 'android_build_number')::int, 1),
  coalesce(value ->> 'ios_build_number', '1'),
  coalesce(value ->> 'release_notes', 'Initial release.'),
  coalesce((value ->> 'force_update')::boolean, false),
  now()
FROM public.platform_settings
WHERE key = 'general'
  AND NOT EXISTS (SELECT 1 FROM public.app_version_history LIMIT 1);
