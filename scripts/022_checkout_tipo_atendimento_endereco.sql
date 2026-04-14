ALTER TABLE public.cliente_perfis
  ADD COLUMN IF NOT EXISTS endereco_entrega TEXT;

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS tipo_atendimento TEXT NOT NULL DEFAULT 'take_out',
  ADD COLUMN IF NOT EXISTS endereco_entrega TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pedidos_tipo_atendimento_check'
  ) THEN
    ALTER TABLE public.pedidos
      ADD CONSTRAINT pedidos_tipo_atendimento_check
      CHECK (tipo_atendimento IN ('take_out', 'delivery'));
  END IF;
END
$$;
