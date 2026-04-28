import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin, Truck, Clock, Search, CheckCircle, XCircle, Phone, Navigation, ArrowLeft } from 'lucide-react';

interface Pedido {
  id: string;
  created_at: string;
  cliente_nome: string;
  cliente_telefone: string;
  endereco: string;
  itens: any[];
  total: number;
  status: string;
  forma_pagamento: string;
  motivo?: string;
}

interface DeliveryLoja {
  id: string;
  nome_fantasia: string;
  endereco: string;
  lat?: number;
  lng?: number;
}

export default function Entregas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lojaIdParam = searchParams.get('loja');
  const lojaIdStored = localStorage.getItem('loja_id');
  const [lojaId, setLojaId] = useState<string | null>(lojaIdParam || lojaIdStored || null);
  const [loja, setLoja] = useState<DeliveryLoja | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<'pendentes' | 'entregando' | 'entregues'>('pendentes');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lojaId) {
      fetchLoja(lojaId);
      fetchPedidos();
      const interval = setInterval(() => fetchPedidos(), 30000);
      return () => clearInterval(interval);
    }
  }, [lojaId, filtro]);

  const fetchLoja = async (id: string) => {
    const { data } = await supabase
      .from('delivery_lojas')
      .select('id, nome_fantasia, endereco, lat, lng')
      .eq('id', id)
      .single();
    
    if (data) setLoja(data);
  };

  const fetchPedidos = async () => {
    if (!lojaId) return;

    let query = supabase
      .from('delivery_pedidos')
      .select('*')
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false });

    if (filtro === 'pendentes') {
      query = query.eq('status', 'recebido');
    } else if (filtro === 'entregando') {
      query = query.eq('status', 'entregando');
    } else {
      query = query.in('status', ['entregue', 'cancelado']);
    }

    const { data } = await query;
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

  const abrirMapa = (endereco: string) => {
    const enderecoEncoded = encodeURIComponent(endereco + ', ' + loja?.endereco || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${enderecoEncoded}`, '_blank');
  };

  const abrirWhatsApp = (telefone: string) => {
    const tel = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${tel}`, '_blank');
  };

  const pedidosFiltrados = pedidos.filter(p => 
    p.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.endereco.toLowerCase().includes(busca.toLowerCase())
  );

  const getStatusCor = (status: string) => {
    switch (status) {
      case 'recebido': return '#f59e0b';
      case 'entregando': return '#3b82f6';
      case 'entregue': return '#22c55e';
      case 'cancelado': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ background: '#3b82f6', padding: '1rem', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
              <Truck size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Entregas
            </h1>
            <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>{loja?.nome_fantasia}</p>
          </div>
          <button onClick={() => navigate(-1)} style={{ background: 'white', color: '#3b82f6', padding: '0.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
            Voltar
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div style={{ display: 'flex', padding: '0.5rem', background: 'white', borderBottom: '1px solid #ddd', gap: '0.5rem' }}>
        {[
          { key: 'pendentes', label: 'Pendentes', icon: Clock },
          { key: 'entregando', label: 'Entregando', icon: Truck },
          { key: 'entregues', label: 'Concluídos', icon: CheckCircle },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key as any)}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: filtro === f.key ? '#3b82f6' : '#f5f5f5',
              color: filtro === f.key ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            <f.icon size={14} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div style={{ padding: '0.5rem', background: 'white' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.5rem', top: '0.5rem', color: '#999' }} />
          <input
            type="text"
            placeholder="Buscar por cliente ou endereço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.5rem 0.5rem 2rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {/* Lista de pedidos */}
      <div style={{ padding: '0.5rem' }}>
        {pedidosFiltrados.map(pedido => (
          <div key={pedido.id} style={{ background: 'white', marginBottom: '0.5rem', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{pedido.cliente_nome}</div>
                  <div style={{ fontSize: '0.875rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Phone size={12} />
                    {pedido.cliente_telefone}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem', color: '#22c55e' }}>R$ {pedido.total.toFixed(2)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.25rem', fontSize: '0.875rem' }}>
                <MapPin size={14} style={{ marginTop: '2px', color: '#3b82f6' }} />
                <span>{pedido.endereco}</span>
              </div>

              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666' }}>
                {pedido.itens?.map((item: any, i: number) => (
                  <span key={i}>{item.quantidade}x {item.nome}{i < pedido.itens.length - 1 ? ', ' : ''}</span>
                ))}
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.25rem 0.5rem', 
                  background: getStatusCor(pedido.status) + '20', 
                  color: getStatusCor(pedido.status),
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  {pedido.status === 'recebido' ? 'Pendente' : 
                   pedido.status === 'entregando' ? 'Saiu p/ entrega' :
                   pedido.status === 'entregue' ? 'Entregue' : 'Cancelado'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                  {pedido.forma_pagamento === 'pix' ? 'PIX' : 'Dinheiro'}
                </span>
              </div>
            </div>

            {/* Ações */}
            {pedido.status === 'recebido' && (
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem' }}>
                <button
                  onClick={() => atualizarStatus(pedido.id, 'entregando')}
                  disabled={loading}
                  style={{ flex: 1, padding: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  <Navigation size={14} style={{ marginRight: '0.25rem' }} />
                  Iniciar Entrega
                </button>
              </div>
            )}

            {pedido.status === 'entregando' && (
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem' }}>
                <button
                  onClick={() => abrirMapa(pedido.endereco)}
                  style={{ flex: 1, padding: '0.5rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  <MapPin size={14} style={{ marginRight: '0.25rem' }} />
                  Ver Mapa
                </button>
                <button
                  onClick={() => atualizarStatus(pedido.id, 'entregue')}
                  disabled={loading}
                  style={{ flex: 1, padding: '0.5rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  <CheckCircle size={14} style={{ marginRight: '0.25rem' }} />
                  Entregue
                </button>
              </div>
            )}

            {(pedido.status === 'entregando' || pedido.status === 'recebido') && (
              <div style={{ padding: '0 0.5rem 0.5rem' }}>
                <button
                  onClick={() => atualizarStatus(pedido.id, 'cancelado')}
                  disabled={loading}
                  style={{ width: '100%', padding: '0.5rem', background: 'white', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  <XCircle size={14} style={{ marginRight: '0.25rem' }} />
                  Cancelar Pedido
                </button>
              </div>
            )}
          </div>
        ))}

        {pedidosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <Truck size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>Nenhum pedido {filtro === 'pendentes' ? 'pendente' : filtro === 'entregando' ? 'em entrega' : 'concluído'}</p>
          </div>
        )}
      </div>
    </div>
  );
}