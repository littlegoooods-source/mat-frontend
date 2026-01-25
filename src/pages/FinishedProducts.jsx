import { useState, useEffect } from 'react';
import { ShoppingCart, Package, Trash2, RotateCcw, DollarSign } from 'lucide-react';
import Card, { StatCard } from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Input, { Textarea } from '../components/Input';
import Badge from '../components/Badge';
import { finishedProductsApi, productsApi } from '../services/api';
import { format } from 'date-fns';

function FinishedProducts() {
  const [products, setProducts] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('InStock');
  const [productFilter, setProductFilter] = useState('');
  
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [writeOffModalOpen, setWriteOffModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [sellFormData, setSellFormData] = useState({
    salePrice: '',
    client: '',
    saleDate: format(new Date(), 'yyyy-MM-dd'),
    comment: '',
  });
  
  const [writeOffFormData, setWriteOffFormData] = useState({
    reason: '',
    comment: '',
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
    loadProductsList();
    loadSummary();
  }, [statusFilter, productFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (productFilter) params.productId = productFilter;
      
      const response = await finishedProductsApi.getAll(params);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProductsList = async () => {
    try {
      const response = await productsApi.getAll({ includeArchived: false });
      setProductsList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading products list:', error);
      setProductsList([]);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await finishedProductsApi.getSummary();
      setSummary(response.data || null);
    } catch (error) {
      console.error('Error loading summary:', error);
      setSummary(null);
    }
  };

  const openSellModal = (product) => {
    setSelectedProduct(product);
    setSellFormData({
      salePrice: product.costPerUnit ? (product.costPerUnit * 1.3).toFixed(0) : '',
      client: '',
      saleDate: format(new Date(), 'yyyy-MM-dd'),
      comment: '',
    });
    setSellModalOpen(true);
  };

  const openWriteOffModal = (product) => {
    setSelectedProduct(product);
    setWriteOffFormData({
      reason: '',
      comment: '',
    });
    setWriteOffModalOpen(true);
  };

  const handleSell = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await finishedProductsApi.sell(selectedProduct.id, {
        salePrice: parseFloat(sellFormData.salePrice),
        client: sellFormData.client || null,
        saleDate: sellFormData.saleDate,
        comment: sellFormData.comment || null,
      });
      
      setSellModalOpen(false);
      loadProducts();
      loadSummary();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка продажи');
    } finally {
      setSaving(false);
    }
  };

  const handleWriteOff = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await finishedProductsApi.writeOff(selectedProduct.id, {
        reason: writeOffFormData.reason,
        comment: writeOffFormData.comment || null,
      });
      
      setWriteOffModalOpen(false);
      loadProducts();
      loadSummary();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка списания');
    } finally {
      setSaving(false);
    }
  };

  const handleReturnToStock = async (product) => {
    if (!confirm(`Вернуть "${product.productName}" на склад?`)) return;
    
    try {
      await finishedProductsApi.returnToStock(product.id);
      loadProducts();
      loadSummary();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка возврата');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'InStock':
        return <Badge variant="success">На складе</Badge>;
      case 'Sold':
        return <Badge variant="info">Продано</Badge>;
      case 'WrittenOff':
        return <Badge variant="danger">Списано</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns = [
    { key: 'productName', title: 'Изделие', render: (val) => (
      <span className="font-medium text-white">{val}</span>
    )},
    { key: 'batchNumber', title: 'Партия', render: (val) => (
      <span className="font-mono text-primary-400 text-sm">{val}</span>
    )},
    { key: 'productionDate', title: 'Дата пр-ва', render: (val) => format(new Date(val), 'dd.MM.yyyy') },
    { key: 'status', title: 'Статус', render: (val) => getStatusBadge(val) },
    { key: 'costPerUnit', title: 'Себестоимость', render: (val) => formatCurrency(val) },
    { key: 'salePrice', title: 'Цена продажи', render: (val, row) => (
      row.status === 'Sold' ? (
        <span className="text-green-400 font-medium">{formatCurrency(val)}</span>
      ) : '-'
    )},
    { key: 'client', title: 'Клиент', render: (val) => val || '-' },
    { key: 'saleDate', title: 'Дата операции', render: (val) => val ? format(new Date(val), 'dd.MM.yyyy') : '-' },
    { key: 'actions', title: '', render: (_, row) => (
      <div className="flex gap-1">
        {row.status === 'InStock' && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); openSellModal(row); }}
              className="p-2 hover:bg-green-500/20 rounded-lg transition-colors text-green-400"
              title="Продать"
            >
              <DollarSign size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openWriteOffModal(row); }}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
              title="Списать"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
        {(row.status === 'Sold' || row.status === 'WrittenOff') && (
          <button 
            onClick={(e) => { e.stopPropagation(); handleReturnToStock(row); }}
            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-400"
            title="Вернуть на склад"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>
    )},
  ];

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'InStock', label: 'На складе' },
    { value: 'Sold', label: 'Продано' },
    { value: 'WrittenOff', label: 'Списано' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Готовая продукция</h1>
        <p className="text-slate-400">Склад готовых изделий, продажи и списания</p>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="На складе"
            value={summary.totalInStock}
            subtitle={formatCurrency(summary.totalInStockValue)}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Продано"
            value={summary.totalSold}
            subtitle="единиц"
            icon={ShoppingCart}
            color="green"
          />
          <StatCard
            title="Списано"
            value={summary.totalWrittenOff}
            subtitle="единиц"
            icon={Trash2}
            color="red"
          />
          <StatCard
            title="Выручка"
            value={formatCurrency(summary.totalSalesAmount)}
            icon={DollarSign}
            color="primary"
          />
          <StatCard
            title="Прибыль"
            value={formatCurrency(summary.totalProfit)}
            icon={DollarSign}
            color="purple"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sm:w-48"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="sm:w-64"
          >
            <option value="">Все изделия</option>
            {productsList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <Table 
          columns={columns} 
          data={products}
          emptyMessage="Готовая продукция не найдена"
        />
      )}

      {/* Sell Modal */}
      <Modal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        title="Продажа изделия"
      >
        <form onSubmit={handleSell} className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-800/50">
            <p className="text-sm text-slate-400">Изделие</p>
            <p className="font-medium text-white">{selectedProduct?.productName}</p>
            <p className="text-sm text-slate-400 mt-1">Себестоимость: {formatCurrency(selectedProduct?.costPerUnit)}</p>
          </div>
          
          <Input
            label="Цена продажи"
            type="number"
            step="0.01"
            min="0"
            required
            value={sellFormData.salePrice}
            onChange={(e) => setSellFormData({ ...sellFormData, salePrice: e.target.value })}
          />
          
          <Input
            label="Клиент"
            value={sellFormData.client}
            onChange={(e) => setSellFormData({ ...sellFormData, client: e.target.value })}
            placeholder="Имя клиента (опционально)"
          />
          
          <Input
            label="Дата продажи"
            type="date"
            required
            value={sellFormData.saleDate}
            onChange={(e) => setSellFormData({ ...sellFormData, saleDate: e.target.value })}
          />
          
          <Textarea
            label="Комментарий"
            value={sellFormData.comment}
            onChange={(e) => setSellFormData({ ...sellFormData, comment: e.target.value })}
          />

          {sellFormData.salePrice && selectedProduct && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-sm text-slate-400">Прибыль:</p>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(parseFloat(sellFormData.salePrice) - selectedProduct.costPerUnit)}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={saving} className="flex-1">
              Продать
            </Button>
            <Button type="button" variant="secondary" onClick={() => setSellModalOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </Modal>

      {/* Write-off Modal */}
      <Modal
        isOpen={writeOffModalOpen}
        onClose={() => setWriteOffModalOpen(false)}
        title="Списание изделия"
      >
        <form onSubmit={handleWriteOff} className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-800/50">
            <p className="text-sm text-slate-400">Изделие</p>
            <p className="font-medium text-white">{selectedProduct?.productName}</p>
            <p className="text-sm text-slate-400 mt-1">Себестоимость: {formatCurrency(selectedProduct?.costPerUnit)}</p>
          </div>
          
          <Input
            label="Причина списания"
            required
            value={writeOffFormData.reason}
            onChange={(e) => setWriteOffFormData({ ...writeOffFormData, reason: e.target.value })}
            placeholder="Например: брак, повреждение"
          />
          
          <Textarea
            label="Комментарий"
            value={writeOffFormData.comment}
            onChange={(e) => setWriteOffFormData({ ...writeOffFormData, comment: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="danger" loading={saving} className="flex-1">
              Списать
            </Button>
            <Button type="button" variant="secondary" onClick={() => setWriteOffModalOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default FinishedProducts;
