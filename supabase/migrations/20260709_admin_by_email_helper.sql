-- =========================================================
-- Helper: jadikan admin lewat EMAIL, bukan UID
-- =========================================================
-- Alasan dibuatkannya fungsi ini: cara lama (copy UID dari Authentication ->
-- Users lalu paste ke `update ... where id = '...'`) gampang salah kalau ada
-- lebih dari satu akun terdaftar — gampang ke-copy UID akun yang salah, dan
-- hasilnya membingungkan (query tetap "berhasil" tapi menjadikan admin akun
-- yang keliru). Fungsi ini mencari langsung dari tabel auth.users berdasarkan
-- email persis, jadi tidak ada lagi ruang untuk salah UID.
--
-- Pemakaian di SQL Editor:
--   select public.set_admin_by_email('emailkamu@gmail.com');
create or replace function public.set_admin_by_email(p_email text)
returns text as $$
declare
  v_id uuid;
  v_old_role text;
begin
  select id into v_id from auth.users where lower(email) = lower(p_email) limit 1;

  if v_id is null then
    return 'Tidak ditemukan akun dengan email tersebut. Pastikan email sudah pernah dipakai untuk daftar/login di website.';
  end if;

  select role into v_old_role from public.users where id = v_id;

  if v_old_role is null then
    -- Baris public.users belum ada (jarang terjadi, biasanya trigger signup
    -- yang membuatnya gagal) — buat barunya langsung sebagai admin.
    insert into public.users (id, role) values (v_id, 'admin')
    on conflict (id) do update set role = 'admin';
  else
    update public.users set role = 'admin' where id = v_id;
  end if;

  return 'Berhasil! Akun ' || p_email || ' (id: ' || v_id || ') sekarang menjadi admin. Silakan logout lalu login lagi di website.';
end;
$$ language plpgsql security definer set search_path = public;

comment on function public.set_admin_by_email is
  'Jalankan: select public.set_admin_by_email(''email@kamu.com''); — cara paling aman untuk menjadikan akun sebagai admin tanpa perlu copy-paste UID manual.';

-- PENTING: fungsi ini SENGAJA tidak boleh bisa dipanggil dari website/app
-- (lewat supabase.rpc(...)) oleh sembarang orang — kalau bisa, siapa saja
-- yang punya akun bisa menjadikan dirinya admin sendiri! Baris di bawah ini
-- mengunci fungsi supaya HANYA bisa dijalankan dari SQL Editor Supabase
-- (yang jalan sebagai role `postgres`), bukan dari anon/authenticated.
revoke execute on function public.set_admin_by_email(text) from public, anon, authenticated;
