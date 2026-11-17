-- =============================================================================
-- Coffie Mood: multi-tenant schema
-- Every tenant-owned row carries shop_id. Row Level Security (RLS) is enabled on
-- every table; anonymous visitors can only read published shop data and can only
-- write through narrowly-scoped SECURITY DEFINER functions that validate input.
-- No facial imagery or biometric data is ever stored: only the mood *label*.
-- =============================================================================

create type public.mood as enum ('happy', 'sad', 'stressed', 'angry', 'tired', 'excited', 'calm', 'neutral');
create type public.member_role as enum ('owner', 'manager', 'staff');
create type public.order_status as enum ('new', 'preparing', 'ready', 'completed', 'cancelled');

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.shops (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique
                     check (slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'),
  name             text not null check (char_length(name) between 2 and 80),
  tagline          text check (char_length(tagline) <= 140),
  welcome_message  text check (char_length(welcome_message) <= 280),
  logo_url         text,
  primary_color    text not null default '#6f4e37' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  accent_color     text not null default '#d9894a' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  currency         text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  camera_enabled   boolean not null default true,
  is_published     boolean not null default true,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.shop_members (
  shop_id    uuid not null references public.shops (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);
create index shop_members_user_idx on public.shop_members (user_id);

create table public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 80),
  description   text not null default '' check (char_length(description) <= 400),
  category      text not null default 'Coffee' check (char_length(category) <= 40),
  image_url     text,
  -- [{ "label": "Small", "price": 3.5 }, ...]
  sizes         jsonb not null default '[{"label":"Regular","price":4}]'::jsonb
                  check (jsonb_typeof(sizes) = 'array' and jsonb_array_length(sizes) between 1 and 6),
  temperatures  text[] not null default '{hot}'
                  check (cardinality(temperatures) > 0 and temperatures <@ array['hot', 'iced']),
  caffeine_mg   integer check (caffeine_mg between 0 and 1000),
  tags          text[] not null default '{}',
  is_available  boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, shop_id)
);
create index menu_items_shop_idx on public.menu_items (shop_id, sort_order);

create table public.mood_rules (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops (id) on delete cascade,
  mood          public.mood not null,
  menu_item_id  uuid not null,
  rank          integer not null default 0,
  reason        text check (char_length(reason) <= 240),
  created_at    timestamptz not null default now(),
  unique (shop_id, mood, menu_item_id),
  -- composite FK guarantees a rule can only point at the same shop's menu
  foreign key (menu_item_id, shop_id) references public.menu_items (id, shop_id) on delete cascade
);
create index mood_rules_shop_mood_idx on public.mood_rules (shop_id, mood, rank);

create table public.mood_messages (
  shop_id  uuid not null references public.shops (id) on delete cascade,
  mood     public.mood not null,
  message  text not null check (char_length(message) between 1 and 280),
  primary key (shop_id, mood)
);

create table public.interactions (
  id                   uuid primary key default gen_random_uuid(),
  shop_id              uuid not null references public.shops (id) on delete cascade,
  method               text not null check (method in ('camera', 'manual')),
  detected_mood        public.mood,
  confirmed_mood       public.mood not null,
  recommended_item_id  uuid references public.menu_items (id) on delete set null,
  selected_item_id     uuid references public.menu_items (id) on delete set null,
  accepted             boolean,
  alternatives_viewed  integer not null default 0 check (alternatives_viewed between 0 and 100),
  created_at           timestamptz not null default now(),
  completed_at         timestamptz
);
create index interactions_shop_created_idx on public.interactions (shop_id, created_at desc);

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  shop_id         uuid not null references public.shops (id) on delete cascade,
  order_code      text not null,
  customer_name   text check (char_length(customer_name) <= 60),
  mood            public.mood,
  interaction_id  uuid references public.interactions (id) on delete set null,
  items           jsonb not null,
  total           numeric(10, 2) not null check (total >= 0),
  currency        text not null,
  status          public.order_status not null default 'new',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index orders_shop_created_idx on public.orders (shop_id, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger shops_touch before update on public.shops
  for each row execute function public.touch_updated_at();
create trigger menu_items_touch before update on public.menu_items
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Authorization helpers
-- -----------------------------------------------------------------------------
create or replace function public.has_shop_role(
  p_shop_id uuid,
  p_roles public.member_role[] default array['owner', 'manager', 'staff']::public.member_role[]
) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.shop_members m
    where m.shop_id = p_shop_id
      and m.user_id = (select auth.uid())
      and m.role = any (p_roles)
  );
$$;

create or replace function public.is_shop_public(p_shop_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.shops s where s.id = p_shop_id and s.is_published);
$$;

-- Storage paths are "<shop_id>/<file>"; only owners/managers of that shop may write.
create or replace function public.can_manage_storage_path(p_name text)
returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_folder text := split_part(p_name, '/', 1);
begin
  if v_folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.has_shop_role(v_folder::uuid, array['owner', 'manager']::public.member_role[]);
end;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.shops         enable row level security;
alter table public.shop_members  enable row level security;
alter table public.menu_items    enable row level security;
alter table public.mood_rules    enable row level security;
alter table public.mood_messages enable row level security;
alter table public.interactions  enable row level security;
alter table public.orders        enable row level security;

-- shops: public can read published shops; members read their own; managers edit; owners delete.
-- Creation goes through create_shop() so the creator is atomically made owner.
create policy shops_select on public.shops for select
  using (is_published or public.has_shop_role(id));
create policy shops_update on public.shops for update to authenticated
  using (public.has_shop_role(id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_shop_role(id, array['owner', 'manager']::public.member_role[]));
create policy shops_delete on public.shops for delete to authenticated
  using (public.has_shop_role(id, array['owner']::public.member_role[]));

-- shop_members: members see their team; owners manage the team (not themselves).
create policy members_select on public.shop_members for select to authenticated
  using (user_id = (select auth.uid()) or public.has_shop_role(shop_id));
create policy members_update on public.shop_members for update to authenticated
  using (public.has_shop_role(shop_id, array['owner']::public.member_role[]) and user_id <> (select auth.uid()))
  with check (public.has_shop_role(shop_id, array['owner']::public.member_role[]));
create policy members_delete on public.shop_members for delete to authenticated
  using (public.has_shop_role(shop_id, array['owner']::public.member_role[]) and user_id <> (select auth.uid()));

-- menu_items: public sees available items of published shops; members see all; managers edit.
create policy menu_select on public.menu_items for select
  using ((is_available and public.is_shop_public(shop_id)) or public.has_shop_role(shop_id));
create policy menu_insert on public.menu_items for insert to authenticated
  with check (public.has_shop_role(shop_id, array['owner', 'manager']::public.member_role[]));
create policy menu_update on public.menu_items for update to authenticated
  using (public.has_shop_role(shop_id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_shop_role(shop_id, array['owner', 'manager']::public.member_role[]));
create policy menu_delete on public.menu_items for delete to authenticated
  using (public.has_shop_role(shop_id, array['owner', 'manager']::public.member_role[]));

-- mood_rules / mood_messages: same pattern.
create policy rules_select on public.mood_rules for select
  using (public.is_shop_public(shop_id) or public.has_shop_role(shop_id));
create policy rules_write on public.mood_rules for all to authenticated
  using (public.has_shop_role(shop_id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_shop_role(shop_id, array['owner', 'manager']::public.member_role[]));

create policy messages_select on public.mood_messages for select
  using (public.is_shop_public(shop_id) or public.has_shop_role(shop_id));
create policy messages_write on public.mood_messages for all to authenticated
  using (public.has_shop_role(shop_id, array['owner', 'manager']::public.member_role[]))
  with check (public.has_shop_role(shop_id, array['owner', 'manager']::public.member_role[]));

-- interactions: readable by members only; written only via log_/complete_interaction().
create policy interactions_select on public.interactions for select to authenticated
  using (public.has_shop_role(shop_id));

-- orders: members read and update status; created only via place_order().
create policy orders_select on public.orders for select to authenticated
  using (public.has_shop_role(shop_id));
create policy orders_update on public.orders for update to authenticated
  using (public.has_shop_role(shop_id))
  with check (public.has_shop_role(shop_id));

-- -----------------------------------------------------------------------------
-- Starter menu (used by create_shop and the demo seed)
-- -----------------------------------------------------------------------------
create or replace function public.seed_starter_menu(p_shop_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.menu_items (shop_id, name, description, category, sizes, temperatures, caffeine_mg, tags, sort_order)
  values
    (p_shop_id, 'Caramel Macchiato', 'Velvety steamed milk marked with espresso and finished with a buttery caramel drizzle.', 'Espresso Bar',
      '[{"label":"Small","price":4.25},{"label":"Medium","price":4.95},{"label":"Large","price":5.55}]', '{hot,iced}', 150, '{sweet,creamy,celebratory}', 1),
    (p_shop_id, 'Hot Chocolate Mocha', 'Rich dark chocolate melted into espresso and steamed milk, crowned with soft cream.', 'Espresso Bar',
      '[{"label":"Small","price":4.45},{"label":"Medium","price":5.15},{"label":"Large","price":5.75}]', '{hot}', 95, '{comforting,chocolate,sweet,creamy}', 2),
    (p_shop_id, 'Vanilla Latte', 'Smooth espresso and silky milk with a gentle touch of Madagascar vanilla.', 'Espresso Bar',
      '[{"label":"Small","price":4.15},{"label":"Medium","price":4.85},{"label":"Large","price":5.45}]', '{hot,iced}', 130, '{soothing,creamy,mellow}', 3),
    (p_shop_id, 'Double Espresso', 'Two bold, syrupy shots pulled from our house blend. Short, intense, and bright.', 'Espresso Bar',
      '[{"label":"Doppio","price":3.25}]', '{hot}', 130, '{energizing,strong,bold}', 4),
    (p_shop_id, 'Iced Caramel Latte', 'Chilled espresso over ice with cold milk and a ribbon of golden caramel.', 'Cold Bar',
      '[{"label":"Medium","price":5.05},{"label":"Large","price":5.65}]', '{iced}', 150, '{iced,sweet,celebratory,refreshing}', 5),
    (p_shop_id, 'Classic Cappuccino', 'Equal parts espresso, steamed milk and airy foam. Balanced and timeless.', 'Espresso Bar',
      '[{"label":"Small","price":3.95},{"label":"Medium","price":4.55}]', '{hot}', 130, '{balanced,mellow,classic}', 6),
    (p_shop_id, 'Americano', 'Espresso lengthened with hot water for a clean, steady, easy-going cup.', 'Espresso Bar',
      '[{"label":"Small","price":3.25},{"label":"Medium","price":3.75},{"label":"Large","price":4.25}]', '{hot,iced}', 150, '{classic,balanced,light}', 7),
    (p_shop_id, 'Chamomile Honey Latte', 'Caffeine-free chamomile steeped in steamed milk and sweetened with wildflower honey.', 'Tea & More',
      '[{"label":"Small","price":4.05},{"label":"Medium","price":4.65}]', '{hot}', 0, '{soothing,caffeine-free,comforting}', 8),
    (p_shop_id, 'Cold Brew', 'Steeped for 18 hours for a smooth, chocolatey, low-acid pick-me-up.', 'Cold Bar',
      '[{"label":"Medium","price":4.45},{"label":"Large","price":4.95}]', '{iced}', 200, '{energizing,iced,refreshing,strong}', 9);

  insert into public.mood_rules (shop_id, mood, menu_item_id, rank, reason)
  select p_shop_id, r.mood::public.mood, m.id, r.rank, r.reason
  from (values
    ('happy',    'Caramel Macchiato',     0, 'A sweet, celebratory cup to match the smile.'),
    ('happy',    'Iced Caramel Latte',    1, 'Bright and fun, just like your mood.'),
    ('sad',      'Hot Chocolate Mocha',   0, 'Warm chocolate is a classic little comfort.'),
    ('sad',      'Chamomile Honey Latte', 1, 'Gentle, cosy and caffeine-free.'),
    ('stressed', 'Vanilla Latte',         0, 'Smooth and mellow, to help you slow down for a moment.'),
    ('stressed', 'Chamomile Honey Latte', 1, 'A soothing, caffeine-free pause.'),
    ('angry',    'Cold Brew',             0, 'Cool and smooth, to help you take the heat down a notch.'),
    ('angry',    'Chamomile Honey Latte', 1, 'A calming, caffeine-free breather.'),
    ('tired',    'Double Espresso',       0, 'Bold and concentrated for a quick lift.'),
    ('tired',    'Cold Brew',             1, 'Smooth, strong and long-lasting.'),
    ('excited',  'Iced Caramel Latte',    0, 'Cool, sweet and full of energy.'),
    ('excited',  'Caramel Macchiato',     1, 'A little treat to keep the good vibes going.'),
    ('calm',     'Classic Cappuccino',    0, 'Balanced and unhurried, for a peaceful moment.'),
    ('calm',     'Vanilla Latte',         1, 'Soft and smooth to keep things easy.'),
    ('neutral',  'Americano',             0, 'A clean, dependable cup that fits any moment.'),
    ('neutral',  'Classic Cappuccino',    1, 'A timeless favourite.')
  ) as r(mood, name, rank, reason)
  join public.menu_items m on m.shop_id = p_shop_id and m.name = r.name;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: create a shop and make the caller its owner
-- -----------------------------------------------------------------------------
create or replace function public.create_shop(p_name text, p_slug text, p_with_starter_menu boolean default true)
returns public.shops
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_shop public.shops;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if (select count(*) from public.shop_members where user_id = v_uid and role = 'owner') >= 10 then
    raise exception 'Shop limit reached' using errcode = 'P0001';
  end if;

  insert into public.shops (name, slug, created_by)
  values (trim(p_name), lower(trim(p_slug)), v_uid)
  returning * into v_shop;

  insert into public.shop_members (shop_id, user_id, role) values (v_shop.id, v_uid, 'owner');

  if p_with_starter_menu then
    perform public.seed_starter_menu(v_shop.id);
  end if;
  return v_shop;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: team management (needs auth.users lookup, so SECURITY DEFINER)
-- -----------------------------------------------------------------------------
create or replace function public.list_shop_members(p_shop_id uuid)
returns table (user_id uuid, email text, role public.member_role, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_shop_role(p_shop_id) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  return query
    select m.user_id, u.email::text, m.role, m.created_at
    from public.shop_members m join auth.users u on u.id = m.user_id
    where m.shop_id = p_shop_id
    order by m.created_at;
end;
$$;

create or replace function public.add_shop_member(p_shop_id uuid, p_email text, p_role public.member_role)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
begin
  if not public.has_shop_role(p_shop_id, array['owner']::public.member_role[]) then
    raise exception 'Only owners can add team members' using errcode = '42501';
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'No Coffie Mood account uses that email yet. Ask them to sign up first.' using errcode = 'P0002';
  end if;
  if v_user = (select auth.uid()) then
    raise exception 'You are already the owner of this shop.';
  end if;
  insert into public.shop_members (shop_id, user_id, role) values (p_shop_id, v_user, p_role)
  on conflict (shop_id, user_id) do update set role = excluded.role;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: anonymous customer events (validated, no raw table access)
-- -----------------------------------------------------------------------------
create or replace function public.log_interaction(
  p_shop_id uuid,
  p_method text,
  p_detected_mood public.mood,
  p_confirmed_mood public.mood,
  p_recommended_item_id uuid
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if not public.is_shop_public(p_shop_id) then
    raise exception 'Shop not found' using errcode = 'P0002';
  end if;
  if p_method not in ('camera', 'manual') then
    raise exception 'Invalid method';
  end if;
  if p_recommended_item_id is not null and not exists (
    select 1 from public.menu_items where id = p_recommended_item_id and shop_id = p_shop_id
  ) then
    raise exception 'Invalid item';
  end if;

  insert into public.interactions (shop_id, method, detected_mood, confirmed_mood, recommended_item_id)
  values (p_shop_id, p_method, case when p_method = 'camera' then p_detected_mood end, p_confirmed_mood, p_recommended_item_id)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.complete_interaction(
  p_interaction_id uuid,
  p_selected_item_id uuid,
  p_accepted boolean,
  p_alternatives_viewed integer
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.interactions i
     set selected_item_id    = p_selected_item_id,
         accepted            = p_accepted,
         alternatives_viewed = least(greatest(coalesce(p_alternatives_viewed, 0), 0), 100),
         completed_at        = now()
   where i.id = p_interaction_id
     and i.completed_at is null
     and i.created_at > now() - interval '3 hours'
     and (p_selected_item_id is null or exists (
       select 1 from public.menu_items m where m.id = p_selected_item_id and m.shop_id = i.shop_id
     ));
end;
$$;

-- Prices are always recomputed server-side from the menu; client prices are ignored.
create or replace function public.place_order(
  p_shop_id uuid,
  p_items jsonb,
  p_customer_name text default null,
  p_mood public.mood default null,
  p_interaction_id uuid default null
) returns table (order_id uuid, order_code text, total numeric)
language plpgsql security definer set search_path = '' as $$
declare
  v_shop public.shops;
  v_line jsonb;
  v_item public.menu_items;
  v_size jsonb;
  v_qty integer;
  v_temp text;
  v_lines jsonb := '[]'::jsonb;
  v_total numeric(10, 2) := 0;
  v_code text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_order_id uuid;
begin
  select * into v_shop from public.shops s where s.id = p_shop_id and s.is_published;
  if v_shop.id is null then
    raise exception 'Shop not found' using errcode = 'P0002';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 20 then
    raise exception 'Your cart is empty or too large';
  end if;

  for v_line in select * from jsonb_array_elements(p_items) loop
    v_item := null;
    v_size := null;
    select * into v_item from public.menu_items m
      where m.id = (v_line ->> 'menu_item_id')::uuid and m.shop_id = p_shop_id and m.is_available;
    if v_item.id is null then
      raise exception 'An item in your cart is no longer available';
    end if;

    select s into v_size from jsonb_array_elements(v_item.sizes) s
      where s ->> 'label' = v_line ->> 'size' limit 1;
    if v_size is null then
      raise exception 'Invalid size for %', v_item.name;
    end if;

    v_temp := coalesce(v_line ->> 'temperature', v_item.temperatures[1]);
    if not (v_temp = any (v_item.temperatures)) then
      raise exception '% is not available %', v_item.name, v_temp;
    end if;

    v_qty := coalesce((v_line ->> 'quantity')::integer, 1);
    if v_qty < 1 or v_qty > 20 then
      raise exception 'Invalid quantity';
    end if;

    v_total := v_total + (v_size ->> 'price')::numeric * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'menu_item_id', v_item.id,
      'name', v_item.name,
      'size', v_size ->> 'label',
      'temperature', v_temp,
      'quantity', v_qty,
      'unit_price', (v_size ->> 'price')::numeric
    );
  end loop;

  insert into public.orders (shop_id, order_code, customer_name, mood, interaction_id, items, total, currency)
  values (
    p_shop_id, v_code, nullif(left(trim(p_customer_name), 60), ''), p_mood,
    (select i.id from public.interactions i where i.id = p_interaction_id and i.shop_id = p_shop_id),
    v_lines, v_total, v_shop.currency
  )
  returning id into v_order_id;

  return query select v_order_id, v_code, v_total;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: dashboard analytics (members only)
-- -----------------------------------------------------------------------------
create or replace function public.get_shop_analytics(p_shop_id uuid, p_days integer default 30)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365)));
  v_result jsonb;
begin
  if not public.has_shop_role(p_shop_id) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  with i as (
    select * from public.interactions x where x.shop_id = p_shop_id and x.created_at >= v_since
  )
  select jsonb_build_object(
    'total_interactions', (select count(*) from i),
    'camera_interactions', (select count(*) from i where i.method = 'camera'),
    'manual_interactions', (select count(*) from i where i.method = 'manual'),
    'completed', (select count(*) from i where i.completed_at is not null),
    'accepted', (select count(*) from i where i.accepted),
    'corrected', (select count(*) from i where i.detected_mood is not null and i.detected_mood <> i.confirmed_mood),
    'detected_moods', coalesce((
      select jsonb_agg(jsonb_build_object('mood', t.detected_mood, 'count', t.c) order by t.c desc)
      from (select i.detected_mood, count(*) c from i where i.detected_mood is not null group by 1) t), '[]'::jsonb),
    'confirmed_moods', coalesce((
      select jsonb_agg(jsonb_build_object('mood', t.confirmed_mood, 'count', t.c) order by t.c desc)
      from (select i.confirmed_mood, count(*) c from i group by 1) t), '[]'::jsonb),
    'top_recommended', coalesce((
      select jsonb_agg(jsonb_build_object('name', t.name, 'count', t.c) order by t.c desc)
      from (select m.name, count(*) c from i join public.menu_items m on m.id = i.recommended_item_id
            group by m.name order by c desc limit 6) t), '[]'::jsonb),
    'top_selected', coalesce((
      select jsonb_agg(jsonb_build_object('name', t.name, 'count', t.c) order by t.c desc)
      from (select m.name, count(*) c from i join public.menu_items m on m.id = i.selected_item_id
            where i.accepted group by m.name order by c desc limit 6) t), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.d::date, 'count', coalesce(x.c, 0)) order by d.d)
      from generate_series(date_trunc('day', greatest(v_since, now() - interval '13 days')), date_trunc('day', now()), interval '1 day') d(d)
      left join (select date_trunc('day', i.created_at) dd, count(*) c from i group by 1) x on x.dd = d.d), '[]'::jsonb),
    'orders', (select count(*) from public.orders o where o.shop_id = p_shop_id and o.created_at >= v_since and o.status <> 'cancelled'),
    'revenue', (select coalesce(sum(o.total), 0) from public.orders o where o.shop_id = p_shop_id and o.created_at >= v_since and o.status <> 'cancelled')
  ) into v_result;

  return v_result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Function privileges
-- -----------------------------------------------------------------------------
revoke execute on function public.seed_starter_menu(uuid) from public, anon, authenticated;
revoke execute on function public.create_shop(text, text, boolean) from public, anon;
grant  execute on function public.create_shop(text, text, boolean) to authenticated;
revoke execute on function public.list_shop_members(uuid) from public, anon;
grant  execute on function public.list_shop_members(uuid) to authenticated;
revoke execute on function public.add_shop_member(uuid, text, public.member_role) from public, anon;
grant  execute on function public.add_shop_member(uuid, text, public.member_role) to authenticated;
revoke execute on function public.get_shop_analytics(uuid, integer) from public, anon;
grant  execute on function public.get_shop_analytics(uuid, integer) to authenticated;
grant  execute on function public.log_interaction(uuid, text, public.mood, public.mood, uuid) to anon, authenticated;
grant  execute on function public.complete_interaction(uuid, uuid, boolean, integer) to anon, authenticated;
grant  execute on function public.place_order(uuid, jsonb, text, public.mood, uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Storage: public-read bucket for logos and menu photos, tenant-scoped writes
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-assets', 'shop-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy shop_assets_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'shop-assets' and public.can_manage_storage_path(name));
create policy shop_assets_update on storage.objects for update to authenticated
  using (bucket_id = 'shop-assets' and public.can_manage_storage_path(name))
  with check (bucket_id = 'shop-assets' and public.can_manage_storage_path(name));
create policy shop_assets_delete on storage.objects for delete to authenticated
  using (bucket_id = 'shop-assets' and public.can_manage_storage_path(name));

-- -----------------------------------------------------------------------------
-- RPC: atomically replace one mood's rules and message (runs as the caller, so RLS applies)
-- -----------------------------------------------------------------------------
create or replace function public.save_mood_config(p_shop_id uuid, p_mood public.mood, p_rules jsonb, p_message text)
returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.has_shop_role(p_shop_id, array['owner', 'manager']::public.member_role[]) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rules) <> 'array' or jsonb_array_length(p_rules) > 12 then
    raise exception 'Up to 12 drinks per mood';
  end if;

  delete from public.mood_rules r where r.shop_id = p_shop_id and r.mood = p_mood;

  insert into public.mood_rules (shop_id, mood, menu_item_id, rank, reason)
  select p_shop_id, p_mood, (t.r ->> 'menu_item_id')::uuid, (t.ord - 1)::integer, nullif(left(trim(t.r ->> 'reason'), 240), '')
  from jsonb_array_elements(p_rules) with ordinality as t(r, ord);

  if nullif(trim(coalesce(p_message, '')), '') is null then
    delete from public.mood_messages m where m.shop_id = p_shop_id and m.mood = p_mood;
  else
    insert into public.mood_messages (shop_id, mood, message)
    values (p_shop_id, p_mood, left(trim(p_message), 280))
    on conflict (shop_id, mood) do update set message = excluded.message;
  end if;
end;
$$;

revoke execute on function public.save_mood_config(uuid, public.mood, jsonb, text) from public, anon;
grant  execute on function public.save_mood_config(uuid, public.mood, jsonb, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Column-level hardening: RLS decides *which rows*, these grants decide *which columns*.
-- Staff may move an order through its statuses but never change items or totals,
-- and team edits may only change a member's role.
-- -----------------------------------------------------------------------------
revoke insert, update on public.orders from anon, authenticated;
grant  update (status) on public.orders to authenticated;
revoke insert, update on public.interactions from anon, authenticated;
revoke insert, update on public.shop_members from anon, authenticated;
grant  update (role) on public.shop_members to authenticated;
revoke insert, update on public.shops from anon, authenticated;
grant  update (slug, name, tagline, welcome_message, logo_url, primary_color, accent_color, currency, camera_enabled, is_published)
  on public.shops to authenticated;
