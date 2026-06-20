
-- agent-avatars: let agents manage their own avatar files (path prefix = their uid)
CREATE POLICY "agent_avatars_agent_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'agent-avatars'
    AND public.has_role(auth.uid(), 'agent')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "agent_avatars_agent_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'agent-avatars'
    AND public.has_role(auth.uid(), 'agent')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'agent-avatars'
    AND public.has_role(auth.uid(), 'agent')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "agent_avatars_agent_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'agent-avatars'
    AND public.has_role(auth.uid(), 'agent')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- media: let agents upload/update/delete only files under their own uid prefix
CREATE POLICY "Media: agents can insert own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND public.has_role(auth.uid(), 'agent')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Media: agents can update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND public.has_role(auth.uid(), 'agent')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'media'
    AND public.has_role(auth.uid(), 'agent')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Media: agents can delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND public.has_role(auth.uid(), 'agent')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
