-- Extras personalizados: varios grupos por item (ex.: Sabor, Complemento), min/max de escolhas

-- Novas colunas
ALTER TABLE public.item_opcao_grupos
  ADD COLUMN IF NOT EXISTS min_escolhas INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_escolhas INTEGER NOT NULL DEFAULT 1;

-- Ampliar tipo: incluir 'extra'
ALTER TABLE public.item_opcao_grupos DROP CONSTRAINT IF EXISTS item_opcao_grupos_tipo_check;
ALTER TABLE public.item_opcao_grupos
  ADD CONSTRAINT item_opcao_grupos_tipo_check
  CHECK (tipo IN ('size', 'quantity', 'extra'));

-- Remover UNIQUE (item_id, tipo) para permitir varios grupos 'extra'
ALTER TABLE public.item_opcao_grupos DROP CONSTRAINT IF EXISTS item_opcao_grupos_item_id_tipo_key;

-- No maximo um grupo de tamanho e um de quantidade por item
CREATE UNIQUE INDEX IF NOT EXISTS uniq_item_opcao_grupo_size
  ON public.item_opcao_grupos (item_id)
  WHERE tipo = 'size';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_item_opcao_grupo_quantity
  ON public.item_opcao_grupos (item_id)
  WHERE tipo = 'quantity';

-- Min/max coerentes
ALTER TABLE public.item_opcao_grupos DROP CONSTRAINT IF EXISTS item_opcao_grupos_min_max_check;
ALTER TABLE public.item_opcao_grupos
  ADD CONSTRAINT item_opcao_grupos_min_max_check
  CHECK (min_escolhas >= 0 AND max_escolhas >= min_escolhas);
