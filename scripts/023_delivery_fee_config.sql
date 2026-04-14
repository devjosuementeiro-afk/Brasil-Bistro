ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS taxa_entrega NUMERIC(10, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.configuracoes_loja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxa_entrega_padrao NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (taxa_entrega_padrao >= 0),
  printnode_ativo BOOLEAN NOT NULL DEFAULT false,
  printnode_api_key TEXT,
  printnode_printer_id BIGINT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_loja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "configuracoes_loja_select_authenticated" ON public.configuracoes_loja;
CREATE POLICY "configuracoes_loja_select_authenticated" ON public.configuracoes_loja
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "configuracoes_loja_update_authenticated" ON public.configuracoes_loja;
CREATE POLICY "configuracoes_loja_update_authenticated" ON public.configuracoes_loja
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "configuracoes_loja_insert_authenticated" ON public.configuracoes_loja;
CREATE POLICY "configuracoes_loja_insert_authenticated" ON public.configuracoes_loja
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS configuracoes_loja_atualizado ON public.configuracoes_loja;
CREATE TRIGGER configuracoes_loja_atualizado
  BEFORE UPDATE ON public.configuracoes_loja
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();

INSERT INTO public.configuracoes_loja (taxa_entrega_padrao)
SELECT 0
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_loja);
