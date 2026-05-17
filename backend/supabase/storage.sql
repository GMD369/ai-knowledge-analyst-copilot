-- Run in Supabase SQL Editor after schema.sql
-- Creates a private storage bucket for document uploads

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Only the document owner can upload / read their files
create policy "users_upload_own_files" on storage.objects
    for insert with check (
        bucket_id = 'documents'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "users_read_own_files" on storage.objects
    for select using (
        bucket_id = 'documents'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "users_delete_own_files" on storage.objects
    for delete using (
        bucket_id = 'documents'
        and auth.uid()::text = (storage.foldername(name))[1]
    );
