-- Banner na home: URL pública (Storage) e ordem no carrossel.
ALTER TABLE public.promocoes
  ADD COLUMN IF NOT EXISTS imagem_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_ordem INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.promocoes.imagem_banner_url IS 'Imagem do carrossel de promoções na home (bucket público).';
COMMENT ON COLUMN public.promocoes.banner_ordem IS 'Ordem no carrossel (menor primeiro).';
