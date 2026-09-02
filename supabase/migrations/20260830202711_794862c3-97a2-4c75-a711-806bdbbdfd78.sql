
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''),'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set email = excluded.email;

  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;

  if lower(coalesce(new.email,'')) = any (public.owner_emails()) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
    update public.profiles set plan = 'pro' where id = new.id;
  end if;

  insert into public.paper_wallets (user_id) values (new.id) on conflict do nothing;
  return new;
exception when others then
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, email, display_name)
select u.id, u.email,
       coalesce(u.raw_user_meta_data->>'full_name', split_part(coalesce(u.email,''),'@',1))
from auth.users u
on conflict (id) do nothing;

insert into public.user_roles (user_id, role) select u.id,'user'::public.app_role from auth.users u
on conflict do nothing;

insert into public.user_roles (user_id, role)
select u.id,'admin'::public.app_role from auth.users u
where lower(coalesce(u.email,'')) = any (public.owner_emails())
on conflict do nothing;

insert into public.paper_wallets (user_id) select u.id from auth.users u
on conflict do nothing;

update public.profiles p set plan = 'pro'
where exists (select 1 from public.user_roles r where r.user_id = p.id and r.role = 'admin');
