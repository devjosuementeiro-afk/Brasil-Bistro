CREATE TABLE IF NOT EXISTS public.combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
  imagem_url TEXT,
  destaque BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.combo_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.itens_cardapio(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  ordem INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS combo_itens_combo_item_unique
  ON public.combo_itens(combo_id, item_id);

ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "combos_select_all" ON public.combos;
CREATE POLICY "combos_select_all" ON public.combos FOR SELECT USING (true);
DROP POLICY IF EXISTS "combos_insert_admin" ON public.combos;
CREATE POLICY "combos_insert_admin" ON public.combos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "combos_update_admin" ON public.combos;
CREATE POLICY "combos_update_admin" ON public.combos FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "combos_delete_admin" ON public.combos;
CREATE POLICY "combos_delete_admin" ON public.combos FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "combo_itens_select_all" ON public.combo_itens;
CREATE POLICY "combo_itens_select_all" ON public.combo_itens FOR SELECT USING (true);
DROP POLICY IF EXISTS "combo_itens_insert_admin" ON public.combo_itens;
CREATE POLICY "combo_itens_insert_admin" ON public.combo_itens FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "combo_itens_update_admin" ON public.combo_itens;
CREATE POLICY "combo_itens_update_admin" ON public.combo_itens FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "combo_itens_delete_admin" ON public.combo_itens;
CREATE POLICY "combo_itens_delete_admin" ON public.combo_itens FOR DELETE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS combos_atualizado ON public.combos;
CREATE TRIGGER combos_atualizado
  BEFORE UPDATE ON public.combos
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();

ALTER TABLE public.pedido_itens
  ADD COLUMN IF NOT EXISTS combo_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pedido_itens_combo_id_fkey'
  ) THEN
    ALTER TABLE public.pedido_itens
      ADD CONSTRAINT pedido_itens_combo_id_fkey
      FOREIGN KEY (combo_id) REFERENCES public.combos(id) ON DELETE SET NULL;
  END IF;
END
$$;
