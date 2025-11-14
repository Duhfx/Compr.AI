import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePurchaseHistory } from '../hooks/usePurchaseHistory';
import { useReceiptHistory } from '../hooks/useReceiptHistory';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { ShoppingBag, Calendar, Package, Receipt, Store } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { ReceiptScanner } from '../components/scanner/ReceiptScanner';
import toast from 'react-hot-toast';

type HistoryTab = 'Compras' | 'Notas Fiscais';

export const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<HistoryTab>('Compras');
  const [showScanner, setShowScanner] = useState(false);

  const { history, loading: purchasesLoading } = usePurchaseHistory(user?.id || '');
  const { receipts, loading: receiptsLoading } = useReceiptHistory(user?.id || '');

  const refreshHistory = () => {
    // Force re-render by navigating to same route
    window.location.reload();
  };

  // Group purchase history by date
  const groupedPurchases = useMemo(() => {
    const groups: Record<string, typeof history> = {};

    history.forEach((item) => {
      const date = format(new Date(item.purchased_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [history]);

  const loading = selectedTab === 'Compras' ? purchasesLoading : receiptsLoading;
  const isEmpty = selectedTab === 'Compras' ? history.length === 0 : receipts.length === 0;

  if (loading) {
    return (
      <Layout onScanClick={() => setShowScanner(true)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando histórico...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onScanClick={() => setShowScanner(true)}>
      {/* Receipt Scanner */}
      {showScanner && (
        <ReceiptScanner
          userId={user?.id || ''}
          onSuccess={() => {
            setShowScanner(false);
            toast.success('✅ Histórico atualizado!');
            refreshHistory();
          }}
          onCancel={() => setShowScanner(false)}
        />
      )}

      <div className="px-4 py-4 pb-28">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[34px] font-bold text-gray-900 mb-2">
            Histórico
          </h1>
          <p className="text-[17px] text-gray-500">
            {selectedTab === 'Compras'
              ? history.length === 0
                ? 'Nenhuma compra registrada'
                : `${history.length} ${history.length === 1 ? 'item comprado' : 'itens comprados'}`
              : receipts.length === 0
              ? 'Nenhuma nota fiscal escaneada'
              : `${receipts.length} ${receipts.length === 1 ? 'nota fiscal' : 'notas fiscais'}`
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <SegmentedControl
            options={['Compras', 'Notas Fiscais']}
            selected={selectedTab}
            onChange={(value) => setSelectedTab(value as HistoryTab)}
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center">
                {selectedTab === 'Compras' ? (
                  <ShoppingBag className="h-10 w-10 text-purple-600" />
                ) : (
                  <Receipt className="h-10 w-10 text-purple-600" />
                )}
              </div>
              <h3 className="text-[22px] font-bold text-gray-900 mb-2">
                {selectedTab === 'Compras' ? 'Nenhuma compra ainda' : 'Nenhuma nota fiscal'}
              </h3>
              <p className="text-[15px] text-gray-500 mb-6">
                {selectedTab === 'Compras'
                  ? 'Marque itens nas suas listas como comprados'
                  : 'Escaneie notas fiscais para rastrear preços'}
              </p>
              <button
                onClick={() => navigate('/home')}
                className="text-primary font-semibold text-[17px]"
              >
                {selectedTab === 'Compras' ? 'Ir para Listas →' : 'Escanear Nota Fiscal →'}
              </button>
            </motion.div>
          ) : selectedTab === 'Compras' ? (
            <motion.div
              key="purchases"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {groupedPurchases.map(([date, items]) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <h2 className="text-[15px] font-semibold text-gray-600">
                      {format(new Date(date), "d 'de' MMMM", { locale: ptBR })}
                    </h2>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[17px] font-semibold text-gray-900 truncate">
                              {item.item_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.category && (
                                <span className="text-[13px] text-gray-500">
                                  {item.category}
                                </span>
                              )}
                              {item.quantity && item.unit && (
                                <>
                                  {item.category && (
                                    <span className="text-gray-300">•</span>
                                  )}
                                  <span className="text-[13px] text-gray-500">
                                    {item.quantity} {item.unit}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[13px] text-gray-400">
                              {format(new Date(item.purchased_at), 'HH:mm')}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="receipts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {receipts.map((receipt, index) => (
                <motion.div
                  key={`${receipt.store}_${receipt.date}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[17px] font-semibold text-gray-900 truncate">
                        {receipt.store}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[13px] text-gray-500">
                          {receipt.itemCount} {receipt.itemCount === 1 ? 'item' : 'itens'}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[13px] font-medium text-green-600">
                          R$ {receipt.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] text-gray-400">
                        {format(new Date(receipt.date), "d 'de' MMM", { locale: ptBR })}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {format(new Date(receipt.date), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};
