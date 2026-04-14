-- Preferências de comunicação e intenção de salvar cartão (vault PayPal no futuro)
ALTER TABLE public.cliente_perfis
  ADD COLUMN IF NOT EXISTS aceita_sms_atualizacoes_pedido BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aceita_email_atualizacoes_pedido BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS endereco_entrega TEXT,
  ADD COLUMN IF NOT EXISTS prefere_salvar_cartao_futuro BOOLEAN NOT NULL DEFAULT false;

-- Snapshot no pedido (inclui visitantes no checkout)
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS tipo_atendimento TEXT NOT NULL DEFAULT 'take_out',
  ADD COLUMN IF NOT EXISTS endereco_entrega TEXT,
  ADD COLUMN IF NOT EXISTS cliente_aceita_sms_atualizacoes BOOLEAN,
  ADD COLUMN IF NOT EXISTS cliente_aceita_email_atualizacoes BOOLEAN,
  ADD COLUMN IF NOT EXISTS cliente_consentiu_salvar_cartao BOOLEAN;
