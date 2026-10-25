create table if not exists clients (
  id serial primary key,
  name text not null,
  dni_cuit text not null unique,
  client_type text not null,
  phone text not null default '',
  address text not null default '',
  email text not null default '',
  ekopuntos integer not null default 0,
  status text not null default 'activo',
  deactivated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists hardware_types (
  id serial primary key,
  name text not null,
  description text not null default '',
  ekp_per_kg integer not null,
  copper_kg_per_kg numeric(6, 3) not null default 0,
  silicon_kg_per_kg numeric(6, 3) not null default 0,
  gold_g_per_kg numeric(6, 3) not null default 0
);

create table if not exists articles (
  id serial primary key,
  description text not null,
  category text not null,
  cost_ekp integer not null,
  stock integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists deliveries (
  id serial primary key,
  client_id integer not null references clients(id),
  hardware_type_id integer not null references hardware_types(id),
  weight_kg numeric(10, 2) not null,
  ekp_generated integer not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists redemptions (
  id serial primary key,
  client_id integer not null references clients(id),
  article_id integer not null references articles(id),
  quantity integer not null,
  ekp_total integer not null,
  status text not null default 'pendiente',
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tickets (
  id serial primary key,
  operation_type text not null,
  operation_id integer not null,
  summary text not null,
  client_name text not null,
  ekp_amount integer not null,
  created_at timestamptz not null default now()
);

create index if not exists deliveries_client_idx on deliveries (client_id);
create index if not exists redemptions_client_idx on redemptions (client_id);
create index if not exists tickets_created_idx on tickets (created_at desc);

insert into hardware_types (name, description, ekp_per_kg, copper_kg_per_kg, silicon_kg_per_kg, gold_g_per_kg)
select * from (values
  ('Placa Madre / Tarjetas Lógicas', 'Motherboards, lógica y controladoras', 500, 0.200, 0.050, 0.250),
  ('CPU & Procesadores', 'Microprocesadores y sockets', 400, 0.150, 0.280, 0.350),
  ('Placas de Video / GPU', 'Tarjetas gráficas y aceleradoras', 350, 0.220, 0.120, 0.200),
  ('Cables & Transformadores', 'Harness, fuentes y cableado de cobre', 50, 0.450, 0.000, 0.000),
  ('Periféricos & Monitores', 'Teclados, ratones, CRT/LCD y gabinetes', 50, 0.080, 0.020, 0.020)
) as v(name, description, ekp_per_kg, copper_kg_per_kg, silicon_kg_per_kg, gold_g_per_kg)
where not exists (select 1 from hardware_types);

insert into clients (name, dni_cuit, client_type, phone, address, email, ekopuntos, status, deactivated_at, created_at)
select * from (values
  ('Escuela Técnica N°1 San José', '30-68901234-8', 'escuela', '3838-421001', 'Av. Las Golondrinas s/n', 'tecnica1@sanjose.edu.ar', 1230, 'activo', null::timestamptz, timestamptz '2026-03-12 09:10:00+00'),
  ('Colegio Polimodal San José', '30-71234567-2', 'escuela', '3838-421005', 'Calle Belgrano 450', 'polimodal@sanjose.edu.ar', 1800, 'activo', null::timestamptz, timestamptz '2026-03-18 11:00:00+00'),
  ('Centro Vecinal Zona Norte', '20-28491923-4', 'particular', '3838-429911', 'Barrio Jardín Mza B', 'zonanorte@vecinal.org', 400, 'activo', null::timestamptz, timestamptz '2026-04-02 15:20:00+00'),
  ('Instituto Formación Técnica', '30-55123987-1', 'escuela', '3838-420099', 'Ruta 40 km 12', 'ift@catamarca.edu.ar', 0, 'inactivo', timestamptz '2026-08-20 12:00:00+00', timestamptz '2026-02-04 10:00:00+00')
) as v(name, dni_cuit, client_type, phone, address, email, ekopuntos, status, deactivated_at, created_at)
where not exists (select 1 from clients);

insert into articles (description, category, cost_ekp, stock, active, created_at)
select * from (values
  ('Arduino Uno R3', 'Kits Robótica', 1000, 8, true, timestamptz '2026-01-10 12:00:00+00'),
  ('Sensor de Humedad y Temperatura DHT11', 'Sensores', 250, 15, true, timestamptz '2026-01-10 12:00:00+00'),
  ('Sensor Ultrasonido HC-SR04', 'Sensores', 200, 12, true, timestamptz '2026-01-10 12:00:00+00'),
  ('Servomotor SG90', 'Actuadores', 180, 20, true, timestamptz '2026-01-12 12:00:00+00'),
  ('Protoboard con cables', 'Kits Robótica', 300, 10, true, timestamptz '2026-01-12 12:00:00+00'),
  ('Kit de inicio de Robótica Escolar', 'Kits Robótica', 3500, 3, true, timestamptz '2026-01-20 12:00:00+00'),
  ('Kit Arduino Uno R3 + Sensores Básicos', 'Kits Robótica', 1500, 6, true, timestamptz '2026-02-02 12:00:00+00')
) as v(description, category, cost_ekp, stock, active, created_at)
where not exists (select 1 from articles);

insert into deliveries (client_id, hardware_type_id, weight_kg, ekp_generated, notes, created_at)
select * from (values
  (1, 1, 10.50, 5250, 'Lote de gabinetes de laboratorio — 11 placas madre', timestamptz '2026-08-14 10:30:00+00'),
  (2, 2, 4.20, 1680, 'Procesadores Intel/AMD dados de baja del aula de informática', timestamptz '2026-08-28 09:15:00+00'),
  (3, 4, 8.00, 400, 'Cables y fuentes recolectados en jornada vecinal', timestamptz '2026-09-05 16:40:00+00'),
  (1, 3, 2.80, 980, 'Placas de video de PCs de diseño', timestamptz '2026-09-12 11:05:00+00'),
  (2, 5, 12.40, 620, 'Monitores CRT y periféricos de recambio', timestamptz '2026-09-20 14:22:00+00')
) as v(client_id, hardware_type_id, weight_kg, ekp_generated, notes, created_at)
where not exists (select 1 from deliveries);

insert into redemptions (client_id, article_id, quantity, ekp_total, status, cancel_reason, created_at, updated_at)
select * from (values
  (1, 7, 1, 1500, 'entregado', null::text, timestamptz '2026-09-14 10:30:00+00', timestamptz '2026-09-14 11:00:00+00'),
  (2, 2, 2, 500, 'pendiente', null::text, timestamptz '2026-09-21 09:00:00+00', timestamptz '2026-09-21 09:00:00+00'),
  (1, 6, 1, 3500, 'entregado', null::text, timestamptz '2026-09-22 12:10:00+00', timestamptz '2026-09-22 12:40:00+00')
) as v(client_id, article_id, quantity, ekp_total, status, cancel_reason, created_at, updated_at)
where not exists (select 1 from redemptions);

insert into tickets (operation_type, operation_id, summary, client_name, ekp_amount, created_at)
select * from (values
  ('entrega', 1, 'Recepción 10.5 kg Placa Madre', 'Escuela Técnica N°1 San José', 5250, timestamptz '2026-08-14 10:30:00+00'),
  ('entrega', 2, 'Recepción 4.2 kg CPU & Procesadores', 'Colegio Polimodal San José', 1680, timestamptz '2026-08-28 09:15:00+00'),
  ('entrega', 3, 'Recepción 8.0 kg Cables & Transformadores', 'Centro Vecinal Zona Norte', 400, timestamptz '2026-09-05 16:40:00+00'),
  ('entrega', 4, 'Recepción 2.8 kg Placas de Video / GPU', 'Escuela Técnica N°1 San José', 980, timestamptz '2026-09-12 11:05:00+00'),
  ('canje', 1, 'Canje de 1× Kit Arduino Uno R3 + Sensores Básicos', 'Escuela Técnica N°1 San José', 1500, timestamptz '2026-09-14 10:30:00+00'),
  ('entrega', 5, 'Recepción 12.4 kg Periféricos & Monitores', 'Colegio Polimodal San José', 620, timestamptz '2026-09-20 14:22:00+00'),
  ('canje', 2, 'Canje de 2× Sensor de Humedad y Temperatura DHT11', 'Colegio Polimodal San José', 500, timestamptz '2026-09-21 09:00:00+00'),
  ('canje', 3, 'Canje de 1× Kit de inicio de Robótica Escolar', 'Escuela Técnica N°1 San José', 3500, timestamptz '2026-09-22 12:10:00+00')
) as v(operation_type, operation_id, summary, client_name, ekp_amount, created_at)
where not exists (select 1 from tickets);
