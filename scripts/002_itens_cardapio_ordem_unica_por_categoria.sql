-- Garante que não existam dois itens com a mesma `ordem` na mesma categoria
-- (`categoria_id` NOT NULL). Itens sem categoria (`categoria_id` NULL) ficam fora
-- desta regra (podem repetir `ordem`).
--
-- Execute no SQL Editor do Supabase (ou psql) na ordem abaixo.

-- ---------------------------------------------------------------------------
-- PASSO 1 (obrigatório se já houver duplicatas): renumera `ordem` dentro de cada
-- categoria, preservando a ordem relativa atual (ordem ASC, depois id ASC).
-- Isso colapsa sequências tipo 10,20,30 em 1,2,3 — ajuste manualmente depois se precisar.
-- ---------------------------------------------------------------------------
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY categoria_id
      ORDER BY ordem ASC, id ASC
    )::integer AS new_ordem
  FROM public.itens_cardapio
  WHERE categoria_id IS NOT NULL
)
UPDATE public.itens_cardapio AS i
SET ordem = r.new_ordem
FROM ranked AS r
WHERE i.id = r.id;

-- ---------------------------------------------------------------------------
-- PASSO 2: índice único parcial — apenas quando o item tem categoria.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS itens_cardapio_categoria_id_ordem_key
  ON public.itens_cardapio (categoria_id, ordem)
  WHERE categoria_id IS NOT NULL;
