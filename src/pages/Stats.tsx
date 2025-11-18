import { useAuth } from '../contexts/AuthContext';
import { useStatistics } from '../hooks/useStatistics';
import { Layout } from '../components/layout/Layout';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Calendar } from 'lucide-react';

export const Stats = () => {
  const { user } = useAuth();
  const { statistics, loading, error } = useStatistics(user?.id || '');

  // Cores para gráficos
  const COLORS = [
    '#6366F1', // Indigo
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Green
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#14B8A6', // Teal
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Carregando estatísticas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !statistics) {
    return (
      <Layout>
        <div className="p-4">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-300">
              Erro ao carregar estatísticas. {error?.message}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Se não há dados
  if (statistics.totalPurchases === 0) {
    return (
      <Layout>
        <div className="px-4 py-4 pb-24">
          <h1 className="text-[34px] font-bold text-gray-900 dark:text-white mb-2">
            Estatísticas
          </h1>
          <div className="mt-8 text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum dado disponível
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Comece a marcar itens como comprados ou escaneie notas fiscais
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Variação mensal
  const monthlyVariation = statistics.lastMonthSpending > 0
    ? ((statistics.currentMonthSpending - statistics.lastMonthSpending) / statistics.lastMonthSpending) * 100
    : 0;

  const isMonthlyIncrease = monthlyVariation > 0;

  return (
    <Layout>
      <div className="px-4 py-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[34px] font-bold text-gray-900 dark:text-white mb-2">
            Estatísticas
          </h1>
          <p className="text-[17px] text-gray-500 dark:text-gray-400">
            Análise dos seus gastos e compras
          </p>
        </div>

        {/* Cards Resumo */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Total Gasto */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 opacity-80" />
              <p className="text-sm opacity-90">Total Gasto</p>
            </div>
            <p className="text-2xl font-bold">
              R$ {statistics.totalSpent.toFixed(2)}
            </p>
            <p className="text-xs opacity-75 mt-1">
              {statistics.totalPurchases} compras
            </p>
          </div>

          {/* Média por Compra */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-5 h-5 opacity-80" />
              <p className="text-sm opacity-90">Média/Compra</p>
            </div>
            <p className="text-2xl font-bold">
              R$ {statistics.averageBasketValue.toFixed(2)}
            </p>
            {statistics.mostExpensiveItem && (
              <p className="text-xs opacity-75 mt-1 truncate">
                Mais caro: {statistics.mostExpensiveItem.name}
              </p>
            )}
          </div>

          {/* Mês Atual */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 opacity-80" />
              <p className="text-sm opacity-90">Este Mês</p>
            </div>
            <p className="text-2xl font-bold">
              R$ {statistics.currentMonthSpending.toFixed(2)}
            </p>
            {statistics.lastMonthSpending > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {isMonthlyIncrease ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <p className="text-xs">
                  {Math.abs(monthlyVariation).toFixed(1)}% vs mês anterior
                </p>
              </div>
            )}
          </div>

          {/* Categorias */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 opacity-80" />
              <p className="text-sm opacity-90">Categorias</p>
            </div>
            <p className="text-2xl font-bold">
              {statistics.categorySpending.length}
            </p>
            {statistics.topCategories.length > 0 && (
              <p className="text-xs opacity-75 mt-1 truncate">
                Top: {statistics.topCategories[0].category}
              </p>
            )}
          </div>
        </div>

        {/* Gastos por Mês (Gráfico de Barras) */}
        {statistics.monthlySpending.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Gastos Mensais
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statistics.monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-');
                    return `${month}/${year.slice(2)}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Total']}
                  labelFormatter={(label) => {
                    const [year, month] = label.split('-');
                    return `${month}/${year}`;
                  }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="total" fill={COLORS[0]} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gastos por Categoria (Gráfico de Pizza) */}
        {statistics.topCategories.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Gastos por Categoria
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statistics.topCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) =>
                    `${category} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {statistics.topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Itens Mais Comprados (Lista) */}
        {statistics.topItems.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Itens Mais Comprados
            </h2>
            <div className="space-y-3">
              {statistics.topItems.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Última compra: {new Date(item.lastPurchased).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.purchaseCount}x
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tendências de Preço (Gráfico de Linha) */}
        {statistics.priceTrends.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tendências de Preço
            </h2>
            {statistics.priceTrends.map((trend, index) => (
              <div key={index} className="mb-6 last:mb-0">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {trend.itemName}
                  </h3>
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Média: R$ {trend.averagePrice.toFixed(2)}</span>
                    <span>Min: R$ {trend.minPrice.toFixed(2)}</span>
                    <span>Max: R$ {trend.maxPrice.toFixed(2)}</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={trend.prices}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
