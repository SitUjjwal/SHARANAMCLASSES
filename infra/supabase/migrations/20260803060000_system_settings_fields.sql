-- Expand platform_settings.general with System Settings fields.
-- Additive JSON merge — safe if keys already exist.

update public.platform_settings
set
  value = coalesce(value, '{}'::jsonb) || jsonb_build_object(
    'logo_url', coalesce(value ->> 'logo_url', ''),
    'logo_storage_key', coalesce(value ->> 'logo_storage_key', ''),
    'primary_color', coalesce(value ->> 'primary_color', '#0B6E4F'),
    'privacy_policy', coalesce(value ->> 'privacy_policy', ''),
    'terms', coalesce(value ->> 'terms', ''),
    'app_version', coalesce(value ->> 'app_version', '1.0.0'),
    'min_app_version', coalesce(value ->> 'min_app_version', '1.0.0')
  ),
  updated_at = now()
where key = 'general';

comment on table public.platform_settings is
  'System settings (branding, support, legal, maintenance, app version) — service role only';
