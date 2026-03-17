import { useState, useEffect } from 'react';
import { Clock, Filter } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { historyApi } from '../services/api';
import { format } from 'date-fns';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
  });
  
  const [filters, setFilters] = useState({
    operationType: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
    includeCancelled: true,
  });

  useEffect(() => {
    loadHistory();
  }, [pagination.page, filters]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
      };
      
      const response = await historyApi.getAll(params);
      const data = response.data || {};
      setHistory(Array.isArray(data.items) ? data.items : []);
      setPagination({
        ...pagination,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 0,
      });
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
      setPagination({ ...pagination, totalCount: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getOperationBadge = (operationType) => {
    if (operationType.includes('Receipt')) return <Badge variant="success">{operationType}</Badge>;
    if (operationType.includes('Production')) return <Badge variant="info">{operationType}</Badge>;
    if (operationType.includes('Sale')) return <Badge variant="warning">{operationType}</Badge>;
    if (operationType.includes('WriteOff') || operationType.includes('Delete')) return <Badge variant="danger">{operationType}</Badge>;
    return <Badge>{operationType}</Badge>;
  };

  const columns = [
    { key: 'createdAt', title: 'Дата и время', width: '150px', render: (val) => (
      <span className="text-sm">{format(new Date(val), 'dd.MM.yyyy HH:mm')}</span>
    )},
    { key: 'userName', title: 'Пользователь', render: (val) => (
      <span className="text-slate-300">{val || 'Система'}</span>
    )},
    { key: 'operationTypeDisplay', title: 'Операция', render: (val, row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-white">{val}</span>
        {row.isCancelled && <Badge variant="danger">Отменено</Badge>}
      </div>
    )},
    { key: 'entityName', title: 'Объект', render: (val, row) => (
      <div>
        <span className="text-white">{val || '-'}</span>
        {row.entityType && (
          <span className="text-slate-500 text-xs ml-2">({row.entityType})</span>
        )}
      </div>
    )},
    { key: 'quantity', title: 'Кол-во', render: (val) => val ? val : '-' },
    { key: 'amount', title: 'Сумма', render: (val) => formatCurrency(val) },
    { key: 'description', title: 'Описание', render: (val) => (
      <span className="text-slate-400 text-sm">{val || '-'}</span>
    )},
  ];

  const operationTypes = [
    { value: '', label: 'Все операции' },
    { value: 'Receipt', label: 'Поступления' },
    { value: 'Production', label: 'Производство' },
    { value: 'Sale', label: 'Продажи' },
    { value: 'WriteOff', label: 'Списания' },
    { value: 'Material', label: 'Материалы' },
    { value: 'Product', label: 'Изделия' },
  ];

  const entityTypes = [
    { value: '', label: 'Все объекты' },
    { value: 'Material', label: 'Материалы' },
    { value: 'MaterialReceipt', label: 'Поступления' },
    { value: 'Product', label: 'Изделия' },
    { value: 'Production', label: 'Производство' },
    { value: 'FinishedProduct', label: 'Готовая продукция' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 hidden lg:block">
          <Clock size={24} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">История операций</h1>
          <p className="text-slate-400">Журнал всех действий в системе</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Фильтры</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            value={filters.operationType}
            onChange={(e) => setFilters({ ...filters, operationType: e.target.value })}
          >
            {operationTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filters.entityType}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
          >
            {entityTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            placeholder="С даты"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            placeholder="По дату"
          />
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={filters.includeCancelled}
              onChange={(e) => setFilters({ ...filters, includeCancelled: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            Отменённые
          </label>
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          <Table 
            columns={columns} 
            data={history}
            emptyMessage="История операций пуста"
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                Показано {history.length} из {pagination.totalCount} записей
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2.5 rounded-lg bg-slate-700/50 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 min-h-[44px]"
                >
                  Назад
                </button>
                <span className="px-4 py-2.5 text-slate-300 min-h-[44px] flex items-center">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2.5 rounded-lg bg-slate-700/50 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 min-h-[44px]"
                >
                  Вперёд
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default History;
