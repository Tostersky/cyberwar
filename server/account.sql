-- CyberWar: deleting an account first leaves the clan properly (hands leadership to an heir,
-- removes an empty clan), then deletes the user; all other rows cascade.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not logged in'; end if;
  perform public.clan_leave();
  delete from auth.users where id = auth.uid();
end; $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
