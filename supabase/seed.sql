-- Optional demo tenants for local development (`supabase db reset` runs this).
-- They have no owner; sign up and create your own shop to manage one.
do $$
declare
  v_shop uuid;
begin
  insert into public.shops (slug, name, tagline, primary_color, accent_color)
  values ('coffee-house', 'The Coffee House', 'Slow mornings, warm cups.', '#6f4e37', '#d9894a')
  returning id into v_shop;
  perform public.seed_starter_menu(v_shop);

  insert into public.shops (slug, name, tagline, primary_color, accent_color)
  values ('mocha-cafe', 'Mocha Café', 'Chocolate, espresso and good company.', '#4a2c2a', '#c8743c')
  returning id into v_shop;
  perform public.seed_starter_menu(v_shop);

  insert into public.shops (slug, name, tagline, primary_color, accent_color)
  values ('urban-brews', 'Urban Brews', 'City energy in every cup.', '#2f3b3a', '#e0a050')
  returning id into v_shop;
  perform public.seed_starter_menu(v_shop);
  -- Show that menus are per-shop: Urban Brews doesn't serve the mocha.
  update public.menu_items set is_available = false where shop_id = v_shop and name = 'Hot Chocolate Mocha';
end $$;
