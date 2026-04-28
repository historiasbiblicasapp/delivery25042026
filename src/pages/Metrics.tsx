import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BarChart3, Download, Calendar, ArrowLeft } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface Metricas {
  total_pedidos: number;
  total_vendas: number;
  ticket_medio: number;
  pedidos_hoje: number;
  vendas_hoje: number;
}

export default function Metrics() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lojaId = searchParams.get('loja') || localStorage.getItem('loja_id');
  const [dataInicio, setDataInicio] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [metricas, setMetricas] = useState<Metricas>({ total_pedidos: 0, total_vendas: 0, ticket_medio: 0, pedidos_hoje: 0, vendas_hoje: 0 });
  const [loja, setLoja] = useState<{nome_fantasia: string, cor: string} | null>(null);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lojaId) {
      fetchLoja();
      fetchMetricas();
      fetchPedidos();
    }
  }, [lojaId, dataInicio, dataFim]);

  const fetchLoja = async () => {
    const { data } = await supabase.from('delivery_lojas').select('nome_fantasia, cor').eq('id', lojaId).single();
    if (data) setLoja(data);
  };

  const fetchMetricas = async () => {
    const inicio = startOfDay(new Date(dataInicio));
    const fim = endOfDay(new Date(dataFim));
    const { data } = await supabase
      .from('delivery_pedidos')
      .select('total, created_at')
      .eq('loja_id', lojaId)
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fim.toISOString());
    
    if (data) {
      const hoje = startOfDay(new Date());
      const hojeData = data.filter((p: any) => new Date(p.created_at) >= hoje);
      const totalVendas = data.reduce((acc, p) => acc + Number(p.total), 0);
      const vendasHoje = hojeData.reduce((acc, p) => acc + Number(p.total), 0);
      setMetricas({
        total_pedidos: data.length,
        total_vendas: totalVendas,
        ticket_medio: data.length ? totalVendas / data.length : 0,
        pedidos_hoje: hojeData.length,
        vendas_hoje: vendasHoje
      });
    }
  };

  const fetchPedidos = async () => {
    const inicio = startOfDay(new Date(dataInicio));
    const fim = endOfDay(new Date(dataFim));
    const { data } = await supabase
      .from('delivery_pedidos')
      .select('*')
      .eq('loja_id', lojaId)
      .gte('created_at', inicio.toISOString())
      .lte('created_at', fim.toISOString())
      .order('created_at', { ascending: false });
    if (data) setPedidos(data);
  };

  const gerarLink = async () => {
    const url = `${window.location.origin}/pedido?loja=${lojaId}`;
    await navigator.clipboard.writeText(url);
    alert('Link copiado: ' + url);
  };

  const exportarPDF = () => {
    const content = `
RELATÓRIO DE VENDAS - ${loja?.nome_fantasia}
Período: ${format(new Date(dataInicio), 'dd/MM/yyyy')} até ${format(new Date(dataFim), 'dd/MM/yyyy')}
Total Pedidos: ${metricas.total_pedidos}
Total Vendas: R$ ${metricas.total_vendas.toFixed(2)}
Ticket Médio: R$ ${metricas.ticket_medio.toFixed(2)}
Pedidos Hoje: ${metricas.pedidos_hoje}
Vendas Hoje: R$ ${metricas.vendas_hoje.toFixed(2)}
    `.trim();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${loja?.nome_fantasia}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
  };

  const cor = loja?.cor || '#22c55e';
  const corApp = cor;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{ background: cor, padding: '1rem', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>📊 Relatórios</h1>
            <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>{loja?.nome_fantasia}</p>
          </div>
        </div>
      </header>

      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 500 }}>De:</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <label style={{ fontWeight: 500 }}>Até:</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: cor }}>R$ {metricas.vendas_hoje.toFixed(0)}</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Hoje</div>
          </div>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#3b82f6' }}>{metricas.pedidos_hoje}</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Pedidos Hoje</div>
          </div>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#22c55e' }}>R$ {metricas.total_vendas.toFixed(0)}</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Total período</div>
          </div>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#8b5cf6' }}>R$ {metricas.ticket_medio.toFixed(0)}</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Ticket Médio</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={gerarLink} style={{ flex: 1, minWidth: '120px', padding: '0.75rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
            🔗 Copiar Link
          </button>
          <button onClick={exportarPDF} style={{ flex: 1, minWidth: '120px', padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
            📥 Exportar
          </button>
        </div>

        <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Últimos Pedidos</h3>
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          {pedidos.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Nenhum pedido no período</div>
          ) : (
            pedidos.slice(0, 10).map((p, i) => (
              <div key={p.id} style={{ padding: '0.75rem', borderBottom: i < 9 ? '1px solid #eee' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.cliente_nome}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{format(new Date(p.created_at), 'dd/MM HH:mm')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: corApp }}>R$ {Number(p.total).toFixed(2)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{p.status}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}