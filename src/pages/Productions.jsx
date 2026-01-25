import { useState, useEffect } from 'react';
import { Plus, Factory, AlertTriangle, Check, X, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Input, { Select, Textarea } from '../components/Input';
import Badge from '../components/Badge';
import { productionsApi, productsApi } from '../services/api';
import { format } from 'date-fns';

function Productions() {
  const [productions, setProductions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeCancelled, setIncludeCancelled] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '1',
    productionDate: format(new Date(), 'yyyy-MM-dd'),
    comment: '',
  });
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProductions();
    loadProducts();
  }, [productFilter, dateFrom, dateTo, includeCancelled]);

  const loadProductions = async () => {
    try {
      setLoading(true);
      const params = { includeCancelled };
      if (productFilter) params.productId = productFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      
      const response = await productionsApi.getAll(params);
      setProductions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading productions:', error);
      setProductions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAll({ includeArchived: false });
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };

  const openModal = () => {
    setFormData({
      productId: '',
      quantity: '1',
      productionDate: format(new Date(), 'yyyy-MM-dd'),
      comment: '',
    });
    setAvailability(null);
    setModalOpen(true);
  };

  const checkAvailability = async () => {
    if (!formData.productId || !formData.quantity) return;
    
    setCheckingAvailability(true);
    try {
      const response = await productionsApi.checkAvailability(
        parseInt(formData.productId),
        parseInt(formData.quantity)
      );
      setAvailability(response.data);
    } catch (error) {
      console.error('Error checking availability:', error);
      alert(error.response?.data?.message || 'Ошибка проверки');
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (formData.productId && formData.quantity) {
      const timeout = setTimeout(checkAvailability, 500);
      return () => clearTimeout(timeout);
    }
  }, [formData.productId, formData.quantity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!availability?.canProduce) {
      alert('Недостаточно материалов для производства');
      return;
    }
    
    setSaving(true);
    try {
      await productionsApi.create({
        productId: parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        productionDate: formData.productionDate,
        comment: formData.comment || null,
      });

      setModalOpen(false);
      loadProductions();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка создания производства');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (production) => {
    if (!confirm(`Отменить производство "${production.productName}" (партия ${production.batchNumber})? Материалы будут возвращены на склад.`)) return;
    
    try {
      await productionsApi.cancel(production.id);
      loadProductions();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка отмены');
    }
  };

  const handleDelete = async (production) => {
    if (!confirm(`УДАЛИТЬ производство "${production.productName}" (партия ${production.batchNumber})? Запись будет полностью удалена из базы данных.`)) return;
    
    try {
      await productionsApi.delete(production.id);
      loadProductions();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const columns = [
    { key: 'productionDate', title: 'Дата', render: (val) => format(new Date(val), 'dd.MM.yyyy') },
    { key: 'batchNumber', title: 'Партия', render: (val) => (
      <span className="font-mono text-primary-400">{val}</span>
    )},
    { key: 'productName', title: 'Изделие', render: (val) => (
      <span className="font-medium text-white">{val}</span>
    )},
    { key: 'quantity', title: 'Кол-во', render: (val) => `${val} шт` },
    { key: 'costPerUnit', title: 'Себестоимость', render: (val) => formatCurrency(val) },
    { key: 'totalCost', title: 'Общая сумма', render: (val) => formatCurrency(val) },
    { key: 'inStockCount', title: 'На складе', render: (val, row) => (
      row.isCancelled ? '-' : `${val} шт`
    )},
    { key: 'isCancelled', title: 'Статус', render: (val) => (
      val ? <Badge variant="danger">Отменено</Badge> : <Badge variant="success">Активно</Badge>
    )},
    { key: 'actions', title: '', render: (_, row) => (
      <div className="flex gap-1">
        {!row.isCancelled && (
          <button 
            onClick={(e) => { e.stopPropagation(); handleCancel(row); }}
            className="p-2 hover:bg-yellow-500/20 rounded-lg transition-colors text-yellow-400"
            title="Отменить производство (материалы вернутся)"
          >
            <X size={16} />
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
          title="Удалить из базы данных"
        >
          <Trash2 size={16} />
        </button>
      </div>
    )},
  ];

  const productOptions = [
    { value: '', label: 'Выберите изделие' },
    ...products.map(p => ({ value: p.id.toString(), label: p.name }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Производство</h1>
          <p className="text-slate-400">Производство изделий и списание материалов</p>
        </div>
        <Button icon={Factory} onClick={openModal}>
          Новое производство
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="sm:w-64"
          >
            <option value="">Все изделия</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="sm:w-40"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="sm:w-40"
          />
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={includeCancelled}
              onChange={(e) => setIncludeCancelled(e.target.checked)}
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
        <Table 
          columns={columns} 
          data={productions}
          emptyMessage="Производства не найдены"
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Новое производство"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Изделие"
            required
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            options={productOptions}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Количество"
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
            <Input
              label="Дата производства"
              type="date"
              required
              value={formData.productionDate}
              onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
            />
          </div>

          <Textarea
            label="Комментарий"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          />

          {/* Availability check */}
          {checkingAvailability ? (
            <div className="p-4 rounded-lg bg-slate-800/50 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-slate-400 mt-2">Проверка наличия материалов...</p>
            </div>
          ) : availability && (
            <div className={`p-4 rounded-lg ${availability.canProduce ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className="flex items-center gap-2 mb-3">
                {availability.canProduce ? (
                  <>
                    <Check size={20} className="text-green-400" />
                    <span className="font-medium text-green-400">Материалов достаточно</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={20} className="text-red-400" />
                    <span className="font-medium text-red-400">Недостаточно материалов</span>
                  </>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {availability.materials.map((mat) => (
                  <div key={mat.materialId} className="flex justify-between items-center">
                    <span className="text-slate-300">{mat.materialName}</span>
                    <span className={mat.isAvailable ? 'text-green-400' : 'text-red-400'}>
                      {mat.requiredQuantity} / {mat.availableQuantity} {mat.materialUnit}
                      {!mat.isAvailable && ` (не хватает ${mat.shortage})`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-600">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Себестоимость единицы:</span>
                  <span className="text-white font-medium">{formatCurrency(availability.estimatedCostPerUnit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Общая себестоимость:</span>
                  <span className="text-primary-400 font-medium">{formatCurrency(availability.estimatedTotalCost)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              loading={saving} 
              disabled={!availability?.canProduce}
              className="flex-1"
            >
              Произвести
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Productions;
