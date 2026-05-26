-- HASA CMS — row-level security policies
-- Public READ access to published content. All WRITES go through admin API
-- routes using the service-role client (which bypasses RLS), so no INSERT /
-- UPDATE / DELETE policies are defined here.
-- Run AFTER 0006_cms.sql.

-- ─── site_content ────────────────────────────────────────────────────────────
alter table site_content enable row level security;

-- Anyone (anonymous or authenticated) can read site content
create policy "public read site content"
  on site_content for select
  to anon, authenticated
  using (true);

-- ─── events ──────────────────────────────────────────────────────────────────
alter table events enable row level security;

-- Only published events are publicly visible
create policy "public read published events"
  on events for select
  to anon, authenticated
  using (is_published = true);

-- ─── gallery_albums ──────────────────────────────────────────────────────────
alter table gallery_albums enable row level security;

create policy "public read published albums"
  on gallery_albums for select
  to anon, authenticated
  using (is_published = true);

-- ─── gallery_images ──────────────────────────────────────────────────────────
alter table gallery_images enable row level security;

-- Images are visible only if their parent album is published
create policy "public read images in published albums"
  on gallery_images for select
  to anon, authenticated
  using (
    exists (
      select 1
      from gallery_albums a
      where a.id = album_id and a.is_published = true
    )
  );

-- ─── board_members ───────────────────────────────────────────────────────────
alter table board_members enable row level security;

-- Only currently-active board members are publicly visible
create policy "public read active board members"
  on board_members for select
  to anon, authenticated
  using (is_active = true);

-- ─── news_posts ──────────────────────────────────────────────────────────────
alter table news_posts enable row level security;

-- Only posts that are published AND whose publish date has passed are visible.
-- The published_at = null case is treated as immediate publish.
create policy "public read published news"
  on news_posts for select
  to anon, authenticated
  using (
    is_published = true
    and (published_at is null or published_at <= now())
  );
