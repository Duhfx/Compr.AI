import { useState } from 'react';
import type { ProcessedReceipt, ReceiptItem } from '../../hooks/useReceiptProcessing';
import { db } from '../../lib/db';
import { supabase } from '../../lib/supabase';

interface ReceiptPreviewProps {
  data: ProcessedReceipt;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Componente de preview editável da nota fiscal processada
 * 
 * Permite ao usuário:
 * - Ver todos os itens extraídos
 * - Editar nomes, quantidades e preços
 * - Remover itens incorretos
 * - Salvar no histórico (purchase_history + price_history)
 */
export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  data,
  userId,
  onSuccess,
  onCancel
}) => {
  const [editableItems, setEditableItems] = useState<ReceiptItem[]>(data.items);
  const [saving, setSaving] = useState(false);

  const handleSaveToHistory = async () => {
    if (editableItems.length === 0) {
      alert('Nenhum item para salvar');
      return;
    }

    setSaving(true);

    try {
      console.log('[ReceiptPreview] Salvando no histórico...');

      // 1. Salvar em purchase_history (local)
      const purchaseRecords = editableItems.map(item => ({
        id: crypto.randomUUID(),
        userId,
        itemName: item.name,
        category: item.category || 'Outros',
        quantity: item.quantity,
        unit: 'un',
        purchasedAt: new Date(data.date),
        listId: '' // Não vinculado a nenhuma lista específica
      }));

      await db.purchaseHistory.bulkAdd(purchaseRecords);
      console.log('[ReceiptPreview] Purchase history salvo localmente');

      // 2. Salvar em price_history (local)
      const priceRecords = editableItems.map(item => ({
        id: crypto.randomUUID(),
        userId,
        itemName: item.name,
        price: item.unitPrice,
        store: data.store,
        purchasedAt: new Date(data.date),
        createdAt: new Date()
      }));

      await db.priceHistory.bulkAdd(priceRecords);
      console.log('[ReceiptPreview] Price history salvo localmente');

      // 3. Sincronizar com Supabase (se online)
      if (navigator.onLine) {
        try {
          await supabase.from('purchase_history').insert(
            purchaseRecords.map(r => ({
              user_id: r.userId,
              item_name: r.itemName,
              category: r.category,
              quantity: r.quantity,
              unit: r.unit,
              purchased_at: r.purchasedAt.toISOString()
            }))
          );

          await supabase.from('price_history').insert(
            priceRecords.map(r => ({
              user_id: r.userId,
              item_name: r.itemName,
              price: r.price,
              store: r.store,
              purchased_at: r.purchasedAt.toISOString().split('T')[0]
            }))
          );

          console.log('[ReceiptPreview] Sincronizado com Supabase');
        } catch (syncError) {
          console.warn('[ReceiptPreview] Erro ao sincronizar, mas dados salvos localmente:', syncError);
        }
      }

      // Feedback de sucesso
      alert('Histórico atualizado! ' + editableItems.length + ' itens registrados.');
      onSuccess();

    } catch (error) {
      console.error('[ReceiptPreview] Erro ao salvar:', error);
      alert('Erro ao salvar histórico. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setEditableItems(editableItems.filter((_, i) => i !== index));
  };

  const handleEditItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    const updated = [...editableItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    
    // Recalcular totalPrice se quantity ou unitPrice mudarem
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice;
    }
    
    setEditableItems(updated);
  };

  const totalAmount = editableItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Revisar Compra</h2>

      {/* Metadados da nota fiscal */}
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Loja:</span>
          <span className="text-sm text-gray-900 dark:text-white">{data.store}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data:</span>
          <span className="text-sm text-gray-900 dark:text-white">
            {new Date(data.date).toLocaleDateString('pt-BR')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total:</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            R$ {totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Lista de itens editável */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Itens ({editableItems.length})
        </h3>
        
        {editableItems.map((item, index) => (
          <div key={index} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2">
            {/* Nome do produto */}
            <div className="flex gap-2">
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleEditItem(index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Nome do produto"
              />
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-3 text-lg font-bold"
                title="Remover item"
              >
                ×
              </button>
            </div>

            {/* Quantidade e Preço */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">Quantidade</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.quantity}
                  onChange={(e) => handleEditItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">Preço Unit.</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => handleEditItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">Total</label>
                <div className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 dark:text-white rounded-md font-semibold">
                  R$ {item.totalPrice.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Categoria */}
            {item.category && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Categoria: {item.category}
              </div>
            )}
          </div>
        ))}

        {editableItems.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhum item. Adicione itens ou cancele.
          </p>
        )}
      </div>

      {/* Informação importante */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Importante:</strong> Esses itens serão salvos no seu histórico para melhorar
          sugestões futuras e prever gastos. Nenhuma lista será criada.
        </p>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          onClick={handleSaveToHistory}
          className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          disabled={saving || editableItems.length === 0}
        >
          {saving ? 'Salvando...' : 'Salvar no Histórico'}
        </button>
      </div>
    </div>
  );
};
