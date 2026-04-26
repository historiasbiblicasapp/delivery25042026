import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, MapPin } from 'lucide-react';

interface Delivery {
  id: string;
  nome_fantasia: string;
  endereco: string;
  cor: string;
  ativo: boolean;
}

export default function EscolherDelivery() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [deliverys, setDeliverys] = useState<Delivery[]>([]);

  useEffect(() => {
    fetchDeliverys();
  }, []);

  const fetchDeliverys = async () => {
    const { data } = await supabase
      .from('delivery_lojas')
      .select('id, nome_fantasia, endereco, cor, ativo')
      .eq('ativo', true)
      .order('nome_fantasia');
    
    if (data) setDeliverys(data);
  };

  const deliverysFiltrados = deliverys.filter(d => 
    d.nome_fantasia.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{ background: '#22c55e', padding: '2rem 1rem', color: 'white' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, textAlign: 'center' }}>Delivery 2026</h1>
        <p style={{ textAlign: 'center', opacity: 0.9, margin: '0.5rem 0 0' }}>Escolha um delivery</p>
      </header>

      <div style={{ padding: '1rem' }}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: '#999' }} />
          <input
            type="text"
            placeholder="Buscar delivery..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {deliverysFiltrados.map(delivery => (
            <button
              key={delivery.id}
              onClick={() => navigate(`/pedido?loja=${delivery.id}`)}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ 
                width: '50px', 
                height: '50px', 
                background: delivery.cor || '#22c55e', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                🍕
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{delivery.nome_fantasia}</div>
                <div style={{ fontSize: '0.875rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={14} />
                  {delivery.endereco || 'Sem endereço'}
                </div>
              </div>
            </button>
          ))}
        </div>

        {deliverysFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Nenhum delivery encontrado
          </div>
        )}
      </div>
    </div>
  );
}