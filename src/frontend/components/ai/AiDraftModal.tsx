import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal.tsx';
import { useToast } from '../../hooks/useToast.ts';

interface AiDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftType: 'DRAFT_PRODUCT' | 'DRAFT_CLIENT' | 'DRAFT_SALE' | null;
  draftPayload: Record<string, unknown>;
}

export default function AiDraftModal({ isOpen, onClose, draftType, draftPayload }: AiDraftModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { success } = useToast();

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && draftPayload) {
      const init: Record<string, string> = {};
      for (const [k, v] of Object.entries(draftPayload)) {
        init[k] = v != null ? String(v) : '';
      }
      setForm(init);
      setError('');
    }
  }, [isOpen, draftPayload]);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftType === 'DRAFT_SALE') {
      onClose();
      return;
    }
    setSaving(true);
    setError('');

    try {
      if (draftType === 'DRAFT_PRODUCT') {
        const data = {
          sku: form.sku || '',
          name: form.name || '',
          category_id: form.category_id ? parseInt(form.category_id) : null,
          supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
          price_purchase: parseFloat(form.price_purchase) || 0,
          price_sale: parseFloat(form.price_sale) || 0,
          stock: parseInt(form.stock) || 0,
          min_stock: parseInt(form.min_stock) || 10,
        };
        const result = await window.api.createProduct(data);
        if (result.success) {
          success('Producto creado correctamente');
          onClose();
        } else {
          setError(result.message || 'Error al crear producto');
        }
      } else if (draftType === 'DRAFT_CLIENT') {
        const data = {
          code: form.code || `CLI-${Date.now()}`,
          name: form.name || '',
          dni: form.dni || '',
          tax_id: form.tax_id || '',
          phone: form.phone || '',
        };
        const result = await window.api.createClient(data);
        if (result.success) {
          success('Cliente creado correctamente');
          onClose();
        } else {
          setError(result.message || 'Error al crear cliente');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error de comunicación');
    } finally {
      setSaving(false);
    }
  };

  if (!draftType) return null;

  const title = draftType === 'DRAFT_PRODUCT' ? 'Nuevo Producto (desde IA)'
    : draftType === 'DRAFT_CLIENT' ? 'Nuevo Cliente (desde IA)'
    : 'Nueva Venta (desde IA)';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="560px">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {draftType === 'DRAFT_PRODUCT' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">SKU</label>
                <input type="text" value={form.sku || ''} onChange={e => set('sku', e.target.value)}
                  className="w-full bg-[#252630] border border-[#3a3c4a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
                <input type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} required
                  className="w-full bg-[#252630] border border-[#3a3c4a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Precio Compra (S/)</label>
                <input type="number" step="0.01" value={form.price_purchase || ''} onChange={e => set('price_purchase', e.target.value)}
                  className="w-full bg-[#252630] border border-[#3a3c4a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Precio Venta (S/) *</label>
                <input type="number" step="0.01" value={form.price_sale || ''} onChange={e => set('price_sale', e.target.value)} required
                  className="w-full bg-[#252630] border border-[#3a3c4a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Stock inicial</label>
                <input type="number" value={form.stock || '0'} onChange={e => set('stock', e.target.value)}
                  className="w-full bg-[#252630] border border-[#3a3c4a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Stock mínimo</label>
                <input type="number" value={form.min_stock || '10'} onChange={e => set('min_stock', e.target.value)}
                  className="w-full bg-[#252630] border border-[#3a3c4a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
              </div>
            </div>
          </>
        )}

        {draftType === 'DRAFT_CLIENT' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
              <input type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} required
                className="w-full bg-[#252630] border border-[#3a3c4a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">DNI / Documento</label>
                <input type="text" value={form.dni || ''} onChange={e => set('dni', e.target.value)}
                  className="w-full bg-[#252630] border border-[#3a3c4a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
                <input type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)}
                  className="w-full bg-[#252630] border border-[#3a3c4a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
              </div>
            </div>
          </>
        )}

        {draftType === 'DRAFT_SALE' && (
          <div className="p-3 bg-[#252630] rounded-lg">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{JSON.stringify(form, null, 2)}</pre>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-[#2e303a]">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 bg-[#2e303a] text-gray-300 rounded-lg hover:bg-[#3e404a] transition-colors disabled:opacity-50">
            Cancelar
          </button>
          {draftType !== 'DRAFT_SALE' && (
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}