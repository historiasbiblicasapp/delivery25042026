import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Store, Plus, Edit2, Trash2, X, Lock, Unlock, DollarSign, BarChart3, CreditCard, TrendingUp, Calendar, Package, Download } from 'lucide-react';

interface Loja {
  id: string;
  nome: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  endereco: string;
  cor: string;
  ativo: boolean;
  taxa_entrega: number;
  preco_minimo: number;
  tempo_entrega_min: number;
}

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  preco_mensal: number;
  limite_lojas: number;
  fitur_pix: boolean;
  fitur_relatorios: boolean;
  ativo: boolean;
}

interface Assinatura {
  id: string;
  loja_id: string;
  plano_id: string;
  status: string;
  data_fim: string;
}

interface Metricas {
  total_pedidos: number;
  total_vendas: number;
  ticket_medio: number;
  pedidos_hoje: number;
  vendas_hoje: number;
  pedidos_no_periodo: number;
  vendas_no_periodo: number;
}

const cores = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', 
  '#f59e0b', '#ef4444', '#14b8a6', '#6366f1'
];

export default function Dashboard() {
  const { masterProfile } = useAuth();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [metricas, setMetricas] = useState<Metricas>({ total_pedidos: 0, total_vendas: 0, ticket_medio: 0, pedidos_hoje: 0, vendas_hoje: 0, pedidos_no_periodo: 0, vendas_no_periodo: 0 });
  const [aba, setAba] = useState<'lojas' | 'planos' | 'metricas'>('lojas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editLoja, setEditLoja] = useState<Loja | null>(null);
  const [form, setForm] = useState({
    nome: '',
    nome_fantasia: '',
    email: '',
    telefone: '',
    endereco: '',
    taxa_entrega: 5,
    preco_minimo: 20,
    tempo_entrega_min: 40,
    cor: '#22c55e'
  });

  useEffect(() => {
    fetchLojas();
    fetchPlanos();
    fetchMetricas();
  }, []);

  const fetchLojas = async () => {
    const { data } = await supabase.from('delivery_lojas').select('*').order('nome');
    if (data) setLojas(data);
  };

  const fetchPlanos = async () => {
    const { data, error } = await supabase.from('delivery_planos').select('*').order('preco_mensal');
    if (data && data.length > 0) setPlanos(data);
  };

  const fetchMetricas = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    let query = supabase.from('delivery_pedidos').select('id, created_at, total');
    
    const { data: pedidos } = await query;
    
    if (pedidos) {
      let pedidosFiltrados = pedidos;
      
      if (dataInicio && dataFim) {
        pedidosFiltrados = pedidos.filter(p => {
          const data = p.created_at.split('T')[0];
          return data >= dataInicio && data <= dataFim;
        });
      } else if (dataInicio) {
        pedidosFiltrados = pedidos.filter(p => p.created_at.split('T')[0] >= dataInicio);
      } else if (dataFim) {
        pedidosFiltrados = pedidos.filter(p => p.created_at.split('T')[0] <= dataFim);
      } else {
        pedidosFiltrados = pedidos.filter(p => p.created_at.startsWith(hoje));
      }
      
      const hojePedidos = pedidos.filter(p => p.created_at.startsWith(hoje));
      const totalVendas = pedidos.reduce((acc, p) => acc + Number(p.total), 0);
      const vendasHoje = hojePedidos.reduce((acc, p) => acc + Number(p.total), 0);
      const vendasPeriodo = pedidosFiltrados.reduce((acc, p) => acc + Number(p.total), 0);
      
      setMetricas({
        total_pedidos: pedidos.length,
        total_vendas: totalVendas,
        ticket_medio: pedidos.length > 0 ? totalVendas / pedidos.length : 0,
        pedidos_hoje: hojePedidos.length,
        vendas_hoje: vendasHoje,
        pedidos_no_periodo: pedidosFiltrados.length,
        vendas_no_periodo: vendasPeriodo
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editLoja) {
      const { error } = await supabase.from('delivery_lojas').update(form).eq('id', editLoja.id);
      if (error) setMessage('Erro ao atualizar');
      else { setMessage('Loja atualizada!'); fetchLojas(); }
    } else {
      const { error } = await supabase.from('delivery_lojas').insert({ ...form, ativo: true });
      if (error) setMessage('Erro: ' + error.message);
      else { setMessage('Loja criada!'); fetchLojas(); }
    }
    setLoading(false);
    setShowModal(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleAtivo = async (loja: Loja) => {
    await supabase.from('delivery_lojas').update({ ativo: !loja.ativo }).eq('id', loja.id);
    fetchLojas();
  };

  const excluirLoja = async (id: string) => {
    if (!confirm('Excluir loja?')) return;
    await supabase.from('delivery_lojas').delete().eq('id', id);
    fetchLojas();
  };

  const editarLoja = (loja: Loja) => {
    setEditLoja(loja);
    setForm({
      nome: loja.nome,
      nome_fantasia: loja.nome_fantasia,
      email: loja.email,
      telefone: loja.telefone || '',
      endereco: loja.endereco || '',
      taxa_entrega: loja.taxa_entrega,
      preco_minimo: loja.preco_minimo,
      tempo_entrega_min: loja.tempo_entrega_min,
      cor: loja.cor
    });
    setShowModal(true);
  };

  return (
    <div style={{ padding: '1rem', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Abas */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { key: 'lojas', label: 'Lojas', icon: Store },
          { key: 'planos', label: 'Planos', icon: DollarSign },
          { key: 'metricas', label: 'Métricas', icon: BarChart3 },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setAba(item.key as any)}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: aba === item.key ? '#22c55e' : 'white',
              color: aba === item.key ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 600
            }}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </div>

      {message && (
        <div style={{ background: message.includes('sucesso') || message.includes('criada') || message.includes('atualizada') ? '#dcfce7' : '#fee2e2', color: message.includes('sucesso') || message.includes('criada') || message.includes('atualizada') ? '#166534' : '#991b1b', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {/* Aba Lojas */}
      {aba === 'lojas' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Deliverys ({lojas.length})</h2>
            <button onClick={() => { setEditLoja(null); setForm({ nome: '', nome_fantasia: '', email: '', telefone: '', endereco: '', taxa_entrega: 5, preco_minimo: 20, tempo_entrega_min: 40, cor: '#22c55e' }); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              <Plus size={18} /> Nova Loja
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {lojas.map(loja => (
              <div key={loja.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${loja.cor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{loja.nome_fantasia || loja.nome}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>ID: {loja.id.substring(0, 8)}...</p>
                  </div>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', background: loja.ativo ? '#dcfce7' : '#fee2e2', color: loja.ativo ? '#166534' : '#991b1b' }}>
                    {loja.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                  <p>📍 {loja.endereco || 'Sem endereço'}</p>
                  <p>💰 Entrega: R$ {loja.taxa_entrega} | Mín: R$ {loja.preco_minimo}</p>
                  <p>⏱️ {loja.tempo_entrega_min} min</p>
                  <p style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', background: '#f5f5f5', borderRadius: '4px', fontSize: '0.75rem' }}>
                    🔗 {window.location.origin}/pedido?loja={loja.id}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => editarLoja(loja)} style={{ flex: 1, padding: '0.5rem', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    <Edit2 size={14} /> Editar
                  </button>
                  <button onClick={() => toggleAtivo(loja)} style={{ flex: 1, padding: '0.5rem', background: loja.ativo ? '#fee2e2' : '#dcfce7', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {loja.ativo ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <button onClick={() => excluirLoja(loja.id)} style={{ padding: '0.5rem', background: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'red' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Aba Planos */}
      {aba === 'planos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Planos</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {planos.map(plano => (
              <div key={plano.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: plano.nome === 'Pro' ? '2px solid #22c55e' : plano.nome === 'Intermediário' ? '2px solid #3b82f6' : '1px solid #ddd' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{plano.nome}</h3>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.5rem 0' }}>{plano.descricao}</p>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: '#22c55e', marginBottom: '1rem' }}>
                  R$ {plano.preco_mensal.toFixed(2)}
                  <span style={{ fontSize: '1rem', color: '#666' }}>/mês</span>
                </div>
                <ul style={{ fontSize: '0.875rem', color: '#666', paddingLeft: '1rem' }}>
                  <li>{plano.limite_lojas} {plano.limite_lojas === 1 ? 'Loja' : 'Lojas'}</li>
                  <li>{plano.fitur_pix ? '✅ PIX automático' : '❌ Sem PIX automático'}</li>
                  <li>{plano.fitur_pix ? '✅ PIX manual disponível' : '✅ PIX manual disponível'}</li>
                  <li>{plano.fitur_relatorios ? '✅ Relatórios' : '❌ Sem relatórios'}</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aba Métricas */}
      {aba === 'metricas' && (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Dashboard</h2>
          
          {/* Filtros de data */}
          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="Data início" />
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="Data fim" />
              <button onClick={fetchMetricas} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Filtrar</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>
                Período: {metricas.pedidos_no_periodo} pedidos = R$ {metricas.vendas_no_periodo.toFixed(2)}
              </span>
              <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <Download size={16} /> Exportar PDF
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <Package size={32} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{metricas.total_pedidos}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Pedidos</div>
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <TrendingUp size={32} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>R$ {metricas.total_vendas.toFixed(2)}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Vendas</div>
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <BarChart3 size={32} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>R$ {metricas.ticket_medio.toFixed(2)}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Ticket Médio</div>
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <Calendar size={32} style={{ color: '#8b5cf6', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{metricas.pedidos_hoje}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Pedidos Hoje</div>
            </div>
          </div>

          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Vendas Hoje: R$ {metricas.vendas_hoje.toFixed(2)}</h3>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflow: 'auto' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editLoja ? 'Editar' : 'Nova'} Loja</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome *</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome Fantasia *</label>
                <input type="text" value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} required placeholder="Ex: Pizza Express" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editLoja} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', background: editLoja ? '#f5f5f5' : 'white' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Telefone</label>
                <input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="11999999999" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Endereço</label>
                <input type="text" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Av. Principal, 100 - Cidade" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Taxa Entrega (R$)</label>
                <input type="number" value={form.taxa_entrega} onChange={(e) => setForm({ ...form, taxa_entrega: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Pedido Mínimo (R$)</label>
                <input type="number" value={form.preco_minimo} onChange={(e) => setForm({ ...form, preco_minimo: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tempo Entrega (min)</label>
                <input type="number" value={form.tempo_entrega_min} onChange={(e) => setForm({ ...form, tempo_entrega_min: parseInt(e.target.value) })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Cor do App</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {cores.map(cor => (
                    <button type="button" key={cor} onClick={() => setForm({ ...form, cor })} style={{ width: '36px', height: '36px', background: cor, border: form.cor === cor ? '3px solid #333' : 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}