-- Tabela de categorias do cardápio
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  icone TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de itens do cardápio
CREATE TABLE IF NOT EXISTS public.itens_cardapio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10, 2) NOT NULL,
  imagem_url TEXT,
  disponivel BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- RLS: categorias são públicas para leitura
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_select_all" ON public.categorias
  FOR SELECT USING (true);

CREATE POLICY "categorias_insert_admin" ON public.categorias
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "categorias_update_admin" ON public.categorias
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "categorias_delete_admin" ON public.categorias
  FOR DELETE USING (auth.role() = 'authenticated');

-- RLS: itens são públicos para leitura
ALTER TABLE public.itens_cardapio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itens_select_all" ON public.itens_cardapio
  FOR SELECT USING (true);

CREATE POLICY "itens_insert_admin" ON public.itens_cardapio
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "itens_update_admin" ON public.itens_cardapio
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "itens_delete_admin" ON public.itens_cardapio
  FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION public.update_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS itens_cardapio_atualizado ON public.itens_cardapio;
CREATE TRIGGER itens_cardapio_atualizado
  BEFORE UPDATE ON public.itens_cardapio
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();

-- Dados iniciais de exemplo
INSERT INTO public.categorias (nome, icone, ordem) VALUES
  ('Entradas', '🥗', 1),
  ('Pratos Principais', '🍽️', 2),
  ('Sobremesas', '🍰', 3),
  ('Bebidas', '🥤', 4)
ON CONFLICT DO NOTHING;
