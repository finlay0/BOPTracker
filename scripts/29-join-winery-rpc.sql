-- RPC: join_winery_by_code
-- Links the logged-in user to a winery using join_code.
-- Can be called immediately after the session is established.
-- If the row already exists it updates it; otherwise it inserts.

create or replace function public.join_winery_by_code(code text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    wid bigint;
begin
    -- ensure code is present
    if code is null or code = '' then
        raise exception 'Join code required';
    end if;

    -- look up winery id
    select id into wid from public.wineries where join_code = code;
    if wid is null then
        raise exception 'Invalid join code';
    end if;

    -- try update first
    update public.users
    set    winery_id = wid,
           role      = coalesce(role, 'member')
    where  id = auth.uid();

    if not found then
        -- no row yet; insert
        insert into public.users(id, winery_id, role)
        values (auth.uid(), wid, 'member');
    end if;
end;
$$;

grant execute on function public.join_winery_by_code(text) to authenticated;
