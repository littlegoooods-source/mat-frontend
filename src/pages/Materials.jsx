import { useState, useEffect } from 'react';
import { Plus, Search, Archive, ArchiveRestore, Trash2, Edit } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Input, { Select, Textarea } from '../components/Input';
import Badge from '../components/Badge';
import { materialsApi } from '../services/api';

function Materials() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'шт',
    color: '',
    category: '',
    description: '',
    minimumStock: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMaterials();
    loadCategories();
  }, [search, categoryFilter, includeArchived]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const response = await materialsApi.getAll({
        search,
        category: categoryFilter,
        includeArchived,
      });
      setMaterials(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await materialsApi.getCategories();
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const openModal = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        unit: material.unit,
        color: material.color || '',
        category: material.category || '',
        description: material.description || '',
        minimumStock: material.minimumStock || '',
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        name: '',
        unit: 'шт',
        color: '',
        category: '',
        description: '',
        minimumStock: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        minimumStock: formData.minimumStock ? parseFloat(formData.minimumStock) : null,
      };

      if (editingMaterial) {
        await materialsApi.update(editingMaterial.id, data);
      } else {
        await materialsApi.create(data);
      }

      setModalOpen(false);
      loadMaterials();
      loadCategories();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (material) => {
    if (!confirm(`${material.isArchived ? 'Разархивировать' : 'Архивировать'} материал "${material.name}"?`)) return;
    
    try {
      if (material.isArchived) {
        await materialsApi.unarchive(material.id);
      } else {
        await materialsApi.archive(material.id);
      }
      loadMaterials();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка');
    }
  };

  const handleDelete = async (material) => {
    if (!confirm(`Удалить материал "${material.name}"? Это действие нельзя отменить.`)) return;
    
    try {
      await materialsApi.delete(material.id);
      loadMaterials();
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
    { key: 'name', title: 'Название', render: (val, row) => (
      <div>
        <span className="font-medium text-white">{val}</span>
        {row.color && <span className="text-slate-400 ml-2">({row.color})</span>}
      </div>
    )},
    { key: 'category', title: 'Категория', render: (val) => val || '-' },
    { key: 'unit', title: 'Ед. изм.' },
    { key: 'currentStock', title: 'Остаток', render: (val, row) => (
      <span className={row.isBelowMinimum ? 'text-yellow-400 font-medium' : ''}>
        {val} {row.unit}
      </span>
    )},
    { key: 'averagePrice', title: 'Ср. цена', render: (val) => formatCurrency(val) },
    { key: 'isArchived', title: 'Статус', render: (val, row) => (
      row.isBelowMinimum ? (
        <Badge variant="warning">Мало</Badge>
      ) : val ? (
        <Badge variant="default">Архив</Badge>
      ) : (
        <Badge variant="success">Активен</Badge>
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
          onClick={(e) => { e.stopPropagation(); handleArchive(row); }}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          {row.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
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

  const unitOptions = [
    { value: 'шт', label: 'шт (штуки)' },
    { value: 'кг', label: 'кг (килограммы)' },
    { value: 'г', label: 'г (граммы)' },
    { value: 'м', label: 'м (метры)' },
    { value: 'см', label: 'см (сантиметры)' },
    { value: 'л', label: 'л (литры)' },
    { value: 'мл', label: 'мл (миллилитры)' },
    { value: 'рулон', label: 'рулон' },
    { value: 'упак', label: 'упак (упаковка)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Материалы</h1>
          <p className="text-slate-400">Справочник материалов мастерской</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>
          Добавить материал
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="sm:w-48"
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Архивные
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
          data={materials}
          emptyMessage="Материалы не найдены"
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMaterial ? 'Редактировать материал' : 'Новый материал'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Введите название материала"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Единица измерения"
              required
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              options={unitOptions}
            />
            <Input
              label="Цвет"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Опционально"
            />
          </div>

          <Input
            label="Категория"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Например: Пластик, Крепеж"
            list="categories"
          />
          <datalist id="categories">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>

          <Input
            label="Минимальный остаток"
            type="number"
            step="0.01"
            min="0"
            value={formData.minimumStock}
            onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
            placeholder="Для напоминаний"
          />

          <Textarea
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Опциональное описание"
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={saving} className="flex-1">
              {editingMaterial ? 'Сохранить' : 'Создать'}
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

export default Materials;
