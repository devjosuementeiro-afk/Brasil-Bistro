ALTER TABLE public.itens_cardapio
ADD COLUMN IF NOT EXISTS quantidade_info TEXT,
ADD COLUMN IF NOT EXISTS tamanhos_disponiveis TEXT,
ADD COLUMN IF NOT EXISTS ingredientes_info TEXT,
ADD COLUMN IF NOT EXISTS alergenicos_alerta TEXT;
