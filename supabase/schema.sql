create table if not exists public.game_rankings (
  id bigint generated always as identity primary key,
  run_id text unique not null,
  name text not null check (char_length(name) between 1 and 10),
  gold integer not null check (gold between 0 and 2147483647),
  kills integer not null check (kills between 0 and 2147483647),
  difficulty text not null check (difficulty in ('easy','normal','hard','endless')),
  at bigint not null default (extract(epoch from clock_timestamp()) * 1000)::bigint
);
-- Also upgrade an existing rankings table without changing its records.
alter table public.game_rankings drop constraint if exists game_rankings_difficulty_check;
alter table public.game_rankings add constraint game_rankings_difficulty_check check (difficulty in ('easy','normal','hard','endless'));
alter table public.game_rankings drop constraint if exists game_rankings_gold_check;
alter table public.game_rankings add constraint game_rankings_gold_check check (gold between 0 and 2147483647);
alter table public.game_rankings drop constraint if exists game_rankings_kills_check;
alter table public.game_rankings add constraint game_rankings_kills_check check (kills between 0 and 2147483647);
alter table public.game_rankings enable row level security;
revoke all on public.game_rankings from anon, authenticated;
grant select, insert, delete on public.game_rankings to service_role;
grant usage, select on sequence public.game_rankings_id_seq to service_role;
create or replace function public.submit_game_rank(p_run_id text, p_name text, p_gold integer, p_kills integer, p_difficulty text)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare accepted boolean := false; rows_json jsonb; cutoff integer;
begin
  if p_run_id !~ '^\d{10,20}$' or p_name is null or btrim(p_name) = '' or char_length(p_name) > 10 or p_gold is null or p_gold < 0 or p_gold > 2147483647 or p_kills is null or p_kills < 0 or p_kills > 2147483647 or p_difficulty is null or p_difficulty not in ('easy','normal','hard','endless') then
    raise exception 'invalid record';
  end if;
  perform pg_advisory_xact_lock(728193);
  if not exists(select 1 from game_rankings where run_id=p_run_id) then
    select gold into cutoff from game_rankings order by gold desc, id asc offset 11 limit 1;
    if cutoff is null or p_gold > cutoff then
      insert into game_rankings(run_id,name,gold,kills,difficulty) values(p_run_id,p_name,p_gold,p_kills,p_difficulty);
      delete from game_rankings where id not in(select id from game_rankings order by gold desc,id asc limit 12);
    end if;
  end if;
  select exists(select 1 from game_rankings where run_id=p_run_id) into accepted;
  select coalesce(jsonb_agg(to_jsonb(r) - 'run_id' order by gold desc,id asc),'[]'::jsonb) into rows_json from game_rankings r;
  return jsonb_build_object('accepted',accepted,'rows',rows_json);
end;
$$;
revoke all on function public.submit_game_rank(text,text,integer,integer,text) from public,anon,authenticated;
grant execute on function public.submit_game_rank(text,text,integer,integer,text) to service_role;
