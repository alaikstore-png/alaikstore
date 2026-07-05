-- Migration: add Duitku (payment gateway) and MedanPedia (top-up provider)
-- Run this in the Supabase SQL Editor if you already ran the original schema.sql
-- and don't want to drop/recreate tables. Safe to run once; re-running is also
-- harmless (constraints are dropped and recreated with the same final shape).

alter table public.providers drop constraint if exists providers_name_check;
alter table public.providers add constraint providers_name_check
  check (name in ('VIP Reseller','Digiflazz','APIGames','Tokovoucher','MedanPedia'));

alter table public.orders drop constraint if exists orders_payment_gateway_check;
alter table public.orders add constraint orders_payment_gateway_check
  check (payment_gateway in ('tripay','midtrans','xendit','duitku'));

alter table public.orders drop constraint if exists orders_provider_name_check;
alter table public.orders add constraint orders_provider_name_check
  check (provider_name in ('VIP Reseller','Digiflazz','APIGames','Tokovoucher','MedanPedia'));

alter table public.payments drop constraint if exists payments_gateway_check;
alter table public.payments add constraint payments_gateway_check
  check (gateway in ('tripay','midtrans','xendit','duitku'));
