-- Min/max opcionais: NULL = sem limite (extra pode ser livre entre 0 e todas as opções)

ALTER TABLE public.item_opcao_grupos
  ALTER COLUMN min_escolhas DROP NOT NULL,
  ALTER COLUMN max_escolhas DROP NOT NULL;

ALTER TABLE public.item_opcao_grupos DROP CONSTRAINT IF EXISTS item_opcao_grupos_min_max_check;

ALTER TABLE public.item_opcao_grupos
  ADD CONSTRAINT item_opcao_grupos_min_max_check
  CHECK (
    (min_escolhas IS NULL OR min_escolhas >= 0)
    AND (max_escolhas IS NULL OR max_escolhas >= COALESCE(min_escolhas, 0))
  );

COMMENT ON COLUMN public.item_opcao_grupos.min_escolhas IS
  'Minimo de opcoes a escolher no grupo extra. NULL = sem minimo (equivale a 0).';
COMMENT ON COLUMN public.item_opcao_grupos.max_escolhas IS
  'Maximo de opcoes no grupo extra. NULL = sem maximo (ate todas as opcoes do grupo).';
