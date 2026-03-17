import { useState, useEffect } from 'react';
import { Package, Factory, ShoppingCart, TrendingUp, AlertTriangle, Clock, RefreshCw, WifiOff } from 'lucide-react';
import Card, { StatCard } from '../components/Card';
import Badge from '../components/Badge';
import { reportsApi } from '../services/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getDashboard();
      setData(response.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <WifiOff size={48} className="text-slate-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Ошибка подключения</h2>
        <p className="text-slate-400 mb-4">{error}</p>
        <button
          onClick={loadDashboard}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors"
        >
          <RefreshCw size={18} />
          Повторить
        </button>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pl-10 lg:pl-0">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Добро пожаловать!
        </h1>
        <p className="text-slate-400">
          Обзор состояния мастерской на {format(new Date(), 'd MMMM yyyy', { locale: ru })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Материалы на складе"
          value={formatCurrency(data?.materialsSummary?.totalValue)}
          subtitle={`${data?.materialsSummary?.activeMaterials || 0} позиций`}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Готовая продукция"
          value={data?.finishedProductsSummary?.totalInStock || 0}
          subtitle="единиц на складе"
          icon={Factory}
          color="green"
        />
        <StatCard
          title="Продано"
          value={data?.finishedProductsSummary?.totalSold || 0}
          subtitle={formatCurrency(data?.finishedProductsSummary?.totalSalesAmount)}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          title="Прибыль"
          value={formatCurrency(data?.finishedProductsSummary?.totalProfit)}
          subtitle="с продаж"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock materials */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <AlertTriangle size={20} className="text-yellow-400" />
            </div>
            <h2 className="text-lg font-display font-semibold text-white">
              Заканчивающиеся материалы
            </h2>
          </div>

          {data?.lowStockMaterials?.length > 0 ? (
            <div className="space-y-3">
              {data.lowStockMaterials.slice(0, 5).map((material) => (
                <div 
                  key={material.materialId}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                >
                  <div>
                    <p className="font-medium text-white">{material.materialName}</p>
                    <p className="text-sm text-slate-400">
                      Остаток: {material.currentStock} {material.unit}
                    </p>
                  </div>
                  <Badge variant="warning">
                    Мин: {material.minimumStock} {material.unit}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">
              Все материалы в достаточном количестве
            </p>
          )}
        </Card>

        {/* Recent operations */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Clock size={20} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-display font-semibold text-white">
              Последние операции
            </h2>
          </div>

          {data?.recentOperations?.length > 0 ? (
            <div className="space-y-3">
              {data.recentOperations.slice(0, 5).map((op) => (
                <div 
                  key={op.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                >
                  <div>
                    <p className="font-medium text-white">{op.operationTypeDisplay}</p>
                    <p className="text-sm text-slate-400">
                      {op.entityName || op.description}
                    </p>
                  </div>
                  <div className="text-right">
                    {op.amount && (
                      <p className="font-medium text-primary-400">
                        {formatCurrency(op.amount)}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      {format(new Date(op.createdAt), 'dd.MM.yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">
              Нет операций
            </p>
          )}
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <p className="text-slate-400 mb-2">Всего изделий</p>
          <p className="text-3xl sm:text-4xl font-display font-bold text-white">
            {data?.productsSummary?.totalProducts || 0}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {data?.productsSummary?.activeProducts || 0} активных
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-slate-400 mb-2">Произведено всего</p>
          <p className="text-3xl sm:text-4xl font-display font-bold text-white">
            {data?.productsSummary?.totalProduced || 0}
          </p>
          <p className="text-sm text-slate-500 mt-1">единиц продукции</p>
        </Card>
        <Card className="text-center">
          <p className="text-slate-400 mb-2">Стоимость склада</p>
          <p className="text-3xl sm:text-4xl font-display font-bold text-primary-400 break-words">
            {formatCurrency(
              (data?.materialsSummary?.totalValue || 0) + 
              (data?.finishedProductsSummary?.totalInStockValue || 0)
            )}
          </p>
          <p className="text-sm text-slate-500 mt-1">материалы + продукция</p>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
