-- Tipos de promoção configuráveis pelo admin
CREATE TYPE public.promocao_tipo AS ENUM (
  'subtotal_minimo_percentual',
  'codigo_promocional',
  'categoria_percentual',
  'delivery_gratis_subtotal_minimo',
  'compre_x_ganhe_y'
);

CREATE TABLE IF NOT EXISTS public.promocoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_exibicao TEXT,
  imagem_banner_url TEXT,
  banner_ordem INTEGER NOT NULL DEFAULT 0,
  tipo public.promocao_tipo NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  percentual_desconto NUMERIC(5, 2) NOT NULL,
  valor_minimo_subtotal NUMERIC(12, 2),
  codigo TEXT,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  validade_inicio TIMESTAMPTZ,
  validade_fim TIMESTAMPTZ,
  cupom_categoria_ids UUID[] DEFAULT NULL,
  cupom_item_ids UUID[] DEFAULT NULL,
  compre_x_item_id UUID REFERENCES public.itens_cardapio(id) ON DELETE SET NULL,
  compre_x_qtd INTEGER,
  ganhe_item_id UUID REFERENCES public.itens_cardapio(id) ON DELETE SET NULL,
  ganhe_qtd INTEGER,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promocoes_percentual_range CHECK (
    percentual_desconto > 0 AND percentual_desconto <= 100
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS promocoes_codigo_upper_unique
  ON public.promocoes (upper(trim(codigo)))
  WHERE codigo IS NOT NULL AND trim(codigo) <> '';

COMMENT ON TABLE public.promocoes IS 'Regras de desconto: pedido mínimo, código ou categoria.';
COMMENT ON COLUMN public.promocoes.nome_exibicao IS 'Rótulo para o cliente; se vazio, usa nome (interno).';
COMMENT ON COLUMN public.promocoes.valor_minimo_subtotal IS 'Mínimo em USD: pedido mínimo (tipo subtotal) ou para o código valer (tipo código; opcional).';
COMMENT ON COLUMN public.promocoes.codigo IS 'Para tipo codigo_promocional: código sem espaços (comparação case-insensitive).';
COMMENT ON COLUMN public.promocoes.categoria_id IS 'Para tipo categoria_percentual: categoria afetada.';
COMMENT ON COLUMN public.promocoes.compre_x_item_id IS 'Para tipo compre_x_ganhe_y: item gatilho.';
COMMENT ON COLUMN public.promocoes.compre_x_qtd IS 'Para tipo compre_x_ganhe_y: quantidade mínima do item gatilho.';
COMMENT ON COLUMN public.promocoes.ganhe_item_id IS 'Para tipo compre_x_ganhe_y: item grátis.';
COMMENT ON COLUMN public.promocoes.ganhe_qtd IS 'Para tipo compre_x_ganhe_y: quantidade grátis por ciclo.';

DROP TRIGGER IF EXISTS promocoes_atualizado ON public.promocoes;
CREATE TRIGGER promocoes_atualizado
  BEFORE UPDATE ON public.promocoes
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();

ALTER TABLE public.promocoes ENABLE ROW LEVEL SECURITY;

-- Mesmo padrão do cardápio: só utilizadores autenticados (equipa) gerem; leitura também autenticada para não expor códigos em anon.
CREATE POLICY "promocoes_select_auth" ON public.promocoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "promocoes_insert_auth" ON public.promocoes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "promocoes_update_auth" ON public.promocoes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "promocoes_delete_auth" ON public.promocoes
  FOR DELETE TO authenticated USING (true);
