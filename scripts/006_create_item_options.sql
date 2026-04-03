-- Grupos e opcoes de variacao por item (ex.: tamanho, quantidade)

CREATE TABLE IF NOT EXISTS public.item_opcao_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.itens_cardapio(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('size', 'quantity')),
  nome TEXT NOT NULL,
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, tipo)
);

CREATE TABLE IF NOT EXISTS public.item_opcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES public.item_opcao_grupos(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_item_opcao_grupos_item_id
  ON public.item_opcao_grupos (item_id, ordem);

CREATE INDEX IF NOT EXISTS idx_item_opcoes_grupo_id
  ON public.item_opcoes (grupo_id, ordem);

ALTER TABLE public.item_opcao_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_opcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_opcao_grupos_select_all" ON public.item_opcao_grupos
  FOR SELECT USING (true);

CREATE POLICY "item_opcoes_select_all" ON public.item_opcoes
  FOR SELECT USING (true);

CREATE POLICY "item_opcao_grupos_write_authenticated" ON public.item_opcao_grupos
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "item_opcoes_write_authenticated" ON public.item_opcoes
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS item_opcao_grupos_atualizado ON public.item_opcao_grupos;
CREATE TRIGGER item_opcao_grupos_atualizado
  BEFORE UPDATE ON public.item_opcao_grupos
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();
