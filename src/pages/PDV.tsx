import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Plus, Minus, Trash2, Search, DollarSign, Save, X } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  foto_url?: string;
  disponivel: boolean;
}

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export default function PDV() {
  const [searchParams] = useSearchParams();
  const lojaId = searchParams.get('loja');
  
  const [loja, setLoja] = useState<any>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'debito' | 'credito'>('dinheiro');
  const [valorRecebido, setValorRecebido] = useState('');
  const [troco, setTroco] = useState(0);
  const [showFinalizar, setShowFinalizar] = useState(false);

  useEffect(() => {
    if (lojaId) {
      fetchLoja();
      fetchProdutos();
    }
  }, [lojaId]);

  const fetchLoja = async () => {
    const { data } = await supabase.from('delivery_lojas').select('*').eq('id', lojaId).single();
    if (data) setLoja(data);
  };

  const fetchProdutos = async () => {
    const { data } = await supabase.from('delivery_produtos').select('*').eq('loja_id', lojaId).eq('disponivel', true).order('nome');
    if (data) setProdutos(data);
  };

  const adicionar = (produto: Produto) => {
    const existente = carrinho.find(item => item.produto.id === produto.id);
    if (existente) {
      setCarrinho(carrinho.map(item => item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item));
    } else {
      setCarrinho([...carrinho, { produto, quantidade: 1 }]);
    }
  };

  const remover = (produtoId: string) => {
    setCarrinho(carrinho.filter(item => item.produto.id !== produtoId));
  };

  const atualizarQtd = (produtoId: string, delta: number) => {
    setCarrinho(carrinho.map(item => {
      if (item.produto.id === produtoId) {
        const novaQtd = item.quantidade + delta;
        return { ...item, quantidade: novaQtd > 0 ? novaQtd : 0 };
      }
      return item;
    }).filter(item => item.quantidade > 0));
  };

  const calcularTotal = () => {
    return carrinho.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0);
  };

  useEffect(() => {
    setTotal(calcularTotal());
  }, [carrinho]);

  useEffect(() => {
    const valor = parseFloat(valorRecebido) || 0;
    setTroco(valor - total);
  }, [valorRecebido, total]);

  const finalizarVenda = async () => {
    if (!lojaId || carrinho.length === 0) return;
    setLoading(true);

    const itens = carrinho.map(item => ({
      produto_id: item.produto.id,
      nome: item.produto.nome,
      quantidade: item.quantidade,
      preco: item.produto.preco
    }));

    const { error } = await supabase.from('delivery_pedidos').insert({
      loja_id: lojaId,
      cliente_nome: 'PDV - Balcão',
      cliente_telefone: '',
      endereco: 'Retirada balcão',
      itens,
      subtotal: total,
      taxa_entrega: 0,
      total,
      forma_pagamento: formaPagamento,
      status: 'recebido'
    });

    if (!error) {
      setCarrinho([]);
      setShowFinalizar(false);
      alert('Venda finalizada!');
    }
    setLoading(false);
  };

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const corApp = loja?.cor || '#22c55e';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f5f5' }}>
      {/* Lista de produtos */}
      <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: corApp }}>PDV - {loja?.nome_fantasia}</h2>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '0.5rem', top: '0.5rem', color: '#999' }} />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ padding: '0.5rem 0.5rem 0.5rem 2rem', border: '1px solid #ddd', borderRadius: '4px', width: '200px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
          {produtosFiltrados.map(produto => (
            <button
              key={produto.id}
              onClick={() => adicionar(produto)}
              style={{
                padding: '1rem',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{produto.nome}</div>
              <div style={{ color: corApp, fontWeight: 600 }}>R$ {produto.preco.toFixed(2)}</div>
            </button>
          ))}
        </div>

        {produtosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Nenhum produto cadastrado
          </div>
        )}
      </div>

      {/* Carrinho */}
      <div style={{ width: '350px', background: 'white', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={20} /> Carrinho
          </h3>
          <span style={{ background: corApp, color: 'white', padding: '0.25rem 0.5rem', borderRadius: '50px', fontSize: '0.875rem' }}>
            {carrinho.reduce((acc, item) => acc + item.quantidade, 0)}
          </span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
          {carrinho.map(item => (
            <div key={item.produto.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.produto.nome}</div>
                <div style={{ color: corApp, fontWeight: 600 }}>R$ {(item.produto.preco * item.quantidade).toFixed(2)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button onClick={() => atualizarQtd(item.produto.id, -1)} style={{ padding: '0.25rem', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  <Minus size={14} />
                </button>
                <span style={{ width: '30px', textAlign: 'center' }}>{item.quantidade}</span>
                <button onClick={() => atualizarQtd(item.produto.id, 1)} style={{ padding: '0.25rem', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  <Plus size={14} />
                </button>
                <button onClick={() => remover(item.produto.id)} style={{ padding: '0.25rem', background: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'red' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid #ddd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
            <span>Total</span>
            <span style={{ color: corApp }}>R$ {total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setShowFinalizar(true)}
            disabled={carrinho.length === 0}
            style={{ width: '100%', padding: '1rem', background: corApp, color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: carrinho.length === 0 ? 'not-allowed' : 'pointer', opacity: carrinho.length === 0 ? 0.5 : 1 }}
          >
            Finalizar Venda
          </button>
        </div>
      </div>

      {/* Modal Finalizar */}
      {showFinalizar && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', width: '90%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Finalizar Venda</h3>
              <button onClick={() => setShowFinalizar(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Forma de Pagamento</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {['dinheiro', 'pix', 'debito', 'credito'].map(forma => (
                  <button
                    key={forma}
                    onClick={() => setFormaPagamento(forma as any)}
                    style={{ padding: '0.75rem', background: formaPagamento === forma ? corApp : '#f5f5f5', color: formaPagamento === forma ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', textTransform: 'capitalize' }}
                  >
                    {forma === 'dinheiro' ? '💵 Dinheiro' : forma === 'pix' ? '📱 PIX' : forma === 'debito' ? '💳 Débito' : '💳 Crédito'}
                  </button>
                ))}
              </div>
            </div>

            {formaPagamento === 'dinheiro' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Valor Recebido</label>
                <input
                  type="number"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                {troco > 0 && (
                  <div style={{ marginTop: '0.5rem', color: '#22c55e', fontWeight: 600 }}>
                    Troco: R$ {troco.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={finalizarVenda}
              disabled={loading || (formaPagamento === 'dinheiro' && parseFloat(valorRecebido) < total)}
              style={{ width: '100%', padding: '1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: (loading || (formaPagamento === 'dinheiro' && parseFloat(valorRecebido) < total)) ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Processando...' : `Finalizar - R$ ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}