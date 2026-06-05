-- Run this migration before traffic grows. The indexes match the dashboard's
-- filters and sort order and keep child-table joins from scanning whole tables.

create index if not exists player_events_created_at_idx
  on public.player_events (created_at desc);
create index if not exists player_events_player_id_created_at_idx
  on public.player_events (player_id, created_at desc);
create index if not exists player_events_player_name_created_at_idx
  on public.player_events (player_name, created_at desc);

create index if not exists player_snapshots_batch_timestamp_idx
  on public.player_snapshots (batch_timestamp desc);
create index if not exists player_snapshots_player_id_batch_timestamp_idx
  on public.player_snapshots (player_id, batch_timestamp desc);
create index if not exists player_snapshots_player_name_batch_timestamp_idx
  on public.player_snapshots (player_name, batch_timestamp desc);

create index if not exists player_inventory_event_id_idx
  on public.player_inventory (event_id);
create index if not exists player_items_event_id_idx
  on public.player_items (event_id);
create index if not exists player_equipped_event_id_idx
  on public.player_equipped (event_id);
create index if not exists snapshot_inventory_snapshot_id_idx
  on public.snapshot_inventory (snapshot_id);
create index if not exists snapshot_items_snapshot_id_idx
  on public.snapshot_items (snapshot_id);
create index if not exists snapshot_equipped_snapshot_id_idx
  on public.snapshot_equipped (snapshot_id);

create index if not exists character_sales_created_at_idx
  on public.character_sales (created_at desc);
create index if not exists sale_characters_sale_id_idx
  on public.sale_characters (sale_id);
create index if not exists gift_logs_created_at_idx
  on public.gift_logs (created_at desc);
create index if not exists product_purchases_created_at_idx
  on public.product_purchases (created_at desc);
create index if not exists servers_last_ping_idx
  on public.servers (last_ping desc);

-- Enables fast server heartbeat upserts. The Roblox sender should use server_id.
with ranked_servers as (
  select
    id,
    row_number() over (partition by server_id order by last_ping desc, id) as row_number
  from public.servers
)
delete from public.servers
where id in (select id from ranked_servers where row_number > 1);

create unique index if not exists servers_server_id_uidx
  on public.servers (server_id);

-- Fast source for the Players page once it outgrows the current bounded query.
create or replace view public.latest_player_events as
select distinct on (player_id)
  player_id,
  player_name,
  cash,
  highest_wave,
  total_kills,
  created_at as last_seen,
  event_type
from public.player_events
order by player_id, created_at desc;

-- PostgreSQL needs fresh statistics for planned counts to stay useful.
analyze public.player_events;
analyze public.player_snapshots;
analyze public.character_sales;
analyze public.gift_logs;
analyze public.product_purchases;
