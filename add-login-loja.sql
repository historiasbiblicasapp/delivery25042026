-- Tabela de usuários das lojas
CREATE TABLE IF NOT EXISTS public.delivery_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  password TEXT NOT NULL,
  tipo TEXT DEFAULT 'loja',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.delivery_usuarios DISABLE ROW LEVEL SECURITY;