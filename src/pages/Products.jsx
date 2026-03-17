import { useState, useEffect } from 'react';
import { Plus, Search, Archive, ArchiveRestore, Trash2, Edit, Copy, Package } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Input, { Select, Textarea } from '../components/Input';
import Badge from '../components/Badge';
import { productsApi, materialsApi } from '../services/api';

function Products() {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    productionTimeMinutes: '',
    weight: '',
    estimatedCost: '',
    recommendedPrice: '',
    fileLinks: '',
    markupPercent: '100',
    recipeItems: [],
  });
  const [saving, setSaving] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyName, setCopyName] = useState('');
  const [productToCopy, setProductToCopy] = useState(null);

  useEffect(() => {
    loadProducts();
    loadMaterials();
    loadCategories();
  }, [search, categoryFilter, includeArchived]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAll({
        search,
        category: categoryFilter,
        includeArchived,
      });
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
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

  const loadCategories = async () => {
    try {
      const response = await productsApi.getCategories();
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const openModal = async (product = null) => {
    if (product) {
      // Load full product details
      try {
        const response = await productsApi.getById(product.id);
        const p = response.data;
        setEditingProduct(p);
        setFormData({
          name: p.name || '',
          category: p.category || '',
          description: p.description || '',
          productionTimeMinutes: (p.productionTimeMinutes || 0).toString(),
          weight: (p.weight || 0).toString(),
          estimatedCost: p.estimatedCost ? p.estimatedCost.toString() : '',
          recommendedPrice: p.recommendedPrice ? p.recommendedPrice.toString() : '',
          fileLinks: p.fileLinks || '',
          markupPercent: (p.markupPercent || 100).toString(),
          recipeItems: Array.isArray(p.recipeItems) ? p.recipeItems.map(item => ({
            materialId: item.materialId,
            quantity: item.quantity,
          })) : [],
        });
      } catch (error) {
        console.error('Error loading product:', error);
        return;
      }
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        description: '',
        productionTimeMinutes: '',
        weight: '',
        estimatedCost: '',
        recommendedPrice: '',
        fileLinks: '',
        markupPercent: '100',
        recipeItems: [],
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        name: formData.name,
        category: formData.category || null,
        description: formData.description || null,
        productionTimeMinutes: parseInt(formData.productionTimeMinutes) || 0,
        weight: parseFloat(formData.weight) || 0,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
        recommendedPrice: formData.recommendedPrice ? parseFloat(formData.recommendedPrice) : null,
        fileLinks: formData.fileLinks || null,
        markupPercent: parseFloat(formData.markupPercent) || 100,
        recipeItems: formData.recipeItems.map(item => ({
          materialId: item.materialId,
          quantity: parseFloat(item.quantity),
        })),
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, data);
      } else {
        await productsApi.create(data);
      }

      setModalOpen(false);
      loadProducts();
      loadCategories();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (product) => {
    if (!confirm(`${product.isArchived ? 'Разархивировать' : 'Архивировать'} изделие "${product.name}"?`)) return;
    
    try {
      if (product.isArchived) {
        await productsApi.unarchive(product.id);
      } else {
        await productsApi.archive(product.id);
      }
      loadProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка');
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Удалить изделие "${product.name}"? Это действие нельзя отменить.`)) return;
    
    try {
      await productsApi.delete(product.id);
      loadProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleCopy = async () => {
    if (!copyName.trim()) return;
    
    try {
      await productsApi.copy(productToCopy.id, { newName: copyName });
      setCopyModalOpen(false);
      setProductToCopy(null);
      setCopyName('');
      loadProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка копирования');
    }
  };

  const openCopyModal = (product) => {
    setProductToCopy(product);
    setCopyName(`${product.name} (копия)`);
    setCopyModalOpen(true);
  };

  const addRecipeItem = () => {
    setFormData({
      ...formData,
      recipeItems: [...formData.recipeItems, { materialId: '', quantity: '' }],
    });
  };

  const updateRecipeItem = (index, field, value) => {
    const newItems = [...formData.recipeItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, recipeItems: newItems });
  };

  const removeRecipeItem = (index) => {
    setFormData({
      ...formData,
      recipeItems: formData.recipeItems.filter((_, i) => i !== index),
    });
  };

  // Расчёт веса из материалов (кг, г)
  const calculateWeightFromMaterials = () => {
    let totalWeightKg = 0;
    
    formData.recipeItems.forEach(item => {
      const material = materials.find(m => m.id === parseInt(item.materialId));
      if (material && item.quantity) {
        const unit = material.unit.toLowerCase().trim();
        const qty = parseFloat(item.quantity) || 0;
        
        // Если единица измерения - килограммы
        if (unit === 'кг' || unit === 'kg' || unit === 'килограмм' || unit === 'килограммы') {
          totalWeightKg += qty;
        }
        // Если единица измерения - граммы
        else if (unit === 'г' || unit === 'g' || unit === 'гр' || unit === 'грамм' || unit === 'граммы') {
          totalWeightKg += qty / 1000;
        }
      }
    });
    
    return totalWeightKg.toFixed(4);
  };

  // Авто-обновление веса при изменении материалов
  useEffect(() => {
    if (formData.recipeItems.length > 0 && materials.length > 0) {
      const calculatedWeight = calculateWeightFromMaterials();
      if (calculatedWeight !== formData.weight) {
        setFormData(prev => ({ ...prev, weight: calculatedWeight }));
      }
    }
  }, [formData.recipeItems, materials]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatTime = (minutes) => {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} мин`;
    if (m === 0) return `${h} ч`;
    return `${h} ч ${m} мин`;
  };

  const columns = [
    { key: 'name', title: 'Название', render: (val) => (
      <span className="font-medium text-white">{val}</span>
    )},
    { key: 'category', title: 'Категория', render: (val) => val || '-' },
    { key: 'weight', title: 'Вес (кг)', render: (val) => val ? `${val} кг` : '-' },
    { key: 'productionTimeMinutes', title: 'Время', render: (val) => formatTime(val) },
    { key: 'estimatedCost', title: 'Себестоимость', render: (val) => formatCurrency(val) },
    { key: 'recommendedPrice', title: 'Рек. цена', render: (val) => (
      <span className="text-primary-400 font-medium">{formatCurrency(val)}</span>
    )},
    { key: 'inStockCount', title: 'На складе', render: (val) => val > 0 ? (
      <Badge variant="success">{val} шт</Badge>
    ) : '-' },
    { key: 'isArchived', title: 'Статус', render: (val) => (
      val ? <Badge variant="default">Архив</Badge> : <Badge variant="success">Активен</Badge>
    )},
    { key: 'actions', title: '', render: (_, row) => (
      <div className="flex gap-1">
        <button 
          onClick={(e) => { e.stopPropagation(); openModal(row); }}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          title="Редактировать"
        >
          <Edit size={16} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); openCopyModal(row); }}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          title="Копировать"
        >
          <Copy size={16} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleArchive(row); }}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          title={row.isArchived ? 'Разархивировать' : 'Архивировать'}
        >
          {row.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
          title="Удалить"
        >
          <Trash2 size={16} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="pl-10 lg:pl-0">
          <h1 className="text-2xl font-display font-bold text-white">Изделия</h1>
          <p className="text-slate-400">Рецепты и карточки изделий</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()} className="w-full sm:w-auto">
          Новое изделие
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
          data={products}
          emptyMessage="Изделия не найдены"
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Редактировать изделие' : 'Новое изделие'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Название"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Название изделия"
            />
            <Input
              label="Категория"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Категория"
              list="productCategories"
            />
            <datalist id="productCategories">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Себестоимость (руб.)"
              type="number"
              step="1"
              min="0"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              placeholder="Введите себестоимость"
            />
            <Input
              label="Рекомендованная цена (руб.)"
              type="number"
              step="1"
              min="0"
              value={formData.recommendedPrice}
              onChange={(e) => setFormData({ ...formData, recommendedPrice: e.target.value })}
              placeholder="Введите рек. цену"
            />
          </div>

          <Input
            label="Время изготовления (минуты)"
            type="number"
            min="0"
            value={formData.productionTimeMinutes}
            onChange={(e) => setFormData({ ...formData, productionTimeMinutes: e.target.value })}
          />

          <Textarea
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            label="Ссылки на файлы (3D модели, инструкции)"
            value={formData.fileLinks}
            onChange={(e) => setFormData({ ...formData, fileLinks: e.target.value })}
            placeholder="URL или JSON со ссылками"
          />

          {/* Recipe items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Материалы в рецепте</label>
              <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={addRecipeItem}>
                Добавить
              </Button>
            </div>
            
            {formData.recipeItems.length === 0 ? (
              <p className="text-slate-400 text-sm p-4 text-center border border-dashed border-slate-600 rounded-lg">
                Нет материалов. Нажмите "Добавить" чтобы добавить материал в рецепт.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.recipeItems.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-center p-3 bg-slate-800/50 rounded-lg">
                    <select
                      value={item.materialId}
                      onChange={(e) => updateRecipeItem(index, 'materialId', e.target.value)}
                      className="flex-1"
                      required
                    >
                      <option value="">Выберите материал</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.color ? ` (${m.color})` : ''} - {m.unit}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateRecipeItem(index, 'quantity', e.target.value)}
                        placeholder="Кол-во"
                        className="w-full sm:w-32"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeRecipeItem(index)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Отображение рассчитанного веса */}
            {formData.recipeItems.length > 0 && parseFloat(formData.weight) > 0 && (
              <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                <p className="text-sm text-slate-300">
                  <span className="text-slate-400">Вес изделия (авто): </span>
                  <span className="font-medium text-primary-400">{parseFloat(formData.weight).toFixed(2)} кг</span>
                  <span className="text-slate-500 ml-2">
                    ({(parseFloat(formData.weight) * 1000).toFixed(0)} г)
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={saving} className="flex-1">
              {editingProduct ? 'Сохранить' : 'Создать'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </Modal>

      {/* Copy Modal */}
      <Modal
        isOpen={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        title="Копировать изделие"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Название копии"
            required
            value={copyName}
            onChange={(e) => setCopyName(e.target.value)}
          />
          <div className="flex gap-3">
            <Button onClick={handleCopy} className="flex-1">
              Копировать
            </Button>
            <Button variant="secondary" onClick={() => setCopyModalOpen(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Products;
