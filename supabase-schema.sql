-- Delivery 2026 - Schema do Banco de Dados
-- Execute este SQL no Supabase SQL Editor

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
  nivel INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Níveis das lojas:
-- 1 = Básico (só PIX manual)
-- 2 = Intermediário (PIX manual + relatórios)
-- 3 = PRO (PIX manual + Mercado Pago + relatórios)

-- 3. Planos disponíveis
CREATE TABLE IF NOT EXISTS public.delivery_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_mensal NUMERIC(10,2) NOT NULL,
  limite_lojas INTEGER DEFAULT 1,
  fitur_pix BOOLEAN DEFAULT false,
  fitur_relatorios BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Assinaturas das lojas
CREATE TABLE IF NOT EXISTS public.delivery_assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID,
  plano_id UUID,
  status TEXT DEFAULT 'trial',
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Configurações de pagamento (Mercado Pago)
CREATE TABLE IF NOT EXISTS public.delivery_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID,
  mercado_pago_access_token TEXT,
  mercado_pago_client_id TEXT,
  chave_pix TEXT,
  tipo_chave_pix TEXT,
  active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Produtos (cardápio)
CREATE TABLE IF NOT EXISTS public.delivery_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL,
  categoria TEXT,
  foto_url TEXT,
  disponivel BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Pedidos
CREATE TABLE IF NOT EXISTS public.delivery_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL,
  numero_pedido TEXT,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  endereco TEXT,
  itens JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  taxa_entrega NUMERIC(10,2) DEFAULT 0,
  desconto NUMERIC(10,2) DEFAULT 0,
  promo_codigo TEXT,
  total NUMERIC(10,2) NOT NULL,
  forma_pagamento TEXT DEFAULT 'dinheiro',
  tipo_entrega TEXT DEFAULT 'entrega',
  status TEXT DEFAULT 'recebido',
  observacao TEXT,
  entregador_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Motoboys
CREATE TABLE IF NOT EXISTS public.delivery_motoboys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Promoções
CREATE TABLE IF NOT EXISTS public.delivery_promocoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  desconto NUMERIC(10,2) NOT NULL,
  tipo TEXT DEFAULT 'porcentagem',
  codigo TEXT,
  valido_ate TIMESTAMPTZ,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Dispositivos conectados (para controle de acesso)
CREATE TABLE IF NOT EXISTS public.delivery_dispositivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID,
  device_id TEXT NOT NULL,
  device_name TEXT,
  ip_address TEXT,
  ultima_atividade TIMESTAMPTZ DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Métricas/Dashboard
CREATE TABLE IF NOT EXISTS public.delivery_metricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID,
  data_date DATE,
  pedidos_dia INTEGER DEFAULT 0,
  vendas_dia NUMERIC(10,2) DEFAULT 0,
  ticket_medio NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desabilitar RLS temporariamente
ALTER TABLE public.delivery_master DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_planos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assinaturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_pagamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_lojas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_motoboys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_dispositivos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_metricas DISABLE ROW LEVEL SECURITY;

-- Inserir Master inicial
INSERT INTO public.delivery_master (email, nome, password)
VALUES ('master@delivery2026.com', 'Administrador', 'master123')
ON CONFLICT (email) DO NOTHING;

-- Inserir Planos padrão
INSERT INTO public.delivery_planos (nome, descricao, preco_mensal, limite_lojas, fitur_pix, fitur_relatorios) VALUES
('Básico', '1 Loja, PIX manual', 49.90, 1, false, false),
('Intermediário', '1 Loja, PIX automático', 99.90, 1, true, false),
('Pro', '3 Lojas, PIX automático', 129.90, 3, true, true)
ON CONFLICT (nome) DO NOTHING;

-- Pronto! Execute este script no SQL Editor do Supabase