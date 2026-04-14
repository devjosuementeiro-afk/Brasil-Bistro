-- Tabelas de pedidos para persistir ordens confirmadas pelo PayPal

CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paypal_order_id TEXT NOT NULL UNIQUE,
  paypal_capture_id TEXT UNIQUE,
  status_pagamento TEXT NOT NULL,
  status_producao TEXT NOT NULL DEFAULT 'new',
  valor_total NUMERIC(10, 2) NOT NULL,
  valor_pago NUMERIC(10, 2),
  valor_bruto NUMERIC(10, 2),
  taxa_paypal NUMERIC(10, 2),
  taxa_entrega NUMERIC(10, 2) NOT NULL DEFAULT 0,
  valor_liquido NUMERIC(10, 2),
  moeda TEXT NOT NULL DEFAULT 'USD',
  origem_pagamento TEXT NOT NULL DEFAULT 'paypal',
  cliente_nome TEXT,
  cliente_email TEXT,
  cliente_telefone TEXT,
  cliente_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo_atendimento TEXT NOT NULL DEFAULT 'take_out' CHECK (tipo_atendimento IN ('take_out', 'delivery')),
  endereco_entrega TEXT,
  cliente_aceita_sms_atualizacoes BOOLEAN,
  cliente_aceita_email_atualizacoes BOOLEAN,
  cliente_consentiu_salvar_cartao BOOLEAN,
  payload_pagamento JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.itens_cardapio(id) ON DELETE SET NULL,
  combo_id UUID,
  nome_item TEXT NOT NULL,
  observacao TEXT,
  opcoes_selecionadas JSONB,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario >= 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id
  ON public.pedido_itens (pedido_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em
  ON public.pedidos (criado_em DESC);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;

-- Leitura por usuários autenticados (painel/admin).
CREATE POLICY "pedidos_select_authenticated" ON public.pedidos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pedidos_update_authenticated" ON public.pedidos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "pedido_itens_select_authenticated" ON public.pedido_itens
  FOR SELECT USING (auth.role() = 'authenticated');

-- Reaproveita trigger de atualizado_em já criada no script inicial.
DROP TRIGGER IF EXISTS pedidos_atualizado ON public.pedidos;
CREATE TRIGGER pedidos_atualizado
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();

CREATE TABLE IF NOT EXISTS public.configuracoes_loja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxa_entrega_padrao NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (taxa_entrega_padrao >= 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_loja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "configuracoes_loja_select_authenticated" ON public.configuracoes_loja;
CREATE POLICY "configuracoes_loja_select_authenticated" ON public.configuracoes_loja
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "configuracoes_loja_update_authenticated" ON public.configuracoes_loja;
CREATE POLICY "configuracoes_loja_update_authenticated" ON public.configuracoes_loja
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "configuracoes_loja_insert_authenticated" ON public.configuracoes_loja;
CREATE POLICY "configuracoes_loja_insert_authenticated" ON public.configuracoes_loja
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS configuracoes_loja_atualizado ON public.configuracoes_loja;
CREATE TRIGGER configuracoes_loja_atualizado
  BEFORE UPDATE ON public.configuracoes_loja
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();
