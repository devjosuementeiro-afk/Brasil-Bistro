-- Cria (ou ajusta) o bucket usado por itens e promoções.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cardapio-imagens',
  'cardapio-imagens',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Leitura pública para exibir imagens no app.
DROP POLICY IF EXISTS "cardapio_imagens_public_read" ON storage.objects;
CREATE POLICY "cardapio_imagens_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cardapio-imagens');

-- Admin autenticado pode enviar novas imagens.
DROP POLICY IF EXISTS "cardapio_imagens_auth_insert" ON storage.objects;
CREATE POLICY "cardapio_imagens_auth_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cardapio-imagens');

-- Admin autenticado pode atualizar/remover imagens antigas.
DROP POLICY IF EXISTS "cardapio_imagens_auth_update" ON storage.objects;
CREATE POLICY "cardapio_imagens_auth_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'cardapio-imagens')
WITH CHECK (bucket_id = 'cardapio-imagens');

DROP POLICY IF EXISTS "cardapio_imagens_auth_delete" ON storage.objects;
CREATE POLICY "cardapio_imagens_auth_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'cardapio-imagens');
