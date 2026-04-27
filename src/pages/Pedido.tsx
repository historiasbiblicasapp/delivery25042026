import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { ShoppingCart, Plus, Minus, MapPin, CreditCard, Banknote, Send, Check, ChevronRight, X } from 'lucide-react';

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

interface Delivery {
  id: string;
  nome_fantasia: string;
  endereco: string;
  taxa_entrega: number;
  preco_minimo: number;
  tempo_entrega_min: number;
  cor: string;
}

export default function Pedido() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const deliveryId = searchParams.get('loja');
  
  // Tracking de dispositivo
  useDeviceTracking(deliveryId);
  
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [etapa, setEtapa] = useState<string>('cardapio');
  
  // Dados do cliente
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacao, setObservacao] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix'>('dinheiro');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (deliveryId) {
      fetchDelivery();
    }
  }, [deliveryId]);

  const fetchDelivery = async () => {
    if (!deliveryId) return;
    
    const { data, error } = await supabase
      .from('delivery_lojas')
      .select('*')
      .eq('id', deliveryId)
      .single();
    
    if (error) {
      console.log('Erro ao buscar loja:', error);
      return;
    }
    
    if (data) {
      setDelivery(data);
      fetchProdutos(data.id);
    }
  };

  const fetchProdutos = async (lojaId: string) => {
    const { data } = await supabase
      .from('delivery_produtos')
      .select('*')
      .eq('loja_id', lojaId)
      .eq('disponivel', true)
      .order('categoria, nome');
    
    if (data) setProdutos(data);
  };

  const adicionarAoCarrinho = (produto: Produto) => {
    setCarrinho(prev => {
      const existente = prev.find(item => item.produto.id === produto.id);
      if (existente) {
        return prev.map(item => item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item);
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const atualizarQuantidade = (produtoId: string, delta: number) => {
    setCarrinho(prev => prev.map(item => {
      if (item.produto.id === produtoId) {
        const novaQtd = item.quantidade + delta;
        return { ...item, quantidade: novaQtd > 0 ? novaQtd : 0 };
      }
      return item;
    }).filter(item => item.quantidade > 0));
  };

  const subtotal = carrinho.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0);
  const taxaEntrega = delivery?.taxa_entrega || 0;
  const total = subtotal + taxaEntrega;

  const fazerPedido = async () => {
    if (!delivery || !nome || !telefone || !endereco) return;
    if (subtotal < (delivery.preco_minimo || 0)) {
      setMensagem(`Pedido mínimo: R$ ${delivery.preco_minimo.toFixed(2)}`);
      return;
    }

    setLoading(true);
    
    const itens = carrinho.map(item => ({
      produto_id: item.produto.id,
      nome: item.produto.nome,
      quantidade: item.quantidade,
      preco: item.produto.preco
    }));

    const { error } = await supabase
      .from('delivery_pedidos')
      .insert({
        loja_id: delivery.id,
        cliente_nome: nome,
        cliente_telefone: telefone,
        endereco,
        itens,
        subtotal,
        taxa_entrega: taxaEntrega,
        total,
        forma_pagamento: formaPagamento,
        status: 'recebido'
      });

    if (error) {
      setMensagem('Erro ao fazer pedido');
    } else {
      setEtapa('confirmado');
      // Limpar carrinho
      setCarrinho([]);
    }
    setLoading(false);
  };

  const produtosPorCategoria = produtos.reduce((acc, prod) => {
    if (!acc[prod.categoria]) acc[prod.categoria] = [];
    acc[prod.categoria].push(prod);
    return acc;
  }, {} as Record<string, Produto[]>);

  const corApp = delivery?.cor || '#22c55e';

  // Se delivery não encontrado
  if (!delivery && deliveryId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Delivery não disponível</h2>
          <p style={{ color: '#666' }}>Esta loja está temporariamente indisponível.</p>
        </div>
      </div>
    );
  }

  // Pedido confirmado
  if (etapa === 'confirmado') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '1rem' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
          <div style={{ fontSize: '64px', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>Pedido Confirmado!</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Seu pedido foi enviado para <strong>{delivery?.nome_fantasia}</strong>
          </p>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            Tempo estimado: {delivery?.tempo_entrega_min} minutos
          </p>
          <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '1rem' }}>
            Você receberá uma confirmação pelo WhatsApp!
          </p>
          <a 
            href={`/?loja=${deliveryId}`}
            style={{ display: 'block', marginTop: '1.5rem', padding: '0.75rem', background: corApp, color: 'white', textDecoration: 'none', borderRadius: '4px' }}
          >
            Fazer novo pedido
          </a>
        </div>
      </div>
    );
  }

  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ background: corApp, padding: '1rem', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{delivery?.nome_fantasia}</h1>
            <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>⏱️ {delivery?.tempo_entrega_min} min | 🚚 R$ {taxaEntrega.toFixed(2)}</p>
          </div>
          <button 
            onClick={() => setEtapa(carrinho.length > 0 ? 'carrinho' : 'cardapio')}
            style={{ position: 'relative', background: 'white', padding: '0.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          >
            <ShoppingCart size={24} color={corApp} />
            {totalItens > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalItens}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Etapas */}
      {etapa !== 'cardapio' && etapa !== 'confirmado' && etapa !== 'carrinho' && etapa !== 'dados' && etapa !== 'pagamento' && (
        <div style={{ display: 'flex', padding: '0.5rem', background: 'white', borderBottom: '1px solid #ddd' }}>
          {['carrinho', 'dados', 'pagamento'].map((e, i) => (
            <div key={e} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ 
                fontSize: '0.75rem', 
                color: etapa === e ? corApp : '#999',
                fontWeight: etapa === e ? 600 : 400
              }}>
                {i + 1}. {e === 'dados' ? 'Endereço' : e.charAt(0).toUpperCase() + e.slice(1)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cardápio */}
      {etapa === 'cardapio' && (
        <div style={{ padding: '1rem' }}>
          {Object.entries(produtosPorCategoria).map(([categoria, lista]) => (
            <div key={categoria} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {categoria}
              </h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {lista.map(produto => (
                  <div key={produto.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{produto.nome}</div>
                      {produto.descricao && <div style={{ fontSize: '0.875rem', color: '#666' }}>{produto.descricao}</div>}
                      <div style={{ color: corApp, fontWeight: 600, marginTop: '0.25rem' }}>R$ {produto.preco.toFixed(2)}</div>
                    </div>
                    <button 
                      onClick={() => adicionarAoCarrinho(produto)}
                      style={{ background: corApp, color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer' }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {produtos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Nenhum produto disponível no momento
            </div>
          )}
        </div>
      )}

      {/* Carrinho */}
      {etapa === 'carrinho' && (
        <div style={{ padding: '1rem' }}>
          <button onClick={() => setEtapa('cardapio')} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: corApp, cursor: 'pointer' }}>
            ← Voltar ao cardápio
          </button>
          
          {carrinho.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Carrinho vazio
            </div>
          ) : (
            <>
              <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                {carrinho.map(item => (
                  <div key={item.produto.id} style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.produto.nome}</div>
                      <div style={{ color: corApp, fontWeight: 600 }}>R$ {(item.produto.preco * item.quantidade).toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => atualizarQuantidade(item.produto.id, -1)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer' }}>
                        <Minus size={16} />
                      </button>
                      <span style={{ width: '30px', textAlign: 'center' }}>{item.quantidade}</span>
                      <button onClick={() => atualizarQuantidade(item.produto.id, 1)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer' }}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Taxa entrega</span>
                  <span>R$ {taxaEntrega.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.125rem', borderTop: '1px solid #ddd', paddingTop: '0.5rem' }}>
                  <span>Total</span>
                  <span style={{ color: corApp }}>R$ {total.toFixed(2)}</span>
                </div>
              </div>

              {subtotal < (delivery?.preco_minimo || 0) && (
                <p style={{ color: 'red', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Pedido mínimo: R$ {delivery?.preco_minimo.toFixed(2)}
                </p>
              )}

              <button 
                onClick={() => setEtapa('dados')}
                disabled={subtotal < (delivery?.preco_minimo || 0)}
                style={{ width: '100%', padding: '1rem', background: corApp, color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: subtotal < (delivery?.preco_minimo || 0) ? 'not-allowed' : 'pointer', opacity: subtotal < (delivery?.preco_minimo || 0) ? 0.5 : 1 }}
              >
                Continuar
              </button>
            </>
          )}
        </div>
      )}

      {/* Dados do cliente */}
      {etapa === 'dados' && (
        <div style={{ padding: '1rem' }}>
          <button onClick={() => setEtapa('carrinho')} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: corApp, cursor: 'pointer' }}>
            ← Voltar ao carrinho
          </button>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Seu nome" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>WhatsApp *</label>
            <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} required placeholder="11999999999" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Endereço de entrega *</label>
            <textarea value={endereco} onChange={(e) => setEndereco(e.target.value)} required placeholder="Rua, número, complemento, ponto de referência" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }} />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Observação</label>
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Sem cebola,地址pecificações, etc." style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }} />
          </div>

          <button 
            onClick={() => { if (nome && telefone && endereco) setEtapa('pagamento') }}
            disabled={!nome || !telefone || !endereco}
            style={{ width: '100%', padding: '1rem', background: corApp, color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: !nome || !telefone || !endereco ? 'not-allowed' : 'pointer', opacity: !nome || !telefone || !endereco ? 0.5 : 1 }}
          >
            Continuar para pagamento
          </button>
        </div>
      )}

      {/* Pagamento */}
      {etapa === 'pagamento' && (
        <div style={{ padding: '1rem' }}>
          <button onClick={() => setEtapa('dados')} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: corApp, cursor: 'pointer' }}>
            ← Voltar
          </button>

          <h3 style={{ marginBottom: '1rem' }}>Forma de Pagamento</h3>
          
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            <button 
              onClick={() => setFormaPagamento('dinheiro')}
              style={{ padding: '1rem', background: formaPagamento === 'dinheiro' ? corApp : 'white', color: formaPagamento === 'dinheiro' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <Banknote size={24} />
              <div>
                <div style={{ fontWeight: 600 }}>Dinheiro</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Pague na entrega</div>
              </div>
            </button>
            
            <button 
              onClick={() => setFormaPagamento('pix')}
              style={{ padding: '1rem', background: formaPagamento === 'pix' ? corApp : 'white', color: formaPagamento === 'pix' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <CreditCard size={24} />
              <div>
                <div style={{ fontWeight: 600 }}>PIX</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Chave: (será enviada após confirmar)</div>
              </div>
            </button>
          </div>

          {mensagem && (
            <p style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', background: '#fee2e2', borderRadius: '4px' }}>
              {mensagem}
            </p>
          )}

          <button 
            onClick={fazerPedido}
            disabled={loading}
            style={{ width: '100%', padding: '1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading ? 'Enviando...' : <><Send size={20} /> Confirmar Pedido</>}
          </button>
        </div>
      )}
    </div>
  );
}