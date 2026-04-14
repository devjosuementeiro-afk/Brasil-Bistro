-- Cria cliente_perfis no cadastro mesmo sem sessão JWT (ex.: confirmação de e-mail ativa).
-- O cliente fazia upsert com anon key sem auth.uid() → violava RLS.

CREATE OR REPLACE FUNCTION public.handle_new_user_cliente_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  nome text;
  tel text;
  endereco text;
  sms_ok boolean;
  email_ok boolean;
  cartao_ok boolean;
BEGIN
  -- Contas staff/admin não precisam de linha em cliente_perfis
  IF COALESCE(meta->>'role', 'customer') = 'admin' THEN
    RETURN NEW;
  END IF;

  nome := NULLIF(trim(COALESCE(meta->>'nome_completo', '')), '');
  tel := NULLIF(trim(COALESCE(meta->>'telefone', '')), '');
  endereco := NULLIF(trim(COALESCE(meta->>'endereco_entrega', '')), '');

  IF nome IS NULL THEN
    nome := '';
  END IF;
  IF tel IS NULL THEN
    tel := '';
  END IF;

  sms_ok := lower(COALESCE(meta->>'aceita_sms_atualizacoes_pedido', '')) IN ('true', 't', '1');
  email_ok := lower(COALESCE(meta->>'aceita_email_atualizacoes_pedido', '')) IN ('true', 't', '1');
  cartao_ok := lower(COALESCE(meta->>'prefere_salvar_cartao_futuro', '')) IN ('true', 't', '1');

  INSERT INTO public.cliente_perfis (
    user_id,
    nome_completo,
    telefone,
    endereco_entrega,
    aceita_sms_atualizacoes_pedido,
    aceita_email_atualizacoes_pedido,
    prefere_salvar_cartao_futuro
  )
  VALUES (
    NEW.id,
    nome,
    tel,
    endereco,
    sms_ok,
    email_ok,
    cartao_ok
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nome_completo = EXCLUDED.nome_completo,
    telefone = EXCLUDED.telefone,
    endereco_entrega = EXCLUDED.endereco_entrega,
    aceita_sms_atualizacoes_pedido = EXCLUDED.aceita_sms_atualizacoes_pedido,
    aceita_email_atualizacoes_pedido = EXCLUDED.aceita_email_atualizacoes_pedido,
    prefere_salvar_cartao_futuro = EXCLUDED.prefere_salvar_cartao_futuro,
    atualizado_em = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_cliente_perfil ON auth.users;
CREATE TRIGGER on_auth_user_created_cliente_perfil
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_cliente_perfil();
