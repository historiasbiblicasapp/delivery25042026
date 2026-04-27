import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, Truck, DollarSign, MapPin, Clock, Edit2, Save, X, CreditCard } from 'lucide-react';

interface Loja {
  id: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  endereco: string;
  taxa_entrega: number;
  preco_minimo: number;
  tempo_entrega_min: number;
  cor: string;
  ativo: boolean;
}

interface Pedido {
  id: string;
  created_at: string;
  cliente_nome: string;
  total: number;
  status: string;
}

export default function AdminLoja() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lojaId = searchParams.get('loja');
  
  const [loja, setLoja] = useState<Loja | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [aba, setAba] = useState<'pedidos' | 'config' | 'pagamentos'>('pedidos');
  const [editForm, setEditForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (lojaId) {
      fetchLoja();
      fetchPedidos();
    }
  }, [lojaId]);

  const fetchLoja = async () => {
    const { data } = await supabase
      .from('delivery_lojas')
      .select('*')
      .eq('id', lojaId)
      .single();
    
    if (data) {
      setLoja(data);
      setEditForm(data);
    }
  };

  const fetchPedidos = async () => {
    const { data } = await supabase
      .from('delivery_pedidos')
      .select('id, created_at, cliente_nome, total, status')
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setPedidos(data);
  };

  const atualizarStatus = async (pedidoId: string, novoStatus: string) => {
    setLoading(true);
    await supabase
      .from('delivery_pedidos')
      .update({ status: novoStatus })
      .eq('id', pedidoId);
    
    fetchPedidos();
    setLoading(false);
  };

  const salvarConfig = async () => {
    if (!editForm || !lojaId) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('delivery_lojas')
      .update({
        nome_fantasia: editForm.nome_fantasia,
        telefone: editForm.telefone,
        endereco: editForm.endereco,
        taxa_entrega: editForm.taxa_entrega,
        preco_minimo: editForm.preco_minimo,
        tempo_entrega_min: editForm.tempo_entrega_min,
      })
      .eq('id', lojaId);
    
    if (error) {
      setMessage('Erro ao salvar');
    } else {
      setMessage('Configurações salvas!');
      fetchLoja();
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleAtivo = async () => {
    if (!loja) return;
    setLoading(true);
    await supabase
      .from('delivery_lojas')
      .update({ ativo: !loja.ativo })
      .eq('id', lojaId);
    
    fetchLoja();
    setLoading(false);
  };

  if (!loja) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }

  const corApp = loja.cor || '#22c55e';

  const pedidosPendentes = pedidos.filter(p => p.status === 'recebido').length;
  const totalHoje = pedidos
    .filter(p => new Date(p.created_at).toDateString() === new Date().toDateString())
    .reduce((acc, p) => acc + Number(p.total), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ background: corApp, padding: '1rem', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{loja.nome_fantasia}</h1>
            <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>
              {loja.ativo ? '✅ Delivery aberto' : '❌ Delivery fechado'}
            </p>
          </div>
          <button 
            onClick={() => navigate(`/entregas/${lojaId}`)}
            style={{ background: 'white', color: corApp, padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <Truck size={16} /> Entregas
          </button>
        </div>
      </header>

      {/* Menu */}
      <div style={{ display: 'flex', padding: '0.5rem', background: 'white', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setAba('pedidos')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: aba === 'pedidos' ? corApp : 'transparent',
            color: aba === 'pedidos' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Pedidos
        </button>
        <button
          onClick={() => setAba('config')}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: aba === 'config' ? corApp : 'transparent',
            color: aba === 'config' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Config
        </button>
        <button
          onClick={() => navigate(`/pagamentos?loja=${lojaId}`)}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'transparent',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem'
          }}
        >
          <CreditCard size={16} /> PIX
        </button>
      </div>

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', padding: '0.5rem' }}>
        <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: corApp }}>{pedidosPendentes}</div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>Pendentes</div>
        </div>
        <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#22c55e' }}>R$ {totalHoje.toFixed(0)}</div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>Hoje</div>
        </div>
        <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#3b82f6' }}>{pedidos.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>Total</div>
        </div>
      </div>

      {/* Aba Pedidos */}
      {aba === 'pedidos' && (
        <div style={{ padding: '0.5rem' }}>
          <button onClick={fetchPedidos} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: 'white', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
            🔄 Atualizar
          </button>
          
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {pedidos.map(pedido => (
              <div key={pedido.id} style={{ background: 'white', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{pedido.cliente_nome}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {new Date(pedido.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: '#22c55e' }}>R$ {Number(pedido.total).toFixed(2)}</div>
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  {pedido.status === 'recebido' && (
                    <>
                      <button
                        onClick={() => atualizarStatus(pedido.id, 'entregando')}
                        disabled={loading}
                        style={{ flex: 1, padding: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        🚚 Saiu p/ Entrega
                      </button>
                      <button
                        onClick={() => atualizarStatus(pedido.id, 'cancelado')}
                        disabled={loading}
                        style={{ padding: '0.5rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </>
                  )}
                  {pedido.status === 'entregando' && (
                    <>
                      <button
                        onClick={() => atualizarStatus(pedido.id, 'entregue')}
                        disabled={loading}
                        style={{ flex: 1, padding: '0.5rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ✅ Entregue
                      </button>
                    </>
                  )}
                  {pedido.status === 'entregue' && (
                    <span style={{ padding: '0.5rem', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '0.875rem' }}>
                      ✅ Concluído
                    </span>
                  )}
                  {pedido.status === 'cancelado' && (
                    <span style={{ padding: '0.5rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.875rem' }}>
                      ❌ Cancelado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pedidos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Nenhum pedido ainda
            </div>
          )}
        </div>
      )}

      {/* Aba Config */}
      {aba === 'config' && editForm && (
        <div style={{ padding: '0.5rem' }}>
          {message && (
            <div style={{ background: message.includes('salvo') ? '#dcfce7' : '#fee2e2', color: message.includes('salvo') ? '#166534' : '#991b1b', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
              {message}
            </div>
          )}

          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 1rem' }}>Informações</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Nome Fantasia</label>
              <input
                type="text"
                value={editForm.nome_fantasia}
                onChange={(e) => setEditForm({ ...editForm, nome_fantasia: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Telefone/WhatsApp</label>
              <input
                type="text"
                value={editForm.telefone || ''}
                onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                placeholder="11999999999"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Endereço</label>
              <input
                type="text"
                value={editForm.endereco || ''}
                onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })}
                placeholder="Rua, número - Cidade"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <button
              onClick={salvarConfig}
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 1rem' }}>Configurações de Entrega</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Taxa de Entrega (R$)</label>
              <input
                type="number"
                value={editForm.taxa_entrega}
                onChange={(e) => setEditForm({ ...editForm, taxa_entrega: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Pedido Mínimo (R$)</label>
              <input
                type="number"
                value={editForm.preco_minimo}
                onChange={(e) => setEditForm({ ...editForm, preco_minimo: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Tempo Entrega (min)</label>
              <input
                type="number"
                value={editForm.tempo_entrega_min}
                onChange={(e) => setEditForm({ ...editForm, tempo_entrega_min: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          </div>

          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 1rem' }}>Status da Loja</h3>
            <button
              onClick={toggleAtivo}
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', background: loja.ativo ? '#ef4444' : '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loja.ativo ? '🚫 Fechar Delivery' : '✅ Abrir Delivery'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}