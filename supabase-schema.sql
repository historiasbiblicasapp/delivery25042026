-- Delivery 2026 - Schema do Banco de Dados

-- 1. Master (dono do sistema)
CREATE TABLE IF NOT EXISTS public.delivery_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Lojas (deliverys cadastrados)
CREATE TABLE IF NOT EXISTS public.delivery_lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  endereco TEXT,
  logo_url TEXT,
  cor TEXT DEFAULT '#22c55e',
  ativo BOOLEAN DEFAULT true,
  taxa_entrega NUMERIC(10,2) DEFAULT 5,
  preco_minimo NUMERIC(10,2) DEFAULT 20,
  tempo_entrega_min INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Produtos (cardápio)
CREATE TABLE IF NOT EXISTS public.delivery_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES delivery_lojas(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL,
  categoria TEXT,
  foto_url TEXT,
  disponivel BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pedidos
CREATE TABLE IF NOT EXISTS public.delivery_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES delivery_lojas(id),
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  endereco TEXT,
  itens JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  taxa_entrega NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  forma_pagamento TEXT DEFAULT 'dinheiro',
  status TEXT DEFAULT 'recebido',
  entregador_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Motoboys
CREATE TABLE IF NOT EXISTS public.delivery_motoboys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID REFERENCES delivery_lojas(id),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desabilitar RLS temporariamente (sem configuração)
ALTER TABLE public.delivery_master DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_lojas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_motoboys DISABLE ROW LEVEL SECURITY;

-- Inserir Master inicial
INSERT INTO public.delivery_master (email, nome, password)
VALUES ('master@delivery2026.com', 'Administrador', 'master123')
ON CONFLICT (email) DO NOTHING;