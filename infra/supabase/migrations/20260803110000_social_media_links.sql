-- Add editable social media links to platform_settings.general (student drawer).

update public.platform_settings
set
  value = coalesce(value, '{}'::jsonb) || jsonb_build_object(
    'social_facebook', coalesce(value ->> 'social_facebook', ''),
    'social_instagram', coalesce(value ->> 'social_instagram', ''),
    'social_telegram', coalesce(value ->> 'social_telegram', ''),
    'social_youtube', coalesce(value ->> 'social_youtube', ''),
    'social_whatsapp', coalesce(value ->> 'social_whatsapp', '')
  ),
  updated_at = now()
where key = 'general';

comment on table public.platform_settings is
  'System settings (branding, support, social links, legal, maintenance, app version) — service role only';
