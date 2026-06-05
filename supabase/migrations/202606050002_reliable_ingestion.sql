create extension if not exists pgcrypto;

-- Add sender idempotency keys in a backwards-compatible sequence.
alter table public.player_events add column if not exists source_event_id uuid;
alter table public.player_snapshots add column if not exists source_event_id uuid;
alter table public.gift_logs add column if not exists source_event_id uuid;
alter table public.character_sales add column if not exists source_event_id uuid;
alter table public.product_purchases add column if not exists source_event_id uuid;

update public.player_events set source_event_id = gen_random_uuid() where source_event_id is null;
update public.player_snapshots set source_event_id = gen_random_uuid() where source_event_id is null;
update public.gift_logs set source_event_id = gen_random_uuid() where source_event_id is null;
update public.character_sales set source_event_id = gen_random_uuid() where source_event_id is null;
update public.product_purchases set source_event_id = gen_random_uuid() where source_event_id is null;

alter table public.player_events alter column source_event_id set not null;
alter table public.player_snapshots alter column source_event_id set not null;
alter table public.gift_logs alter column source_event_id set not null;
alter table public.character_sales alter column source_event_id set not null;
alter table public.product_purchases alter column source_event_id set not null;

-- Defaults exist only for legacy endpoints, which cannot supply stable sender
-- IDs. New ingestion always supplies source_event_id explicitly.
alter table public.player_events alter column source_event_id set default gen_random_uuid();
alter table public.player_snapshots alter column source_event_id set default gen_random_uuid();
alter table public.gift_logs alter column source_event_id set default gen_random_uuid();
alter table public.character_sales alter column source_event_id set default gen_random_uuid();
alter table public.product_purchases alter column source_event_id set default gen_random_uuid();

create unique index if not exists player_events_source_event_id_uidx on public.player_events (source_event_id);
create unique index if not exists player_snapshots_source_event_id_uidx on public.player_snapshots (source_event_id);
create unique index if not exists gift_logs_source_event_id_uidx on public.gift_logs (source_event_id);
create unique index if not exists character_sales_source_event_id_uidx on public.character_sales (source_event_id);
create unique index if not exists product_purchases_source_event_id_uidx on public.product_purchases (source_event_id);

alter table public.player_events
  add column if not exists schema_version integer,
  add column if not exists server_job_id text,
  add column if not exists place_id bigint,
  add column if not exists occurred_at timestamptz,
  add column if not exists profile_version bigint,
  add column if not exists state_hash text;

alter table public.player_snapshots
  add column if not exists schema_version integer,
  add column if not exists server_job_id text,
  add column if not exists place_id bigint,
  add column if not exists occurred_at timestamptz,
  add column if not exists profile_version bigint,
  add column if not exists state_hash text,
  add column if not exists snapshot_kind text,
  add column if not exists changed_fields jsonb;

alter table public.player_snapshots drop constraint if exists player_snapshots_snapshot_kind_check;
alter table public.player_snapshots
  add constraint player_snapshots_snapshot_kind_check
  check (snapshot_kind is null or snapshot_kind in ('full', 'compact'));

alter table public.gift_logs
  add column if not exists schema_version integer,
  add column if not exists server_job_id text,
  add column if not exists place_id bigint,
  add column if not exists occurred_at timestamptz;

alter table public.character_sales
  add column if not exists schema_version integer,
  add column if not exists server_job_id text,
  add column if not exists place_id bigint,
  add column if not exists occurred_at timestamptz;

alter table public.product_purchases
  add column if not exists schema_version integer,
  add column if not exists server_job_id text,
  add column if not exists place_id bigint,
  add column if not exists occurred_at timestamptz,
  add column if not exists purchase_id text;

create unique index if not exists product_purchases_purchase_id_uidx
  on public.product_purchases (purchase_id)
  where purchase_id is not null;

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  source_event_id uuid not null unique,
  schema_version integer not null,
  server_job_id text not null,
  place_id bigint not null,
  occurred_at timestamptz not null,
  category text not null,
  severity text not null,
  player_id bigint,
  player_name text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_events_occurred_at_idx
  on public.security_events (occurred_at desc);

-- Each loop body is a PL/pgSQL subtransaction. A malformed event rolls back
-- only its own parent and children while unrelated events continue.
create or replace function public.ingest_player_events(p_events jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event jsonb;
  v_payload jsonb;
  v_child jsonb;
  v_source_id uuid;
  v_parent_id uuid;
  v_accepted jsonb := '[]'::jsonb;
  v_duplicates jsonb := '[]'::jsonb;
  v_rejected jsonb := '[]'::jsonb;
begin
  for v_event in select value from jsonb_array_elements(coalesce(p_events, '[]'::jsonb))
  loop
    v_source_id := null;
    begin
      v_source_id := (v_event->>'event_id')::uuid;
      if exists (select 1 from player_events where source_event_id = v_source_id) then
        v_duplicates := v_duplicates || to_jsonb(v_source_id::text);
        continue;
      end if;
      v_payload := v_event->'payload';
      insert into player_events (
        source_event_id, schema_version, server_job_id, place_id, occurred_at,
        profile_version, state_hash, player_name, player_id, event_type, cash,
        highest_wave, total_kills, joined_at, left_at, session_duration_seconds
      ) values (
        v_source_id, (v_event->>'schema_version')::integer, v_event->>'server_job_id',
        (v_event->>'place_id')::bigint, (v_event->>'occurred_at')::timestamptz,
        nullif(v_payload->>'profile_version', '')::bigint, v_payload->>'state_hash',
        v_payload->>'player_name', (v_payload->>'player_id')::bigint,
        v_event->>'event_type', (v_payload->>'cash')::bigint,
        (v_payload->>'highest_wave')::integer, (v_payload->>'total_kills')::bigint,
        coalesce(nullif(v_payload->>'joined_at', '')::timestamptz, (v_event->>'occurred_at')::timestamptz),
        nullif(v_payload->>'left_at', '')::timestamptz,
        nullif(v_payload->>'session_duration_seconds', '')::integer
      ) returning id into v_parent_id;
      for v_child in select value from jsonb_array_elements(coalesce(v_payload->'inventory', '[]'::jsonb))
      loop
        insert into player_inventory (event_id, character_name, character_id, level, mutation, trait)
        values (v_parent_id, v_child->>'character_name', v_child->>'character_id',
          (v_child->>'level')::integer, v_child->>'mutation', v_child->>'trait');
      end loop;
      for v_child in select value from jsonb_array_elements(coalesce(v_payload->'items', '[]'::jsonb))
      loop
        insert into player_items (event_id, item_name, quantity)
        values (v_parent_id, v_child->>'item_name', (v_child->>'quantity')::integer);
      end loop;
      for v_child in select value from jsonb_array_elements(coalesce(v_payload->'equipped', '[]'::jsonb))
      loop
        insert into player_equipped (event_id, character_name, character_id, level, mutation, trait)
        values (v_parent_id, v_child->>'character_name', v_child->>'character_id',
          (v_child->>'level')::integer, v_child->>'mutation', v_child->>'trait');
      end loop;
      v_accepted := v_accepted || to_jsonb(v_source_id::text);
    exception when unique_violation then
      if exists (select 1 from player_events where source_event_id = v_source_id) then
        v_duplicates := v_duplicates || to_jsonb(v_source_id::text);
      else
        raise;
      end if;
    when data_exception or not_null_violation or foreign_key_violation or check_violation then
      v_rejected := v_rejected || jsonb_build_object(
        'event_id', coalesce(v_source_id::text, v_event->>'event_id'), 'reason', sqlerrm);
    end;
  end loop;
  return jsonb_build_object('accepted_event_ids', v_accepted, 'duplicate_event_ids', v_duplicates, 'rejected', v_rejected);
end;
$$;

create or replace function public.ingest_player_snapshots(p_events jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event jsonb; v_payload jsonb; v_child jsonb; v_source_id uuid; v_parent_id uuid;
  v_accepted jsonb := '[]'::jsonb; v_duplicates jsonb := '[]'::jsonb; v_rejected jsonb := '[]'::jsonb;
begin
  for v_event in select value from jsonb_array_elements(coalesce(p_events, '[]'::jsonb))
  loop
    v_source_id := null;
    begin
      v_source_id := (v_event->>'event_id')::uuid;
      if exists (select 1 from player_snapshots where source_event_id = v_source_id) then
        v_duplicates := v_duplicates || to_jsonb(v_source_id::text); continue;
      end if;
      v_payload := v_event->'payload';
      insert into player_snapshots (
        source_event_id, schema_version, server_job_id, place_id, occurred_at,
        profile_version, state_hash, snapshot_kind, changed_fields, player_name,
        player_id, cash, highest_wave, total_kills, batch_timestamp
      ) values (
        v_source_id, (v_event->>'schema_version')::integer, v_event->>'server_job_id',
        (v_event->>'place_id')::bigint, (v_event->>'occurred_at')::timestamptz,
        nullif(v_payload->>'profile_version', '')::bigint, v_payload->>'state_hash',
        case when v_event->>'event_type' = 'snapshot_full' then 'full' else 'compact' end,
        v_payload->'changed_fields', v_payload->>'player_name', (v_payload->>'player_id')::bigint,
        (v_payload->>'cash')::bigint, (v_payload->>'highest_wave')::integer,
        (v_payload->>'total_kills')::bigint, (v_event->>'occurred_at')::timestamptz
      ) returning id into v_parent_id;
      for v_child in select value from jsonb_array_elements(coalesce(v_payload->'inventory', '[]'::jsonb))
      loop
        insert into snapshot_inventory (snapshot_id, character_name, character_id, level, mutation, trait)
        values (v_parent_id, v_child->>'character_name', v_child->>'character_id',
          (v_child->>'level')::integer, v_child->>'mutation', v_child->>'trait');
      end loop;
      for v_child in select value from jsonb_array_elements(coalesce(v_payload->'items', '[]'::jsonb))
      loop
        insert into snapshot_items (snapshot_id, item_name, quantity)
        values (v_parent_id, v_child->>'item_name', (v_child->>'quantity')::integer);
      end loop;
      for v_child in select value from jsonb_array_elements(coalesce(v_payload->'equipped', '[]'::jsonb))
      loop
        insert into snapshot_equipped (snapshot_id, character_name, character_id, level, mutation, trait)
        values (v_parent_id, v_child->>'character_name', v_child->>'character_id',
          (v_child->>'level')::integer, v_child->>'mutation', v_child->>'trait');
      end loop;
      v_accepted := v_accepted || to_jsonb(v_source_id::text);
    exception when unique_violation then
      if exists (select 1 from player_snapshots where source_event_id = v_source_id) then
        v_duplicates := v_duplicates || to_jsonb(v_source_id::text);
      else
        raise;
      end if;
    when data_exception or not_null_violation or foreign_key_violation or check_violation then
      v_rejected := v_rejected || jsonb_build_object('event_id', coalesce(v_source_id::text, v_event->>'event_id'), 'reason', sqlerrm);
    end;
  end loop;
  return jsonb_build_object('accepted_event_ids', v_accepted, 'duplicate_event_ids', v_duplicates, 'rejected', v_rejected);
end;
$$;

create or replace function public.ingest_sales(p_events jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_event jsonb; v_payload jsonb; v_child jsonb; v_source_id uuid; v_parent_id uuid;
  v_accepted jsonb := '[]'::jsonb; v_duplicates jsonb := '[]'::jsonb; v_rejected jsonb := '[]'::jsonb;
begin
  for v_event in select value from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) loop
    v_source_id := null;
    begin
      v_source_id := (v_event->>'event_id')::uuid;
      if exists (select 1 from character_sales where source_event_id = v_source_id) then v_duplicates := v_duplicates || to_jsonb(v_source_id::text); continue; end if;
      v_payload := v_event->'payload';
      insert into character_sales (source_event_id, schema_version, server_job_id, place_id, occurred_at, player_name, player_id, sale_type, total_cash_received, total_sold, created_at)
      values (v_source_id, (v_event->>'schema_version')::integer, v_event->>'server_job_id', (v_event->>'place_id')::bigint, (v_event->>'occurred_at')::timestamptz,
        v_payload->>'player_name', (v_payload->>'player_id')::bigint, v_payload->>'sale_type', (v_payload->>'total_cash_received')::bigint,
        (v_payload->>'total_sold')::integer, (v_event->>'occurred_at')::timestamptz) returning id into v_parent_id;
      for v_child in select value from jsonb_array_elements(coalesce(v_payload->'characters', '[]'::jsonb)) loop
        insert into sale_characters (sale_id, character_name, character_id, level, mutation, trait, cash_received)
        values (v_parent_id, v_child->>'character_name', v_child->>'character_id', (v_child->>'level')::integer, v_child->>'mutation', v_child->>'trait', (v_child->>'cash_received')::bigint);
      end loop;
      v_accepted := v_accepted || to_jsonb(v_source_id::text);
    exception when unique_violation then
      if exists (select 1 from character_sales where source_event_id = v_source_id) then
        v_duplicates := v_duplicates || to_jsonb(v_source_id::text);
      else
        raise;
      end if;
    when data_exception or not_null_violation or foreign_key_violation or check_violation then
      v_rejected := v_rejected || jsonb_build_object('event_id', coalesce(v_source_id::text, v_event->>'event_id'), 'reason', sqlerrm); end;
  end loop;
  return jsonb_build_object('accepted_event_ids', v_accepted, 'duplicate_event_ids', v_duplicates, 'rejected', v_rejected);
end; $$;

create or replace function public.ingest_gifts(p_events jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_event jsonb; v_payload jsonb; v_source_id uuid;
  v_accepted jsonb := '[]'::jsonb; v_duplicates jsonb := '[]'::jsonb; v_rejected jsonb := '[]'::jsonb;
begin
  for v_event in select value from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) loop
    v_source_id := null;
    begin
      v_source_id := (v_event->>'event_id')::uuid;
      if exists (select 1 from gift_logs where source_event_id = v_source_id) then v_duplicates := v_duplicates || to_jsonb(v_source_id::text); continue; end if;
      v_payload := v_event->'payload';
      insert into gift_logs (source_event_id, schema_version, server_job_id, place_id, occurred_at, giver_name, giver_id, receiver_name, receiver_id, character_name, character_id, level, mutation, trait, created_at)
      values (v_source_id, (v_event->>'schema_version')::integer, v_event->>'server_job_id', (v_event->>'place_id')::bigint, (v_event->>'occurred_at')::timestamptz,
        v_payload->>'giver_name', (v_payload->>'giver_id')::bigint, v_payload->>'receiver_name', (v_payload->>'receiver_id')::bigint,
        v_payload->>'character_name', v_payload->>'character_id', (v_payload->>'level')::integer, v_payload->>'mutation', v_payload->>'trait', (v_event->>'occurred_at')::timestamptz);
      v_accepted := v_accepted || to_jsonb(v_source_id::text);
    exception when unique_violation then
      if exists (select 1 from gift_logs where source_event_id = v_source_id) then
        v_duplicates := v_duplicates || to_jsonb(v_source_id::text);
      else
        raise;
      end if;
    when data_exception or not_null_violation or foreign_key_violation or check_violation then
      v_rejected := v_rejected || jsonb_build_object('event_id', coalesce(v_source_id::text, v_event->>'event_id'), 'reason', sqlerrm); end;
  end loop;
  return jsonb_build_object('accepted_event_ids', v_accepted, 'duplicate_event_ids', v_duplicates, 'rejected', v_rejected);
end; $$;

create or replace function public.ingest_purchases(p_events jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_event jsonb; v_payload jsonb; v_source_id uuid;
  v_accepted jsonb := '[]'::jsonb; v_duplicates jsonb := '[]'::jsonb; v_rejected jsonb := '[]'::jsonb;
begin
  for v_event in select value from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) loop
    v_source_id := null;
    begin
      v_source_id := (v_event->>'event_id')::uuid;
      if exists (select 1 from product_purchases where source_event_id = v_source_id) then v_duplicates := v_duplicates || to_jsonb(v_source_id::text); continue; end if;
      v_payload := v_event->'payload';
      insert into product_purchases (source_event_id, schema_version, server_job_id, place_id, occurred_at, purchase_id, player_name, player_id, product_name, robux_spent, created_at)
      values (v_source_id, (v_event->>'schema_version')::integer, v_event->>'server_job_id', (v_event->>'place_id')::bigint, (v_event->>'occurred_at')::timestamptz,
        nullif(v_payload->>'purchase_id', ''), v_payload->>'player_name', (v_payload->>'player_id')::bigint, v_payload->>'product_name',
        (v_payload->>'robux_spent')::integer, (v_event->>'occurred_at')::timestamptz);
      v_accepted := v_accepted || to_jsonb(v_source_id::text);
    exception when unique_violation then
      if exists (select 1 from product_purchases where source_event_id = v_source_id)
        or (
          nullif(v_payload->>'purchase_id', '') is not null
          and exists (
            select 1 from product_purchases
            where purchase_id = nullif(v_payload->>'purchase_id', '')
          )
        )
      then
        v_duplicates := v_duplicates || to_jsonb(v_source_id::text);
      else
        raise;
      end if;
    when data_exception or not_null_violation or foreign_key_violation or check_violation then
      v_rejected := v_rejected || jsonb_build_object('event_id', coalesce(v_source_id::text, v_event->>'event_id'), 'reason', sqlerrm); end;
  end loop;
  return jsonb_build_object('accepted_event_ids', v_accepted, 'duplicate_event_ids', v_duplicates, 'rejected', v_rejected);
end; $$;

create or replace function public.ingest_security_events(p_events jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_event jsonb; v_payload jsonb; v_source_id uuid;
  v_accepted jsonb := '[]'::jsonb; v_duplicates jsonb := '[]'::jsonb; v_rejected jsonb := '[]'::jsonb;
begin
  for v_event in select value from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) loop
    v_source_id := null;
    begin
      v_source_id := (v_event->>'event_id')::uuid;
      if exists (select 1 from security_events where source_event_id = v_source_id) then v_duplicates := v_duplicates || to_jsonb(v_source_id::text); continue; end if;
      v_payload := v_event->'payload';
      insert into security_events (source_event_id, schema_version, server_job_id, place_id, occurred_at, category, severity, player_id, player_name, details)
      values (v_source_id, (v_event->>'schema_version')::integer, v_event->>'server_job_id', (v_event->>'place_id')::bigint, (v_event->>'occurred_at')::timestamptz,
        v_payload->>'category', v_payload->>'severity', nullif(v_payload->>'player_id', '')::bigint, v_payload->>'player_name', coalesce(v_payload->'details', '{}'::jsonb));
      v_accepted := v_accepted || to_jsonb(v_source_id::text);
    exception when unique_violation then
      if exists (select 1 from security_events where source_event_id = v_source_id) then
        v_duplicates := v_duplicates || to_jsonb(v_source_id::text);
      else
        raise;
      end if;
    when data_exception or not_null_violation or foreign_key_violation or check_violation then
      v_rejected := v_rejected || jsonb_build_object('event_id', coalesce(v_source_id::text, v_event->>'event_id'), 'reason', sqlerrm); end;
  end loop;
  return jsonb_build_object('accepted_event_ids', v_accepted, 'duplicate_event_ids', v_duplicates, 'rejected', v_rejected);
end; $$;

revoke all on function public.ingest_player_events(jsonb) from public, anon, authenticated;
revoke all on function public.ingest_player_snapshots(jsonb) from public, anon, authenticated;
revoke all on function public.ingest_sales(jsonb) from public, anon, authenticated;
revoke all on function public.ingest_gifts(jsonb) from public, anon, authenticated;
revoke all on function public.ingest_purchases(jsonb) from public, anon, authenticated;
revoke all on function public.ingest_security_events(jsonb) from public, anon, authenticated;

grant execute on function public.ingest_player_events(jsonb) to service_role;
grant execute on function public.ingest_player_snapshots(jsonb) to service_role;
grant execute on function public.ingest_sales(jsonb) to service_role;
grant execute on function public.ingest_gifts(jsonb) to service_role;
grant execute on function public.ingest_purchases(jsonb) to service_role;
grant execute on function public.ingest_security_events(jsonb) to service_role;
