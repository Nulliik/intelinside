begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rig-photos',
  'rig-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy rig_photos_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'rig-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy rig_photos_owner_update
on storage.objects for update to authenticated
using (bucket_id = 'rig-photos' and owner_id = (select auth.uid())::text)
with check (
  bucket_id = 'rig-photos'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy rig_photos_owner_delete
on storage.objects for delete to authenticated
using (bucket_id = 'rig-photos' and owner_id = (select auth.uid())::text);

commit;
