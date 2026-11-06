-- Supabase Dashboard > SQL Editor mein ye poora paste karke Run karein

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hs_code text,
  description text,
  packing text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  name text,
  company text,
  contact text,
  country text,
  product text,
  quantity text,
  details text,
  created_at timestamptz default now()
);

alter table categories enable row level security;
alter table products enable row level security;
alter table inquiries enable row level security;

-- Public visitors: catalogue sirf padh sakte hain
create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (active = true);

-- Public visitors: sirf inquiry bhej sakte hain
create policy "public send inquiry" on inquiries for insert with check (true);

-- Logged-in admin: sab kuch
create policy "admin all categories" on categories for all to authenticated using (true) with check (true);
create policy "admin all products" on products for all to authenticated using (true) with check (true);
create policy "admin read inquiries" on inquiries for select to authenticated using (true);
create policy "admin delete inquiries" on inquiries for delete to authenticated using (true);

-- Image storage
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public view images" on storage.objects for select using (bucket_id = 'product-images');
create policy "admin upload images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images');
create policy "admin update images" on storage.objects for update to authenticated using (bucket_id = 'product-images');
create policy "admin delete images" on storage.objects for delete to authenticated using (bucket_id = 'product-images');

-- Starting data
insert into categories (name, hs_code, description, packing, sort_order) values
('Clothes', 'HS 61 · 62 · 63', 'Everyday and ethnic wear for retail and wholesale buyers.', 'Cartons, assorted by size', 1),
('Rice', 'HS 1006', 'Long grain and everyday rice in bagged packs.', '5 kg to 50 kg bags', 2),
('Spices', 'HS 09', 'Whole and ground spices, cleaned and packed for export.', '1 kg to 25 kg packs', 3);

insert into products (category_id, name, sort_order)
select c.id, p.name, p.o from categories c join (values
  ('Clothes','Cotton T-shirts and polos',1),
  ('Clothes','Kurtas and ethnic wear',2),
  ('Clothes','Shirts and trousers',3),
  ('Clothes','Bed linen and towels',4),
  ('Rice','Parboiled non-basmati',1),
  ('Rice','White raw rice',2),
  ('Spices','Red chilli',1),
  ('Spices','Cardamom',2),
  ('Spices','Coriander seed',3)
) as p(cat,name,o) on p.cat = c.name;
