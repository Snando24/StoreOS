-- Slice 1: a signed-in user may see only the tenant records to which they belong.
-- Public storefront access remains exclusively through Edge Functions.

create policy tenants_member_read on public.tenants
for select to authenticated
using (
  exists (
    select 1
    from public.tenant_memberships membership
    where membership.tenant_id = tenants.id
      and membership.user_id = auth.uid()
  )
);
