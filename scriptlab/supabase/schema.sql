-- ScriptLab — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

-- ── Enable anonymous auth (do this in Dashboard first) ─────────────────────
-- Dashboard → Authentication → Settings → Allow anonymous sign-ins → ON

-- ── Groups ──────────────────────────────────────────────────────────────────

create table public.groups (
  id         text        primary key,
  user_id    uuid        not null default auth.uid(),
  name       text        not null,
  parent_id  text,
  color      text        not null default '#6b7280',
  icon       text        not null default 'folder',
  "order"    integer     not null default 0,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

create policy "Users manage own groups"
  on public.groups for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Scripts ─────────────────────────────────────────────────────────────────

create table public.scripts (
  id          text        primary key,
  user_id     uuid        not null default auth.uid(),
  title       text        not null default 'Sin título',
  group_id    text,
  hook        text        not null default '',
  rehook      text        not null default '',
  content     text        not null default '',
  finale      text        not null default '',
  cta         text        not null default '',
  objective   text        not null default '',
  idea        text        not null default '',
  created_at  timestamptz not null,
  updated_at  timestamptz not null
);

alter table public.scripts enable row level security;

create policy "Users manage own scripts"
  on public.scripts for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
