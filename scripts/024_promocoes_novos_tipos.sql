DO $$
BEGIN
  ALTER TYPE public.promocao_tipo ADD VALUE IF NOT EXISTS 'delivery_gratis_subtotal_minimo';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TYPE public.promocao_tipo ADD VALUE IF NOT EXISTS 'compre_x_ganhe_y';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.promocoes
  ADD COLUMN IF NOT EXISTS compre_x_item_id UUID REFERENCES public.itens_cardapio(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS compre_x_qtd INTEGER,
  ADD COLUMN IF NOT EXISTS ganhe_item_id UUID REFERENCES public.itens_cardapio(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ganhe_qtd INTEGER;
