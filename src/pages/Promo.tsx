import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Gift, Plus, Edit2, Trash2, X, Save, Share, Copy, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Promocao {
  id: string;
  titulo: string;
  descricao: string;
  desconto: number;
  tipo: 'porcentagem' | 'valor';
  codigo: string;
  valido_ate: string;
  ativa: boolean;
}

export default function Promo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lojaId = searchParams.get('loja') || localStorage.getItem('loja_id');
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [loja, setLoja] = useState<{nome_fantasia: string, cor: string} | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState<Promocao | null>(null);
  const [form, setForm] = useState({ titulo: '', descricao: '', desconto: '', tipo: 'porcentagem' as const, codigo: '', valido_ate: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (lojaId) {
      fetchLoja();
      fetchPromocoes();
    }
  }, [lojaId]);

  const fetchLoja = async () => {
    const { data } = await supabase.from('delivery_lojas').select('nome_fantasia, cor').eq('id', lojaId).single();
    if (data) setLoja(data);
  };

  const fetchPromocoes = async () => {
    const { data } = await supabase.from('delivery_promocoes').select('*').eq('loja_id', lojaId).order('created_at', { ascending: false });
    if (data) setPromocoes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const codigo = form.codigo || Math.random().toString(36).substring(2, 8).toUpperCase();
    const promoData = {
      ...form,
      desconto: Number(form.desconto),
      codigo,
      valido_ate: form.valido_ate || null,
      loja_id: lojaId,
      ativa: true
    };
    
    if (editPromo) {
      await supabase.from('delivery_promocoes').update(promoData).eq('id', editPromo.id);
    } else {
      await supabase.from('delivery_promocoes').insert(promoData);
    }
    
    setShowModal(false);
    setEditPromo(null);
    setForm({ titulo: '', descricao: '', desconto: '', tipo: 'porcentagem', codigo: '', valido_ate: '' });
    fetchPromocoes();
    setLoading(false);
  };

  const toggleAtiva = async (promo: Promocao) => {
    await supabase.from('delivery_promocoes').update({ ativa: !promo.ativa }).eq('id', promo.id);
    fetchPromocoes();
  };

  const excluir = async (id: string) => {
    if (confirm('Excluir promoção?')) {
      await supabase.from('delivery_promocoes').delete().eq('id', id);
      fetchPromocoes();
    }
  };

  const gerarLink = async (promo: Promocao) => {
    const url = `${window.location.origin}/pedido?loja=${lojaId}&promo=${promo.codigo}`;
    await navigator.clipboard.writeText(url);
    alert('Link copiado!\n' + url);
  };

  const cor = loja?.cor || '#22c55e';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{ background: cor, padding: '1rem', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>🎁 Promoções</h1>
              <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>{loja?.nome_fantasia}</p>
            </div>
          </div>
          <button 
            onClick={() => { setEditPromo(null); setForm({ titulo: '', descricao: '', desconto: '', tipo: 'porcentagem', codigo: '', valido_ate: '' }); setShowModal(true); }}
            style={{ background: 'white', color: cor, padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <Plus size={16} /> Nova
          </button>
        </div>
      </header>

      <div style={{ padding: '1rem' }}>
        {promocoes.length === 0 ? (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
            Nenhuma promoção criada
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {promocoes.map(promo => (
              <div key={promo.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${promo.ativa ? '#22c55e' : '#ccc'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{promo.titulo}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>{promo.descricao}</div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {promo.tipo === 'porcentagem' ? `${promo.desconto}%` : `R$ ${promo.desconto}`} OFF
                      </span>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#666' }}>Código: {promo.codigo}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => gerarLink(promo)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Copy size={16} /></button>
                    <button onClick={() => toggleAtiva(promo)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: promo.ativa ? '#22c55e' : '#ccc' }}>
                      {promo.ativa ? '✓' : '○'}
                    </button>
                    <button onClick={() => excluir(promo.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '1.5rem', background: 'white', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Como usar promoções</h3>
          <ol style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.875rem', color: '#666' }}>
            <li>Crie uma promoção com desconto</li>
            <li>Copie o link e compartilhe no WhatsApp</li>
            <li>O cliente usa o código no checkout</li>
          </ol>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', width: '90%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>{editPromo ? 'Editar' : 'Nova'} Promoção</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                placeholder="Título (ex: discount)"
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                required
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <textarea
                placeholder="Descrição"
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd', minHeight: '60px' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Desconto"
                  value={form.desconto}
                  onChange={e => setForm({ ...form, desconto: e.target.value })}
                  required
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <select
                  value={form.tipo}
                  onChange={e => setForm({ ...form, tipo: e.target.value as any })}
                  style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="porcentagem">%</option>
                  <option value="valor">R$</option>
                </select>
              </div>
              <input
                placeholder="Código (opcional)"
                value={form.codigo}
                onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <input
                type="date"
                placeholder="Válido até"
                value={form.valido_ate}
                onChange={e => setForm({ ...form, valido_ate: e.target.value })}
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <button type="submit" disabled={loading} style={{ padding: '0.75rem', background: cor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}