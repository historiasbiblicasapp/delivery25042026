export interface Loja {
  id: string;
  nome: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  endereco: string;
  logo_url?: string;
  cor: string;
  ativo: boolean;
  taxa_entrega: number;
  preco_minimo: number;
  tempo_entrega_min: number;
  created_at: string;
}

export interface Produto {
  id: string;
  loja_id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  foto_url?: string;
  disponivel: boolean;
  created_at: string;
}

export interface Pedido {
  id: string;
  loja_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  endereco: string;
  itens: PedidoItem[];
  subtotal: number;
  taxa_entrega: number;
  total: number;
  forma_pagamento: 'pix' | 'dinheiro' | 'cartao';
  status: 'recebido' | 'preparando' | 'saiu' | 'entregue' | 'cancelado';
  entregador_id?: string;
  created_at: string;
}

export interface PedidoItem {
  produto_id: string;
  nome: string;
  quantidade: number;
  preco: number;
  observacao?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  enderecos: string[];
}