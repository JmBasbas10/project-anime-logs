create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

create table public.player_events (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  player_id bigint not null,
  event_type text not null check (event_type in ('join', 'leave')),
  cash bigint not null,
  highest_wave integer not null,
  total_kills bigint not null,
  joined_at timestamptz not null,
  left_at timestamptz,
  session_duration_seconds integer,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.player_inventory (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.player_events(id) on delete cascade,
  character_name text not null,
  character_id text not null,
  level integer not null,
  mutation text not null,
  trait text not null
);

create table public.player_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.player_events(id) on delete cascade,
  item_name text not null,
  quantity integer not null
);

create table public.player_equipped (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.player_events(id) on delete cascade,
  character_name text not null,
  character_id text not null,
  level integer not null,
  mutation text not null,
  trait text not null
);

create table public.player_snapshots (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  player_id bigint not null,
  cash bigint not null,
  highest_wave integer not null,
  total_kills bigint not null,
  batch_timestamp timestamptz not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.snapshot_inventory (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.player_snapshots(id) on delete cascade,
  character_name text not null,
  character_id text not null,
  level integer not null,
  mutation text not null,
  trait text not null
);

create table public.snapshot_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.player_snapshots(id) on delete cascade,
  item_name text not null,
  quantity integer not null
);

create table public.snapshot_equipped (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.player_snapshots(id) on delete cascade,
  character_name text not null,
  character_id text not null,
  level integer not null,
  mutation text not null,
  trait text not null
);

create table public.character_sales (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  player_id bigint not null,
  sale_type text not null check (sale_type in ('SellOne', 'SellAll')),
  total_cash_received bigint not null,
  total_sold integer not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.sale_characters (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.character_sales(id) on delete cascade,
  character_name text not null,
  character_id text not null,
  level integer not null,
  mutation text not null,
  trait text not null,
  cash_received bigint not null
);

create table public.gift_logs (
  id uuid primary key default gen_random_uuid(),
  giver_name text not null,
  giver_id bigint not null,
  receiver_name text not null,
  receiver_id bigint not null,
  character_name text not null,
  character_id text not null,
  level integer not null,
  mutation text not null,
  trait text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.product_purchases (
  id uuid primary key default gen_random_uuid(),
  player_name text not null,
  player_id bigint not null,
  product_name text not null,
  robux_spent integer not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.servers (
  id uuid primary key default gen_random_uuid(),
  server_id text not null,
  player_count integer not null,
  last_ping timestamptz not null,
  created_at timestamptz not null default now()
);
