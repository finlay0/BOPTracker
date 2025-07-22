create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  winery_id_to_set int;
  user_role public.user_role;
  join_code_from_meta text;
begin
  -- Extract join_code from auth user metadata
  join_code_from_meta := new.raw_user_meta_data->>'join_code';

  -- Find the winery_id for the given join_code
  select id into winery_id_to_set from public.wineries where join_code = join_code_from_meta;

  -- If no winery is found for the join code, raise an error
  if winery_id_to_set is null then
    raise exception 'Invalid winery join code';
  end if;

  -- Check if this is the first user for the winery to assign 'owner' role
  if (select count(*) from public.users where winery_id = winery_id_to_set) = 0 then
    user_role := 'owner';
  else
    user_role := 'member';
  end if;

  -- Insert a new row into the public.users table
  insert into public.users (id, winery_id, role, email, full_name)
  values (
    new.id,
    winery_id_to_set,
    user_role,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;
