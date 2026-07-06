import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Package, Plus, Sparkles, Edit2 } from 'lucide-react';

interface CustomFieldRow {
  key: string;
  value: string;
}

export function ProductManager() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [customFields, setCustomFields] = useState<CustomFieldRow[]>([]);
  const [message, setMessage] = useState('');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const products = useLiveQuery(
    () => db.products.orderBy('updatedAt').reverse().toArray(),
    []
  );

  const hasProducts = (products?.length ?? 0) > 0;

  const addField = () => {
    setCustomFields((prev) => [...prev, { key: '', value: '' }]);
  };

  const updateField = (index: number, field: 'key' | 'value', value: string) => {
    setCustomFields((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const deleteProduct = async (id?: number) => {
    if (!id) return;
    if (confirm('¿Eliminar este producto?')) {
      await db.products.delete(id);
    }
  };

  const handleEditProduct = (product: { id?: number; name: string; price: number; fields?: Record<string, string> }) => {
    setName(product.name);
    setPrice(product.price.toString());
    setCustomFields(Object.entries(product.fields ?? {}).map(([key, value]) => ({ key, value })));
    setEditingProductId(product.id ?? null);
    setMessage('Editando producto. Presiona Guardar para actualizar.');
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setCustomFields([]);
    setEditingProductId(null);
    setMessage('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const numericPrice = Number(price);

    if (!trimmedName || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setMessage('Ingresa un nombre y un precio válido.');
      return;
    }

    const normalizedFields = Object.fromEntries(
      customFields
        .filter((field) => field.key.trim())
        .map((field) => [field.key.trim(), field.value.trim()])
    );

    const now = Date.now();
    if (editingProductId !== null) {
      await db.products.update(editingProductId, {
        name: trimmedName,
        price: numericPrice,
        fields: normalizedFields,
        updatedAt: now,
      });
      setMessage('Producto actualizado correctamente.');
    } else {
      await db.products.add({
        name: trimmedName,
        price: numericPrice,
        fields: normalizedFields,
        createdAt: now,
        updatedAt: now,
      });
      setMessage('Producto guardado correctamente.');
    }

    resetForm();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] h-full overflow-hidden min-h-0">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto h-full min-h-0">
        <div className="flex items-center gap-2 mb-5">
          <Package className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="font-bold text-slate-700">Registrar Producto</h2>
            <p className="text-sm text-slate-500">Carga el catálogo para usarlo desde el registro de ventas.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Nombre</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. Coca Cola 2L"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Precio</label>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-600">Campos adicionales</p>
              <button
                type="button"
                onClick={addField}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" />
                Añadir
              </button>
            </div>

            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={`${field.key}-${index}`} className="grid grid-cols-[1fr_1fr] gap-2">
                  <input
                    value={field.key}
                    onChange={(event) => updateField(index, 'key', event.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="categoría"
                  />
                  <input
                    value={field.value}
                    onChange={(event) => updateField(index, 'value', event.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. bebida"
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Puedes agregar campos como categoría, marca o código para filtrar después.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="w-full sm:w-auto rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800"
            >
              {editingProductId !== null ? 'Actualizar producto' : 'Guardar producto'}
            </button>
            {editingProductId !== null ? (
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>

          {message && <p className="text-sm text-emerald-600">{message}</p>}
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="font-bold text-slate-700">Productos guardados</h2>
            <p className="text-sm text-slate-500">Edita o elimina el catálogo desde aquí.</p>
          </div>
        </div>

        {!products ? (
          <p className="text-slate-500">Cargando...</p>
        ) : !hasProducts ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            Aún no hay productos registrados.
          </div>
        ) : (
          <ul className="space-y-3">
            {products.map((product) => (
              <li key={product.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{product.name}</p>
                    <p className="text-sm text-slate-500">Precio: ${product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      {Object.keys(product.fields ?? {}).length} campos
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
                {product.fields && Object.keys(product.fields).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(product.fields).map(([key, value]) => (
                      <span key={key} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
