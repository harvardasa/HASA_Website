-- HASA CMS — audit log of admin write actions
-- Run AFTER 0006_cms.sql.

create table cms_actions (
  id          bigserial primary key,
  admin_id    uuid not null references profiles(id),
  entity_type text not null,        -- 'event' | 'gallery_image' | 'gallery_album' | 'news_post' | 'board_member' | 'site_content'
  entity_id   text not null,        -- the id of the row affected (uuid or semantic key)
  action      text not null,        -- 'create' | 'update' | 'delete' | 'publish' | 'unpublish'
  diff        jsonb,                -- optional before/after for important changes
  created_at  timestamptz not null default now()
);

create index cms_actions_admin_idx  on cms_actions (admin_id, created_at desc);
create index cms_actions_entity_idx on cms_actions (entity_type, entity_id);

-- ─── RLS — only admins can read the audit log ────────────────────────────────

alter table cms_actions enable row level security;

create policy "admin read cms actions"
  on cms_actions for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Writes happen via the service-role client (admin API routes), so no insert policy
