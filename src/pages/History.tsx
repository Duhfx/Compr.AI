import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePurchaseHistory } from '../hooks/usePurchaseHistory';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { ShoppingBag, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { history, loading } = usePurchaseHistory(user?.id || '');

  // Group history by date
  const groupedHistory = useMemo(() => {
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando histórico...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[34px] font-bold text-gray-900 mb-2">
            Histórico
          </h1>
          <p className="text-[17px] text-gray-500">
            {history.length === 0
              ? 'Nenhuma compra registrada'
              : `${history.length} ${history.length === 1 ? 'item comprado' : 'itens comprados'}`
            }
          </p>
        </div>

        {/* Empty State */}
        {history.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-[22px] font-bold text-gray-900 mb-2">
              Nenhuma compra ainda
            </h3>
            <p className="text-[15px] text-gray-500 mb-6">
              Seus itens comprados aparecerão aqui
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-primary font-semibold text-[17px]"
            >
              Ir para Listas →
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedHistory.map(([date, items]) => (
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
                      className="bg-white rounded-ios p-4 shadow-ios"
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
          </div>
        )}
      </div>
    </Layout>
  );
};
