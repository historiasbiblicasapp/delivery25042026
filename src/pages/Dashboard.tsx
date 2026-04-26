import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Store, Plus, Edit2, Trash2, X, Lock, Unlock, Palette, Save, Package } from 'lucide-react';

interface Loja {
  id: string;
  nome: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  endereco: string;
  logo_url?: string;
  cor: string;
  ativo: boolean;
  taxa_entrega: number;
  preco_minimo: number;
  tempo_entrega_min: number;
}

const cores = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', 
  '#f59e0b', '#ef4444', '#14b8a6', '#6366f1'
];

export default function Dashboard() {
  const { masterProfile } = useAuth();
  const [lojas, setLojas] = useState<Loja[]>([]);
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
  }, []);

  const fetchLojas = async () => {
    const { data } = await supabase
      .from('delivery_lojas')
      .select('*')
      .order('nome');
    if (data) setLojas(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editLoja) {
      const { error } = await supabase
        .from('delivery_lojas')
        .update(form)
        .eq('id', editLoja.id);
      if (error) {
        setMessage('Erro ao atualizar');
      } else {
        setMessage('Loja atualizada!');
        fetchLojas();
        setShowModal(false);
      }
    } else {
      const { error } = await supabase
        .from('delivery_lojas')
        .insert({ ...form, ativo: true });
      if (error) {
        setMessage('Erro ao criar: ' + error.message);
      } else {
        setMessage('Loja criada!');
        fetchLojas();
        setShowModal(false);
      }
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleAtivo = async (loja: Loja) => {
    await supabase
      .from('delivery_lojas')
      .update({ ativo: !loja.ativo })
      .eq('id', loja.id);
    fetchLojas();
  };

  const excluirLoja = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    await supabase.from('delivery_lojas').delete().eq('id', id);
    fetchLojas();
  };

  const editarLoja = (loja: Loja) => {
    setEditLoja(loja);
    setForm({
      nome: loja.nome,
      nome_fantasia: loja.nome_fantasia,
      email: loja.email,
      telefone: loja.telefone,
      endereco: loja.endereco,
      taxa_entrega: loja.taxa_entrega,
      preco_minimo: loja.preco_minimo,
      tempo_entrega_min: loja.tempo_entrega_min,
      cor: loja.cor
    });
    setShowModal(true);
  };

  return (
    <div style={{ padding: '1rem', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Delivery 2026</h2>
        <button
          onClick={() => { setEditLoja(null); setForm({ nome: '', nome_fantasia: '', email: '', telefone: '', endereco: '', taxa_entrega: 5, preco_minimo: 20, tempo_entrega_min: 40, cor: '#22c55e' }); setShowModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          <Plus size={18} /> Nova Loja
        </button>
      </div>

      {message && (
        <div style={{ background: message.includes('sucesso') || message.includes('criada') || message.includes('atualizada') ? '#dcfce7' : '#fee2e2', color: message.includes('sucesso') || message.includes('criada') || message.includes('atualizada') ? '#166534' : '#991b1b', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {lojas.map(loja => (
          <div key={loja.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${loja.cor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{loja.nome_fantasia || loja.nome}</h3>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>{loja.email}</p>
              </div>
              <span style={{ 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px', 
                fontSize: '0.75rem',
                background: loja.ativo ? '#dcfce7' : '#fee2e2',
                color: loja.ativo ? '#166534' : '#991b1b'
              }}>
                {loja.ativo ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
              <p>📍 {loja.endereco || 'Sem endereço'}</p>
              <p>💰 Entrega: R$ {loja.taxa_entrega} | Mín: R$ {loja.preco_minimo}</p>
              <p>⏱️ {(loja.tempo_entrega_min || 40)} min</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => editarLoja(loja)} style={{ flex: 1, padding: '0.5rem', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                <Edit2 size={14} /> Editar
              </button>
              <button onClick={() => toggleAtivo(loja)} style={{ flex: 1, padding: '0.5rem', background: loja.ativo ? '#fee2e2' : '#dcfce7', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                {loja.ativo ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
              <button onClick={() => excluirLoja(loja.id)} style={{ padding: '0.5rem', background: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'red' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {lojas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Nenhuma loja cadastrada
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflow: 'auto' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editLoja ? 'Editar' : 'Nova'} Loja</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome da Loja *</label>
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
              {!editLoja && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Senha *</label>
                  <input type="password" placeholder="Crie uma senha" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
              )}
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