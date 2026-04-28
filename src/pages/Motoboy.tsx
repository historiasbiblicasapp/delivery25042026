import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapPin, Phone, Package, CheckCircle, Navigation, Clock, PhoneCall, ArrowLeft } from 'lucide-react';

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
}

export default function Motoboy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lojaIdParam = searchParams.get('loja');
  const lojaIdStored = localStorage.getItem('loja_id');
  const lojaId = lojaIdParam || lojaIdStored;
  
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (lojaId) {
      fetchPedidos();
      const interval = setInterval(() => fetchPedidos(), 15000);
      return () => clearInterval(interval);
    }
  }, [lojaId]);

  const fetchPedidos = async () => {
    if (!lojaId) return;

    const { data } = await supabase
      .from('delivery_pedidos')
      .select('*')
      .eq('loja_id', lojaId)
      .eq('status', 'entregando')
      .order('created_at', { ascending: true });

    if (data) setPedidos(data);
  };

  const confirmarEntrega = async (pedidoId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('delivery_pedidos')
      .update({ status: 'entregue' })
      .eq('id', pedidoId);

    if (error) {
      setMessage('Erro ao confirmar');
    } else {
      setMessage('✅ Entrega confirmada!');
      fetchPedidos();
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const abrirMapa = (endereco: string) => {
    const enderecoEncoded = encodeURIComponent(endereco);
    window.open(`https://www.google.com/maps/search/?api=1&query=${enderecoEncoded}`, '_blank');
  };

  const abrirWhatsApp = (telefone: string) => {
    const tel = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${tel}`, '_blank');
  };

  const fazerLigacao = (telefone: string) => {
    window.location.href = `tel:${telefone}`;
  };

  if (pedidos.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#f59e0b', padding: '1rem', color: 'white' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            🛵 Motoboy - Entregas
          </h1>
          <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>Aguardando pedidos...</p>
        </header>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <Clock size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ color: '#666' }}>Nenhum pedido para entrega no momento.</p>
            <p style={{ color: '#999', fontSize: '0.875rem' }}>Aguarde novos pedidos.</p>
            <button 
              onClick={fetchPedidos}
              style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              🔄 Atualizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ background: '#f59e0b', padding: '1rem', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>🛵 Motoboy</h1>
              <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>{pedidos.length} pedido(s) para entrega</p>
            </div>
          </div>
          <button 
            onClick={fetchPedidos}
            style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          >
            🔄
          </button>
        </div>
      </header>

      {message && (
        <div style={{ background: message.includes('Erro') ? '#fee2e2' : '#dcfce7', color: message.includes('Erro') ? '#991b1b' : '#166534', padding: '0.75rem', margin: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
          {message}
        </div>
      )}

      {/* Lista de pedidos */}
      <div style={{ padding: '0.5rem' }}>
        {pedidos.map(pedido => (
          <div key={pedido.id} style={{ background: 'white', marginBottom: '0.75rem', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{pedido.cliente_nome}</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#22c55e' }}>R$ {Number(pedido.total).toFixed(2)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    {pedido.forma_pagamento === 'pix' ? 'PIX' : 'Dinheiro'}
                  </div>
                </div>
              </div>

              <div style={{ background: '#f5f5f5', padding: '0.75rem', borderRadius: '4px', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <MapPin size={20} style={{ color: '#f59e0b', marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>Endereço de Entrega</div>
                    <div style={{ color: '#333' }}>{pedido.endereco}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Itens:</div>
                {pedido.itens?.map((item: any, i: number) => (
                  <div key={i} style={{ fontSize: '0.875rem', color: '#666' }}>
                    {item.quantidade}x {item.nome}
                  </div>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', padding: '0.5rem' }}>
              <button
                onClick={() => abrirWhatsApp(pedido.cliente_telefone)}
                style={{ padding: '0.75rem', background: '#25d366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.875rem' }}
              >
                <PhoneCall size={16} /> WhatsApp
              </button>
              <button
                onClick={() => fazerLigacao(pedido.cliente_telefone)}
                style={{ padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.875rem' }}
              >
                <Phone size={16} /> Ligar
              </button>
              <button
                onClick={() => abrirMapa(pedido.endereco)}
                style={{ gridColumn: 'span 2', padding: '0.75rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.875rem' }}
              >
                <Navigation size={16} /> Abrir no Mapa
              </button>
              <button
                onClick={() => confirmarEntrega(pedido.id)}
                disabled={loading}
                style={{ gridColumn: 'span 2', padding: '1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
              >
                <CheckCircle size={20} /> Confirmar Entrega
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}