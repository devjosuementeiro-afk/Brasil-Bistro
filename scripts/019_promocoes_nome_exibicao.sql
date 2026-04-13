-- Nome exibido ao cliente (carrinho/checkout). Se NULL ou vazio, usa `nome`.
ALTER TABLE public.promocoes
  ADD COLUMN IF NOT EXISTS nome_exibicao TEXT;

COMMENT ON COLUMN public.promocoes.nome_exibicao IS 'Rótulo para o cliente; se vazio, usa nome (interno).';
COMMENT ON COLUMN public.promocoes.valor_minimo_subtotal IS
  'subtotal_minimo_percentual: subtotal >= valor para ativar %. codigo_promocional: subtotal >= valor para o código valer (opcional; NULL = sem mínimo).';
