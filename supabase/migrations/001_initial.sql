create extension if not exists "uuid-ossp";

create table students (
  id         uuid primary key default uuid_generate_v4(),
  email      text not null unique,
  name       text not null,
  created_at timestamp default now()
);

create table enrollments (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid references students(id) on delete cascade,
  course      text not null,
  status      text not null check (status in ('active','suspended','completed')),
  enrolled_at timestamp default now()
);

create table payments (
  id                uuid primary key default uuid_generate_v4(),
  student_id        uuid references students(id) on delete cascade,
  stripe_payment_id text not null unique,
  amount            numeric not null,
  status            text not null check (status in ('succeeded','failed','refunded')),
  paid_at           timestamp default now()
);

create table churn_alerts (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid references students(id) on delete cascade,
  alerted_at      timestamp default now(),
  clickup_task_id text
);

create table error_logs (
  id         uuid primary key default uuid_generate_v4(),
  event      text,
  error      text,
  created_at timestamp default now()
);
