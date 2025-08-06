-- 30-fix-user-onboarding.sql
-- Purpose: Ensure new users are always linked to their winery (or at least have
-- their email / name populated) and that an onboarding trigger actually exists.
--
-- 1. Re-implements public.handle_new_user() so it:
--    • Works case-insensitively on join_code.
--    • UPDATES an existing stub row if one already exists (winery_id IS NULL).
--    • Falls back to inserting a stub row (email + name only) when no join_code
--      was provided, so the profile table always has complete data.
--
-- 2. (Re)creates the trigger on auth.users so the function is called
--    automatically after sign-up.
--
-- 3. Upgrades public.join_winery_by_code() so it also sets email & name and is
--    case-insensitive.
--
-- NOTE: All objects are recreated with CREATE OR REPLACE so this script is
-- idempotent and safe to run in any environment.

-------------------------------------------------------------------------------
-- 1. Updated handle_new_user() ------------------------------------------------
-------------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_winery_id bigint;
    v_role      text := 'member';
begin
    -- Case-insensitive lookup for the winery belonging to the supplied join code
    select id
      into v_winery_id
      from public.wineries
     where lower(join_code) = lower(new.raw_user_meta_data ->> 'join_code');

    -- Determine role (first user in winery becomes owner)
    if v_winery_id is not null
       and (select count(*) from public.users where winery_id = v_winery_id) = 0
    then
        v_role := 'owner';
    end if;

    --------------------------------------------------------------------------
    -- Upsert into public.users
    --------------------------------------------------------------------------
    insert into public.users (id, winery_id, role, email, full_name)
    values (
        new.id,
        v_winery_id,                     -- can be NULL
        v_role,
        new.email,
        new.raw_user_meta_data ->> 'full_name'
    )
    on conflict (id) do update set
        winery_id = coalesce(excluded.winery_id, public.users.winery_id),
        role      = excluded.role,
        email     = excluded.email,
        full_name = excluded.full_name;

    return new;
end;
$$;

-------------------------------------------------------------------------------
-- 2. Ensure trigger exists ----------------------------------------------------
-------------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-------------------------------------------------------------------------------
-- 3. Enhanced join_winery_by_code(code text) ---------------------------------
-------------------------------------------------------------------------------

create or replace function public.join_winery_by_code(code text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_winery_id bigint;
    v_email     text;
    v_name      text;
begin
    if coalesce(code, '') = '' then
        raise exception 'Join code required';
    end if;

    -- Case-insensitive join-code lookup
    select id into v_winery_id
      from public.wineries
     where lower(join_code) = lower(code);

    if v_winery_id is null then
        raise exception 'Invalid join code';
    end if;

    -- Fetch email & name from auth.users once to avoid duplication
    select au.email,
           coalesce(au.raw_user_meta_data ->> 'full_name', '')
      into v_email, v_name
      from auth.users au
     where au.id = auth.uid();

    --------------------------------------------------------------------------
    -- Upsert public.users row for the current UID
    --------------------------------------------------------------------------
    insert into public.users (id, winery_id, role, email, full_name)
    values (auth.uid(), v_winery_id, 'member', v_email, v_name)
    on conflict (id) do update set
        winery_id = excluded.winery_id,
        role      = 'member',
        email     = coalesce(excluded.email, public.users.email),
        full_name = coalesce(excluded.full_name, public.users.full_name);
end;
$$;

grant execute on function public.join_winery_by_code(text) to authenticated;
