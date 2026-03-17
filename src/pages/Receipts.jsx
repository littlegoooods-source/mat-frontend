import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Input, { Select, Textarea } from '../components/Input';
import Badge from '../components/Badge';
import { receiptsApi, materialsApi } from '../services/api';
import { format } from 'date-fns';

function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [materialFilter, setMaterialFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [formData, setFormData] = useState({
    materialId: '',
    quantity: '',
    unitPrice: '',
    totalPrice: '',
    receiptDate: format(new Date(), 'yyyy-MM-dd'),
    batchNumber: '',
    purchaseSource: '',
    comment: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadReceipts();
    loadMaterials();
  }, [materialFilter, dateFrom, dateTo]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (materialFilter) params.materialId = materialFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      
      const response = await receiptsApi.getAll(params);
      setReceipts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading receipts:', error);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await materialsApi.getAll({ includeArchived: false });
      setMaterials(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading materials:', error);
      setMaterials([]);
    }
  };

  const openModal = (receipt = null) => {
    if (receipt) {
      setEditingReceipt(receipt);
      setFormData({
        materialId: receipt.materialId.toString(),
        quantity: receipt.quantity.toString(),
        unitPrice: receipt.unitPrice.toString(),
        totalPrice: receipt.totalPrice.toString(),
        receiptDate: format(new Date(receipt.receiptDate), 'yyyy-MM-dd'),
        batchNumber: receipt.batchNumber || '',
        purchaseSource: receipt.purchaseSource || '',
        comment: receipt.comment || '',
      });
    } else {
      setEditingReceipt(null);
      setFormData({
        materialId: '',
        quantity: '',
        unitPrice: '',
        totalPrice: '',
        receiptDate: format(new Date(), 'yyyy-MM-dd'),
        batchNumber: '',
        purchaseSource: '',
        comment: '',
      });
    }
    setModalOpen(true);
  };

  const calculateTotal = () => {
    const qty = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.unitPrice) || 0;
    return (qty * price).toFixed(2);
  };

  const handleQuantityOrPriceChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    const qty = parseFloat(field === 'quantity' ? value : formData.quantity) || 0;
    const price = parseFloat(field === 'unitPrice' ? value : formData.unitPrice) || 0;
    newFormData.totalPrice = (qty * price).toFixed(2);
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        materialId: parseInt(formData.materialId),
        quantity: parseFloat(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        totalPrice: parseFloat(formData.totalPrice),
        receiptDate: formData.receiptDate,
        batchNumber: formData.batchNumber || null,
        purchaseSource: formData.purchaseSource || null,
        comment: formData.comment || null,
      };

      if (editingReceipt) {
        await receiptsApi.update(editingReceipt.id, data);
      } else {
        await receiptsApi.create(data);
      }

      setModalOpen(false);
      loadReceipts();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (receipt) => {
    const message = receipt.hasUsedMaterials 
      ? `Внимание! Материалы из этого поступления уже использованы в производстве. Удалить поступление "${receipt.materialName}"?`
      : `Удалить поступление "${receipt.materialName}"?`;
    
    if (!confirm(message)) return;
    
    try {
      await receiptsApi.delete(receipt.id, receipt.hasUsedMaterials);
      loadReceipts();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  const columns = [
    { key: 'receiptDate', title: 'Дата', render: (val) => format(new Date(val), 'dd.MM.yyyy') },
    { key: 'materialName', title: 'Материал', render: (val, row) => (
      <div className="font-medium text-white">{val}</div>
    )},
    { key: 'quantity', title: 'Количество', render: (val, row) => `${val} ${row.materialUnit}` },
    { key: 'unitPrice', title: 'Цена за ед.', render: (val) => formatCurrency(val) },
    { key: 'totalPrice', title: 'Сумма', render: (val) => formatCurrency(val) },
    { key: 'remainingQuantity', title: 'Остаток', render: (val, row) => (
      <span className={val < row.quantity ? 'text-yellow-400' : ''}>
        {val} {row.materialUnit}
      </span>
    )},
    { key: 'hasUsedMaterials', title: 'Статус', render: (val) => (
      val ? (
        <Badge variant="info">Использовано</Badge>
      ) : (
        <Badge variant="success">Полный</Badge>
      )
    )},
    { key: 'actions', title: '', render: (_, row) => (
      <div className="flex gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); openModal(row); }}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <Edit size={16} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
        >
          <Trash2 size={16} />
        </button>
      </div>
    )},
  ];

  const materialOptions = [
    { value: '', label: 'Выберите материал' },
    ...materials.map(m => ({ value: m.id.toString(), label: `${m.name}${m.color ? ` (${m.color})` : ''} - ${m.unit}` }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="pl-10 lg:pl-0">
          <h1 className="text-2xl font-display font-bold text-white">Поступления</h1>
          <p className="text-slate-400">Учет поступления материалов на склад</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()} className="w-full sm:w-auto">
          Новое поступление
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            className="sm:w-64"
          >
            <option value="">Все материалы</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="С даты"
            className="sm:w-40"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="По дату"
            className="sm:w-40"
          />
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
          data={receipts}
          emptyMessage="Поступления не найдены"
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingReceipt ? 'Редактировать поступление' : 'Новое поступление'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Материал"
            required
            value={formData.materialId}
            onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
            options={materialOptions}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Количество"
              type="number"
              step="0.0001"
              min="0"
              required
              value={formData.quantity}
              onChange={(e) => handleQuantityOrPriceChange('quantity', e.target.value)}
            />
            <Input
              label="Цена за ед."
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.unitPrice}
              onChange={(e) => handleQuantityOrPriceChange('unitPrice', e.target.value)}
            />
            <Input
              label="Общая сумма"
              type="number"
              step="0.01"
              value={formData.totalPrice}
              onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Дата поступления"
              type="date"
              required
              value={formData.receiptDate}
              onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
            />
            <Input
              label="Номер партии"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              placeholder="Опционально"
            />
          </div>

          <Input
            label="Место покупки"
            value={formData.purchaseSource}
            onChange={(e) => setFormData({ ...formData, purchaseSource: e.target.value })}
            placeholder="Ссылка на OZON, WB или магазин"
          />

          <Textarea
            label="Комментарий"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          />

          {editingReceipt?.hasUsedMaterials && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <AlertCircle size={20} className="text-yellow-400" />
              <span className="text-sm text-yellow-400">
                Материалы из этого поступления уже использованы в производстве
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={saving} className="flex-1">
              {editingReceipt ? 'Сохранить' : 'Создать'}
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

export default Receipts;
