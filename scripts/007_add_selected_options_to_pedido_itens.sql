ALTER TABLE public.pedido_itens
ADD COLUMN IF NOT EXISTS opcoes_selecionadas JSONB;
