ALTER TABLE public.configuracoes_loja
  ADD COLUMN IF NOT EXISTS printnode_ativo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS printnode_api_key TEXT,
  ADD COLUMN IF NOT EXISTS printnode_printer_id BIGINT;
