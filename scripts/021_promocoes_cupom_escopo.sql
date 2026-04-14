-- Restrição de cupom: categorias e/ou produtos elegíveis (NULL ou {} = todo o carrinho).
ALTER TABLE public.promocoes
  ADD COLUMN IF NOT EXISTS cupom_categoria_ids UUID[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cupom_item_ids UUID[] DEFAULT NULL;

COMMENT ON COLUMN public.promocoes.cupom_categoria_ids IS 'Tipo código: desconto só em linhas dessas categorias (OR com cupom_item_ids). Vazio/NULL = sem filtro por categoria.';
COMMENT ON COLUMN public.promocoes.cupom_item_ids IS 'Tipo código: desconto só nesses itens do cardápio. Vazio/NULL = sem filtro por produto.';
