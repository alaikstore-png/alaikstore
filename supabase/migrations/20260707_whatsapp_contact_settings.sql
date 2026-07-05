-- =========================================================
-- Alaikstore — Kontak WhatsApp (live chat) jadi bisa diatur dari Dashboard
-- Admin, bukan hardcode di kode. Run this AFTER 20260706_profit_report_stock_sync.sql
-- =========================================================

-- Nilai default — sama seperti yang sebelumnya hardcode di WhatsAppButton.jsx.
-- Admin bisa ganti nomor & pesan lewat tab "Kontak & Live Chat" di Dashboard Admin.
insert into public.settings (key, value)
values ('whatsapp_contact', '{"number": "6285173487538", "message": "Halo Alaikstore, saya ingin bertanya seputar top up game."}'::jsonb)
on conflict (key) do nothing;

-- `settings` is admin-only by default (see schema.sql: settings_admin_only),
-- but the WhatsApp floating button is rendered on every public page, so
-- anonymous/guest visitors need read access to this one row specifically —
-- everything else in `settings` (cashback rates, affiliate defaults, etc.)
-- stays admin-only.
drop policy if exists "settings_public_read_whatsapp" on public.settings;
create policy "settings_public_read_whatsapp" on public.settings
  for select using (key = 'whatsapp_contact');
