import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import toast from 'react-hot-toast';
import Button, { IconButton } from '../../components/ui/Button';

const fieldCls = 'w-full px-4 py-2.5 rounded border border-outline-var bg-transparent text-body-s text-on-surf placeholder:text-on-surf-var hover:border-on-surf-var focus:outline-none focus:border-pri focus:ring-2 focus:ring-pri/15 transition-all';

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
      <div>
        <label className="block text-label-l text-on-surf-var mb-1.5">Pregunta <span className="text-err">*</span></label>
        <input value={form.question} onChange={set('question')} className={fieldCls} placeholder="Ej. ¿A qué hora empieza?" required />
      </div>
      <div>
        <label className="block text-label-l text-on-surf-var mb-1.5">Respuesta <span className="text-err">*</span></label>
        <textarea rows={4} value={form.answer} onChange={set('answer')}
          className={`${fieldCls} resize-none`} placeholder="Escribe la respuesta..." required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-label-l text-on-surf-var mb-1.5">Orden de aparición</label>
          <input type="number" value={form.sort_order} onChange={set('sort_order')} className={fieldCls} min={0} />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
              className="rounded" />
            <span className="text-body-s text-on-surf">Activa</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2 border-t border-outline-var">
        <Button type="submit" variant="filled" disabled={loading} className="flex-1 justify-center">
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>save</span>
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
          <h1 className="text-title-l text-on-surf mb-1">Preguntas Frecuentes (FAQs)</h1>
          <p className="text-body-m text-on-surf-var">Gestiona las preguntas comunes que aparecen en la página de Eventos.</p>
        </div>
        <Button variant="filled" onClick={() => { setEditingFaq(null); setShowForm(!showForm); }}>
          <span className="material-symbols-rounded">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancelar' : 'Nueva FAQ'}
        </Button>
      </div>

      {showForm && (
        <div className="p-4 sm:p-6 rounded-2xl bg-surf border border-outline-var">
          <h2 className="text-title-m mb-4">{editingFaq ? 'Editar FAQ' : 'Agregar FAQ'}</h2>
          <FAQForm 
            initialData={editingFaq} 
            onSave={() => { setShowForm(false); setEditingFaq(null); load(); }} 
            onCancel={() => { setShowForm(false); setEditingFaq(null); }} 
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-on-surf-var">Cargando...</div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-outline-var text-on-surf-var">
          No hay FAQs agregadas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {faqs.map(faq => (
            <div key={faq.ID} className={`p-4 sm:p-5 rounded-2xl border ${faq.is_active ? 'bg-surf border-outline-var' : 'bg-surf-container border-outline/50'} flex flex-col sm:flex-row gap-4 items-start`}>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-title-s text-on-surf font-medium">{faq.question}</span>
                  {!faq.is_active && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-err/10 text-err px-2 py-0.5 rounded">
                      Inactiva
                    </span>
                  )}
                </div>
                <p className="text-body-m text-on-surf-var line-clamp-3">{faq.answer}</p>
                <div className="mt-3 flex items-center gap-4 text-[12px] text-on-surf-var/70 font-mono">
                  <span>Orden: {faq.sort_order}</span>
                </div>
              </div>

              <div className="flex shrink-0 gap-1 self-end sm:self-center">
                <IconButton 
                  icon={faq.is_active ? 'visibility' : 'visibility_off'} 
                  variant="text" 
                  title={faq.is_active ? 'Ocultar' : 'Mostrar'}
                  onClick={() => handleToggle(faq)} 
                  className={!faq.is_active ? 'text-on-surf-var' : 'text-pri'}
                />
                <IconButton 
                  icon="edit" 
                  variant="text" 
                  title="Editar"
                  onClick={() => { setEditingFaq(faq); setShowForm(true); window.scrollTo(0, 0); }} 
                />
                <IconButton 
                  icon="delete" 
                  variant="text" 
                  title="Eliminar"
                  onClick={() => handleDelete(faq.ID)} 
                  className="text-err hover:bg-err/10" 
                />
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
