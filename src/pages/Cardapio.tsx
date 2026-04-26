import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Package, Plus, Edit2, Trash2, X, Save, ChevronDown, Truck } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  foto_url?: string;
  disponivel: boolean;
}

const categoriasPadrao = ['Lanches', 'Pizzas', 'Bebidas', 'Sobremesas', 'Porções', 'Outros'];

export default function Cardapio() {
  const navigate = useNavigate();
  const { masterProfile } = useAuth();
  const [lojas, setLojas] = useState<{id: string, nome_fantasia: string}[]>([]);
  const [lojaSelecionada, setLojaSelecionada] = useState<string>('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduto, setEditProduto] = useState<Produto | null>(null);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: 'Lanches',
    foto_url: '',
    disponivel: true
  });

  useEffect(() => {
    fetchLojas();
  }, []);

  useEffect(() => {
    if (lojaSelecionada) {
      fetchProdutos();
    }
  }, [lojaSelecionada]);

  const fetchLojas = async () => {
    const { data } = await supabase
      .from('delivery_lojas')
      .select('id, nome_fantasia')
      .eq('ativo', true)
      .order('nome_fantasia');
    if (data) {
      setLojas(data);
      if (data.length > 0) setLojaSelecionada(data[0].id);
    }
  };

  const fetchProdutos = async () => {
    const { data } = await supabase
      .from('delivery_produtos')
      .select('*')
      .eq('loja_id', lojaSelecionada)
      .order('categoria, nome');
    if (data) setProdutos(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lojaSelecionada) return;
    setLoading(true);

    const payload = {
      loja_id: lojaSelecionada,
      nome: form.nome,
      descricao: form.descricao,
      preco: parseFloat(form.preco),
      categoria: form.categoria,
      foto_url: form.foto_url || null,
      disponivel: form.disponivel
    };

    if (editProduto) {
      const { error } = await supabase
        .from('delivery_produtos')
        .update(payload)
        .eq('id', editProduto.id);
      if (error) {
        setMessage('Erro ao atualizar');
      } else {
        setMessage('Produto atualizado!');
        fetchProdutos();
        setShowModal(false);
      }
    } else {
      const { error } = await supabase
        .from('delivery_produtos')
        .insert(payload);
      if (error) {
        setMessage('Erro ao criar: ' + error.message);
      } else {
        setMessage('Produto criado!');
        fetchProdutos();
        setShowModal(false);
      }
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleDisponivel = async (produto: Produto) => {
    await supabase
      .from('delivery_produtos')
      .update({ disponivel: !produto.disponivel })
      .eq('id', produto.id);
    fetchProdutos();
  };

  const excluirProduto = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    await supabase.from('delivery_produtos').delete().eq('id', id);
    fetchProdutos();
  };

  const editarProduto = (produto: Produto) => {
    setEditProduto(produto);
    setForm({
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: produto.preco.toString(),
      categoria: produto.categoria,
      foto_url: produto.foto_url || '',
      disponivel: produto.disponivel
    });
    setShowModal(true);
  };

  const produtosPorCategoria = produtos.reduce((acc, prod) => {
    if (!acc[prod.categoria]) acc[prod.categoria] = [];
    acc[prod.categoria].push(prod);
    return acc;
  }, {} as Record<string, Produto[]>);

  return (
    <div style={{ padding: '1rem', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Cardápio Digital</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => navigate(`/entregas/${lojaSelecionada}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            <Truck size={18} /> Entregas
          </button>
          <button
            onClick={() => { setEditProduto(null); setForm({ nome: '', descricao: '', preco: '', categoria: 'Lanches', foto_url: '', disponivel: true }); setShowModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      {/*Selector de delivery */}
      <div style={{ marginBottom: '1rem' }}>
        <select
          value={lojaSelecionada}
          onChange={(e) => setLojaSelecionada(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
        >
          {lojas.map(loja => (
            <option key={loja.id} value={loja.id}>{loja.nome_fantasia}</option>
          ))}
        </select>
      </div>

      {message && (
        <div style={{ background: message.includes('sucesso') || message.includes('criado') || message.includes('atualizado') ? '#dcfce7' : '#fee2e2', color: message.includes('sucesso') || message.includes('criado') || message.includes('atualizado') ? '#166534' : '#991b1b', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {/* Lista por categoria */}
      {Object.keys(produtosPorCategoria).length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Nenhum produto cadastrado
        </div>
      )}

      {Object.entries(produtosPorCategoria).map(([categoria, lista]) => (
        <div key={categoria} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            {categoria}
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {lista.map(produto => (
              <div key={produto.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: produto.disponivel ? 1 : 0.5 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{produto.nome}</div>
                  {produto.descricao && <div style={{ fontSize: '0.875rem', color: '#666' }}>{produto.descricao}</div>}
                  <div style={{ fontWeight: 600, color: '#22c55e', marginTop: '0.25rem' }}>R$ {produto.preco.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => toggleDisponivel(produto)} style={{ padding: '0.5rem', background: produto.disponivel ? '#dcfce7' : '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                    {produto.disponivel ? 'Disponível' : 'Indisponível'}
                  </button>
                  <button onClick={() => editarProduto(produto)} style={{ padding: '0.5rem', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => excluirProduto(produto.id)} style={{ padding: '0.5rem', background: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'red' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editProduto ? 'Editar' : 'Novo'} Produto</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome *</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Descrição</label>
                <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Preço *</label>
                <input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Categoria *</label>
                <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                  {categoriasPadrao.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>URL da Foto</label>
                <input type="url" value={form.foto_url} onChange={(e) => setForm({ ...form, foto_url: e.target.value })} placeholder="https://..." style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
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