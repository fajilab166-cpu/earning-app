create extension if not exists pgcrypto;
create table if not exists public.users (
 id uuid primary key default gen_random_uuid(), telegram_id text unique not null,
 username text, first_name text not null default 'User', last_name text,
 balance_bdt numeric(14,2) not null default 0 check(balance_bdt>=0),
 referred_by uuid references public.users(id), is_blocked boolean not null default false,
 created_at timestamptz not null default now(), last_seen_at timestamptz
);
create table if not exists public.ad_sessions (
 id uuid primary key, user_id uuid not null references public.users(id),
 provider text not null check(provider in ('monetag','adsgram')), ymid text unique not null,
 status text not null default 'pending' check(status in ('pending','credited','rejected')),
 created_at timestamptz not null default now(), credited_at timestamptz, provider_payload jsonb
);
create table if not exists public.ledger (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id),
 amount_bdt numeric(14,2) not null, entry_type text not null, reference text unique not null,
 note text, created_at timestamptz not null default now()
);
create table if not exists public.withdrawals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id),
 amount_bdt numeric(14,2) not null check(amount_bdt>0), method text not null, account_number text not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected','paid')),
 created_at timestamptz not null default now(), reviewed_at timestamptz, admin_note text
);
create or replace function public.credit_monetag_reward(p_ymid text,p_reward_bdt numeric,p_event_payload jsonb default '{}'::jsonb)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_user_id uuid; v_status text;
begin
 select user_id,status into v_user_id,v_status from public.ad_sessions where ymid=p_ymid and provider='monetag' for update;
 if v_user_id is null or v_status<>'pending' then return false; end if;
 update public.ad_sessions set status='credited',credited_at=now(),provider_payload=p_event_payload where ymid=p_ymid and status='pending';
 if not found then return false; end if;
 insert into public.ledger(user_id,amount_bdt,entry_type,reference,note)
 values(v_user_id,p_reward_bdt,'ad_reward','monetag:'||p_ymid,'Monetag verified reward');
 update public.users set balance_bdt=balance_bdt+p_reward_bdt where id=v_user_id;
 return true;
end; $$;
alter table public.users enable row level security;
alter table public.ad_sessions enable row level security;
alter table public.ledger enable row level security;
alter table public.withdrawals enable row level security;
-- All application data access is server-side with the Supabase service-role key.
-- Never expose SUPABASE_SERVICE_ROLE_KEY in browser code.