import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const EMPTY = { question: '', answer: '', sort_order: 0, is_active: true };

function FAQForm({ onSave, onCancel, initialData }) {
  const [form, setForm] = useState(initialData || EMPTY);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question || !form.answer) { toast.error('Pregunta y respuesta son obligatorias'); return; }
    setLoading(true);
    try {
      if (form.ID) {
        await apiClient.put(`/admin/faqs/${form.ID}`, form);
        toast.success('FAQ actualizada');
      } else {
        await apiClient.post('/admin/faqs/', form);
        toast.success('FAQ agregada');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Pregunta *" value={form.question} onChange={set('question')} placeholder="Ej. ¿A qué hora empieza?" required />
      <Textarea label="Respuesta *" rows={4} value={form.answer} onChange={set('answer')} placeholder="Escribe la respuesta..." required />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Orden de aparición" type="number" value={form.sort_order} onChange={set('sort_order')} min={0} />
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
              className="rounded" />
            <span className="text-body-s text-bg">Activa</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2 border-t border-bg/10">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
          {loading ? 'Guardando…' : (form.ID ? 'Actualizar' : 'Agregar FAQ')}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function AdminFAQs() {
  const [faqs, setFaqs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFaq, setEditingFaq] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient.get(`/admin/faqs/`)
      .then(r => setFaqs(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (faq) => {
    try {
      await apiClient.put(`/admin/faqs/${faq.ID}`, { ...faq, is_active: !faq.is_active });
      toast.success(faq.is_active ? 'Ocultada' : 'Activada');
      load();
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta pregunta?')) return;
    try {
      await apiClient.delete(`/admin/faqs/${id}`);
      toast.success('Eliminada');
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-title-l text-bg mb-1">Preguntas Frecuentes (FAQs)</h1>
          <p className="text-body-m text-bg/50">Gestiona las preguntas comunes que aparecen en la página de Eventos.</p>
        </div>
        <Button variant="filled" onClick={() => { setEditingFaq(null); setShowForm(!showForm); }}>
          {showForm ? 'Cancelar' : 'Nueva FAQ'}
        </Button>
      </div>

      {showForm && (
        <div className="glass-light rounded-[24px] card-spring p-4 sm:p-6">
          <h2 className="text-title-m mb-4">{editingFaq ? 'Editar FAQ' : 'Agregar FAQ'}</h2>
          <FAQForm 
            initialData={editingFaq} 
            onSave={() => { setShowForm(false); setEditingFaq(null); load(); }} 
            onCancel={() => { setShowForm(false); setEditingFaq(null); }} 
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-bg/10 border-t-acento animate-spin" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="glass-light rounded-[24px] card-spring flex flex-col items-center py-16 gap-4">
          <p className="text-body-l text-bg font-medium">No hay FAQs agregadas</p>
        </div>
      ) : (
        <div className="glass-light rounded-[24px] card-spring overflow-hidden divide-y divide-bg/8">
          {faqs.map(faq => (
            <div key={faq.ID} className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start hover:bg-bg/6 transition-colors ${faq.is_active ? '' : 'opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-title-s text-bg font-medium">{faq.question}</span>
                  {!faq.is_active && (
                    <span className="text-10 font-bold uppercase tracking-wider bg-rose/10 text-rose px-2 py-0.5 rounded">
                      Inactiva
                    </span>
                  )}
                </div>
                <p className="text-body-m text-bg/50 line-clamp-3">{faq.answer}</p>
                <div className="mt-3 flex items-center gap-4 text-12 text-bg/45 font-mono">
                  <span>Orden: {faq.sort_order}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0 text-13 font-semibold">
                <button onClick={() => handleToggle(faq)} className="text-bg/55 hover:text-bg transition-colors">
                  {faq.is_active ? 'Ocultar' : 'Mostrar'}
                </button>
                <span className="text-bg/20">·</span>
                <button
                  onClick={() => { setEditingFaq(faq); setShowForm(true); window.scrollTo(0, 0); }}
                  className="text-bg/55 hover:text-bg transition-colors"
                >
                  Editar
                </button>
                <span className="text-bg/20">·</span>
                <button onClick={() => handleDelete(faq.ID)} className="text-bg/55 hover:text-rose transition-colors">
                  Eliminar
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
