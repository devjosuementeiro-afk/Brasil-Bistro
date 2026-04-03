ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS status_producao TEXT NOT NULL DEFAULT 'new';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pedidos_status_producao_check'
  ) THEN
    ALTER TABLE public.pedidos
    ADD CONSTRAINT pedidos_status_producao_check
    CHECK (status_producao IN ('new', 'preparing', 'delivered'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pedidos'
      AND policyname = 'pedidos_update_authenticated'
  ) THEN
    CREATE POLICY "pedidos_update_authenticated" ON public.pedidos
      FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;
