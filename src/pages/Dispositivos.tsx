import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Laptop, Smartphone, Tablet, Monitor, Users, Wifi, WifiOff } from 'lucide-react';

interface Dispositivo {
  id: string;
  device_id: string;
  device_name: string;
  ultima_atividade: string;
  ativo: boolean;
}

export default function Dispositivos() {
  const [searchParams] = useSearchParams();
  const lojaId = searchParams.get('loja');
  
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lojaId) {
      fetchDispositivos();
      const interval = setInterval(fetchDispositivos, 10000);
      return () => clearInterval(interval);
    }
  }, [lojaId]);

  const fetchDispositivos = async () => {
    if (!lojaId) return;
    
    const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data } = await supabase
      .from('delivery_dispositivos')
      .select('*')
      .eq('loja_id', lojaId)
      .eq('ativo', true)
      .gte('ultima_atividade', cincoMinutosAtras)
      .order('ultima_atividade', { ascending: false });
    
    if (data) setDispositivos(data);
    setLoading(false);
  };

  const getDeviceIcon = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('mobile') || n.includes('android') || n.includes('iphone')) return <Smartphone size={20} />;
    if (n.includes('tablet') || n.includes('ipad')) return <Tablet size={20} />;
    return <Laptop size={20} />;
  };

  const formatTempo = (data: string) => {
    const diff = Date.now() - new Date(data).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: '1rem', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Monitor size={24} /> Dispositivos Conectados
        </h2>
        <span style={{ background: '#22c55e', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.875rem', fontWeight: 600 }}>
          {dispositivos.length} online
        </span>
      </div>

      <div style={{ background: dispositivos.length > 0 ? '#dcfce7' : '#fee2e2', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {dispositivos.length > 0 ? <Wifi size={20} style={{ color: '#22c55e' }} /> : <WifiOff size={20} style={{ color: '#ef4444' }} />}
        <span style={{ color: dispositivos.length > 0 ? '#166534' : '#991b1b' }}>
          {dispositivos.length > 0 ? `${dispositivos.length} dispositivo(s) usando agora` : 'Nenhum dispositivo online'}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {dispositivos.map(d => (
          <div key={d.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#f5f5f5', padding: '0.75rem', borderRadius: '8px' }}>
              {getDeviceIcon(d.device_name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Dispositivo</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>{d.device_name?.substring(0, 40)}...</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: '#22c55e' }}>Online</div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>há {formatTempo(d.ultima_atividade)}</div>
            </div>
          </div>
        ))}
      </div>

      {dispositivos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <Users size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
          <p>Nenhum dispositivo conectado no momento</p>
          <p style={{ fontSize: '0.875rem' }}>Compartilhe o link com seus clientes para ver aqui</p>
        </div>
      )}

      <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '8px', fontSize: '0.875rem', color: '#666' }}>
        <strong>Como funciona:</strong>
        <ul style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}>
          <li>Cada dispositivo que acessa é detectado automaticamente</li>
          <li>Atualiza a cada 30 segundos</li>
          <li>Após 5 minutos inativo, aparece como offline</li>
        </ul>
      </div>
    </div>
  );
}