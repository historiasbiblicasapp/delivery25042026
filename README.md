# Delivery 2026

Sistema de delivery multi-lojas com app para clientes, motoboys e gestão.

## Módulos

- **Dashboard Master** (`/dashboard`) - Gestão de lojas
- **Cardápio Digital** (`/cardapio`) - Produtos por loja
- **Admin da Loja** (`/admin?loja=ID`) - Pedidos e configurações
- **App Cliente** (`/pedido?loja=ID`) - Fazer pedidos
- **Gestão Entregas** (`/entregas/ID`) - Acompanhar entregas
- **App Motoboy** (`/motoboy?loja=ID`) - Lista de entregas

## Setup

1. Criar projeto Supabase
2. Executar `supabase-schema.sql`
3. Configurar `src/lib/supabase.ts` com credenciais
4. Deploy (Vercel/Netlify)

## Acesso

- Master: `master@delivery2026.com` / `master123`