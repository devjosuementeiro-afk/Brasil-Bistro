-- Perfis de clientes (complementam auth.users: e-mail fica em auth.users)
CREATE TABLE IF NOT EXISTS public.cliente_perfis (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  telefone TEXT NOT NULL DEFAULT '',
  endereco_entrega TEXT,
  aceita_sms_atualizacoes_pedido BOOLEAN NOT NULL DEFAULT false,
  aceita_email_atualizacoes_pedido BOOLEAN NOT NULL DEFAULT false,
  prefere_salvar_cartao_futuro BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cliente_perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_perfis_select_own" ON public.cliente_perfis;
CREATE POLICY "cliente_perfis_select_own" ON public.cliente_perfis
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cliente_perfis_insert_own" ON public.cliente_perfis;
CREATE POLICY "cliente_perfis_insert_own" ON public.cliente_perfis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cliente_perfis_update_own" ON public.cliente_perfis;
CREATE POLICY "cliente_perfis_update_own" ON public.cliente_perfis
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS cliente_perfis_atualizado ON public.cliente_perfis;
CREATE TRIGGER cliente_perfis_atualizado
  BEFORE UPDATE ON public.cliente_perfis
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS cliente_nome TEXT,
  ADD COLUMN IF NOT EXISTS cliente_email TEXT,
  ADD COLUMN IF NOT EXISTS cliente_telefone TEXT,
  ADD COLUMN IF NOT EXISTS tipo_atendimento TEXT NOT NULL DEFAULT 'take_out',
  ADD COLUMN IF NOT EXISTS endereco_entrega TEXT,
  ADD COLUMN IF NOT EXISTS cliente_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
