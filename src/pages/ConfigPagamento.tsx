import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CreditCard, Key, CheckCircle, XCircle, Copy, ExternalLink, Save, ArrowLeft } from 'lucide-react';

interface Pagamento {
  id: string;
  loja_id: string;
  mercado_pago_access_token: string;
  mercado_pago_client_id: string;
  chave_pix: string;
  tipo_chave_pix: string;
  active: boolean;
}

export default function ConfigPagamento() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lojaId = searchParams.get('loja');
  const urlLojaId = localStorage.getItem('loja_id');
  const activeLojaId = lojaId || urlLojaId;
  
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [form, setForm] = useState({
    mercado_pago_access_token: '',
    mercado_pago_client_id: '',
    chave_pix: '',
    tipo_chave_pix: 'cpf'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeLojaId) fetchPagamento();
  }, [activeLojaId]);

  const fetchPagamento = async () => {
    const { data } = await supabase
      .from('delivery_pagamentos')
      .select('*')
      .eq('loja_id', activeLojaId)
      .single();
    
    if (data) {
      setPagamento(data);
      setForm({
        mercado_pago_access_token: data.mercado_pago_access_token || '',
        mercado_pago_client_id: data.mercado_pago_client_id || '',
        chave_pix: data.chave_pix || '',
        tipo_chave_pix: data.tipo_chave_pix || 'cpf'
      });
    }
  };

  const salvar = async () => {
    setLoading(true);
    setMessage('');

    if (pagamento) {
      await supabase
        .from('delivery_pagamentos')
        .update({
          mercado_pago_access_token: form.mercado_pago_access_token,
          mercado_pago_client_id: form.mercado_pago_client_id,
          chave_pix: form.chave_pix,
          tipo_chave_pix: form.tipo_chave_pix
        })
        .eq('id', pagamento.id);
    } else {
      await supabase
        .from('delivery_pagamentos')
        .insert({
          loja_id: activeLojaId,
          mercado_pago_access_token: form.mercado_pago_access_token,
          mercado_pago_client_id: form.mercado_pago_client_id,
          chave_pix: form.chave_pix,
          tipo_chave_pix: form.tipo_chave_pix,
          active: true
        });
    }

    setMessage('Configurações salvas!');
    fetchPagamento();
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleActive = async () => {
    if (!pagamento) return;
    await supabase
      .from('delivery_pagamentos')
      .update({ active: !pagamento.active })
      .eq('id', pagamento.id);
    fetchPagamento();
  };

  return (
    <div style={{ padding: '1rem', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Configurar Pagamentos</h2>
      </div>

      {message && (
        <div style={{ background: message.includes('salvas') ? '#dcfce7' : '#fee2e2', color: message.includes('salvas') ? '#166534' : '#991b1b', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {/* PIX manual */}
      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={20} /> PIX Manual
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
          Configure uma chave PIX para receber via transferência direto na conta do lojista.
        </p>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tipo de Chave</label>
          <select
            value={form.tipo_chave_pix}
            onChange={(e) => setForm({ ...form, tipo_chave_pix: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="cpf">CPF</option>
            <option value="cnpj">CNPJ</option>
            <option value="email">Email</option>
            <option value="telefone">Telefone</option>
            <option value="aleatoria">Aleatória</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Chave PIX</label>
          <input
            type="text"
            value={form.chave_pix}
            onChange={(e) => setForm({ ...form, chave_pix: e.target.value })}
            placeholder="Sua chave PIX"
            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>

      {/* Mercado Pago - Temporariamente desabilitado
      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', opacity: 0.5 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={20} /> Mercado Pago (Em breve)
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
          Esta opção estará disponível em breve.
        </p>
      </div>
      */}

      {/* Status */}
      {pagamento && (
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Pagamentos {pagamento.active ? 'ativos' : 'desativados'}</span>
            <button 
              onClick={toggleActive}
              style={{ 
                padding: '0.5rem 1rem', 
                background: pagamento.active ? '#ef4444' : '#22c55e', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              {pagamento.active ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={salvar}
        disabled={loading}
        style={{ width: '100%', padding: '1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        <Save size={20} /> {loading ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </div>
  );
}