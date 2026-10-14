import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getZoneById } from '../data/zones';
import {
    fetchProductsByZone,
    getOrCreateSession,
    saveProductStock,
    completeSession,
} from '../firebase/inventory';
import { LoadingScreen } from '../components/ui/LoadingScreen/LoadingScreen';
import styles from './InventoryZonePage.module.css';

export default function InventoryZonePage() {
    const { zone } = useParams();
    const zoneData = getZoneById(zone);

    const [type, setType] = useState('product');
    const [unitMode, setUnitMode] = useState('кг'); // 'кг' | 'г'
    const [lists, setLists] = useState({ product: [], semi: [] });
    const [loading, setLoading] = useState(true);
    const [sessionId, setSessionId] = useState(null);
    const [query, setQuery] = useState('');
    const [showOnlyFilled, setShowOnlyFilled] = useState(false);
    const [showOnlyEmpty, setShowOnlyEmpty] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [addMoreProduct, setAddMoreProduct] = useState(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                const [prods, semis] = await Promise.all([
                    fetchProductsByZone('product', zone),
                    fetchProductsByZone('semi', zone),
                ]);
                if (!mounted) return;
                setLists({ product: prods, semi: semis });

                const sid = await getOrCreateSession('product', zone);
                if (!mounted) return;
                setSessionId(sid);
            } catch (err) {
                console.error(err);
                alert('Ошибка загрузки: ' + err.message);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [zone]);

    const products = lists[type] || [];

    const filledCount = useMemo(
        () => products.filter(p => p.currentStock > 0).length,
        [products]
    );
    const totalCount = products.length;
    const progress = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

    const filtered = useMemo(() => {
        let list = products;
        if (showOnlyFilled) list = list.filter(p => p.currentStock > 0);
        if (showOnlyEmpty) list = list.filter(p => !p.currentStock);
        const q = query.trim().toLowerCase();
        if (q) {
            list = list.filter(
                p =>
                    p.name.toLowerCase().includes(q) ||
                    String(p.code).toLowerCase().includes(q)
            );
        }
        return list;
    }, [products, query, showOnlyFilled, showOnlyEmpty]);

    const grouped = useMemo(() => {
        const map = new Map();
        filtered.forEach(p => {
            if (!map.has(p.category)) map.set(p.category, []);
            map.get(p.category).push(p);
        });
        return Array.from(map.entries());
    }, [filtered]);

    const updateStock = (id, value) => {
        setLists(prev => ({
            ...prev,
            [type]: prev[type].map(p => (p.id === id ? { ...p, currentStock: value } : p)),
        }));
        saveProductStock(id, value).catch(err => console.error(err));
    };

    const handleFinish = async () => {
        if (!sessionId) return;
        if (!confirm(`Завершить? Заполнено ${filledCount} из ${totalCount}.`)) return;
        try {
            await completeSession(sessionId);
            alert('Инвентаризация завершена!');
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    const handleAddProduct = async (data) => {
        try {
            const payload = {
                code: data.code || `new-${Date.now()}`,
                name: data.name,
                unit: data.unit,
                type,
                zone,
                category: data.category || 'Прочее',
                currentStock: data.currentStock || 0,
                isActive: true,
                createdAt: serverTimestamp(),
            };
            const ref = await addDoc(collection(db, 'products'), payload);
            const newItem = { id: ref.id, ...payload };
            setLists(prev => ({
                ...prev,
                [type]: [...prev[type], newItem],
            }));
            setAddModalOpen(false);
        } catch (err) {
            alert('Ошибка добавления: ' + err.message);
        }
    };

    const handleAddMore = (product, addValue) => {
        const newValue = (Number(product.currentStock) || 0) + addValue;
        updateStock(product.id, newValue);
        setAddMoreProduct(null);
    };

    if (loading) return <LoadingScreen text="Загружаем продукты..." />;

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.titleBlock}>
                    <h1>{zoneData.icon} {zoneData.name}</h1>
                    <p>Заполнено {filledCount} из {totalCount}</p>
                </div>
                <Link to="/kitchen/inventory" className={styles.backBtn}>
                    ← Назад
                </Link>
            </div>

            {/* Переключатель Товары / ПФ */}
            <div className={styles.typeSwitch}>
                <button
                    type="button"
                    className={`${styles.typeBtn} ${type === 'product' ? styles.typeBtnActive : ''}`}
                    onClick={() => setType('product')}
                >
                    📦 Товары ({lists.product.length})
                </button>
                <button
                    type="button"
                    className={`${styles.typeBtn} ${type === 'semi' ? styles.typeBtnActive : ''}`}
                    onClick={() => setType('semi')}
                >
                    🥣 П/Ф ({lists.semi.length})
                </button>
            </div>

            {/* Прогресс */}
            <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.progressText}>{progress}%</div>

            {/* Глобальный переключатель единиц */}
            <div className={styles.globalUnitSwitch}>
                <button
                    type="button"
                    className={`${styles.globalUnitBtn} ${unitMode === 'кг' ? styles.globalUnitBtnActive : ''}`}
                    onClick={() => setUnitMode('кг')}
                >
                    кг
                </button>
                <button
                    type="button"
                    className={`${styles.globalUnitBtn} ${unitMode === 'г' ? styles.globalUnitBtnActive : ''}`}
                    onClick={() => setUnitMode('г')}
                >
                    г
                </button>
            </div>

            {/* Поиск + Добавить */}
            <div className={styles.searchRow}>
                <input
                    className={styles.search}
                    type="search"
                    placeholder="🔍 Поиск по названию или коду..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoComplete="off"
                />
                <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => setAddModalOpen(true)}
                >
                    + Добавить
                </button>
            </div>

            {/* Фильтры */}
            <div className={styles.filters}>
                <button
                    type="button"
                    className={`${styles.filterBtn} ${showOnlyEmpty ? styles.filterBtnActive : ''}`}
                    onClick={() => {
                        setShowOnlyEmpty(v => !v);
                        setShowOnlyFilled(false);
                    }}
                >
                    Только незаполненные
                </button>
                <button
                    type="button"
                    className={`${styles.filterBtn} ${showOnlyFilled ? styles.filterBtnActive : ''}`}
                    onClick={() => {
                        setShowOnlyFilled(v => !v);
                        setShowOnlyEmpty(false);
                    }}
                >
                    Только заполненные
                </button>
            </div>

            {/* Список */}
            <div className={styles.list}>
                {grouped.length === 0 && (
                    <div className={styles.empty}>
                        <p>Ничего не найдено</p>
                        <button
                            type="button"
                            className={styles.emptyAddBtn}
                            onClick={() => setAddModalOpen(true)}
                        >
                            + Добавить продукт
                        </button>
                    </div>
                )}
                {grouped.map(([category, items]) => (
                    <div key={category} className={styles.category}>
                        <div className={styles.categoryTitle}>{category}</div>
                        {items.map(p => (
                            <InventoryRow
                                key={p.id}
                                product={p}
                                unitMode={unitMode}
                                onChange={updateStock}
                                onAddMore={() => setAddMoreProduct(p)}
                            />
                        ))}
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <button className={styles.finishBtn} onClick={handleFinish}>
                    ✓ Завершить инвентаризацию
                </button>
            </div>

            {addModalOpen && (
                <AddProductModal
                    type={type}
                    unitMode={unitMode}
                    existingCategories={[...new Set(products.map(p => p.category))].filter(Boolean)}
                    onSave={handleAddProduct}
                    onClose={() => setAddModalOpen(false)}
                />
            )}

            {addMoreProduct && (
                <AddMoreModal
                    product={addMoreProduct}
                    unitMode={unitMode}
                    onConfirm={handleAddMore}
                    onClose={() => setAddMoreProduct(null)}
                />
            )}
        </div>
    );
}

// ===== Строка продукта =====
function InventoryRow({ product, unitMode, onChange, onAddMore }) {
    const isPiece = product.unit === 'шт';
    const currentKg = Number(product.currentStock) || 0;

    // Локальное значение в текущем режиме (г или кг)
    const [localValue, setLocalValue] = useState(() => {
        if (!currentKg) return '';
        if (isPiece) return String(currentKg);
        return unitMode === 'г'
            ? String(Math.round(currentKg * 1000))
            : String(currentKg);
    });

    const timerRef = useRef(null);
    const prevModeRef = useRef(unitMode);

    // При смене глобального режима — пересчитать отображение
    useEffect(() => {
        if (prevModeRef.current === unitMode) return;
        prevModeRef.current = unitMode;

        if (!currentKg) {
            setLocalValue('');
            return;
        }
        if (isPiece) return;
        setLocalValue(
            unitMode === 'г'
                ? String(Math.round(currentKg * 1000))
                : String(currentKg)
        );
    }, [unitMode, currentKg, isPiece]);

    const toStorage = (val) => {
        if (isPiece) return val;
        return unitMode === 'г' ? val / 1000 : val;
    };

    const handleChange = (raw) => {
        const cleaned = raw.replace(/[^\d.,]/g, '').replace(',', '.');
        setLocalValue(cleaned);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const num = parseFloat(cleaned) || 0;
            onChange(product.id, toStorage(num));
        }, 500);
    };

    const isFilled = localValue !== '';

    const hint = (() => {
        if (isPiece) return '';
        if (!localValue) return '';
        const num = parseFloat(localValue);
        if (isNaN(num)) return '';
        if (unitMode === 'кг') {
            const g = Math.round(num * 1000);
            if (g === 0) return '';
            if (g < 1000) return `≈ ${g} г`;
            const kg = Math.floor(g / 1000);
            const rem = g % 1000;
            return `≈ ${kg} кг${rem ? ' ' + rem + ' г' : ''}`;
        } else {
            const kg = num / 1000;
            if (kg === 0) return '';
            return `≈ ${kg.toFixed(kg < 1 ? 3 : 2).replace(/\.?0+$/, '')} кг`;
        }
    })();

    return (
        <div className={`${styles.row} ${isFilled ? styles.rowFilled : ''}`}>
            <div className={styles.rowInfo}>
                <div className={styles.rowCode}>{product.code}</div>
                <div className={styles.rowName}>{product.name}</div>
            </div>

            <div className={styles.rowRight}>
                <div className={styles.rowInput}>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={localValue}
                        onChange={e => handleChange(e.target.value)}
                        placeholder="0"
                        className={styles.input}
                    />
                    <span className={styles.unit}>
                        {isPiece ? 'шт' : unitMode}
                    </span>
                    <button
                        type="button"
                        className={styles.plusBtn}
                        onClick={onAddMore}
                        title="Добавить ещё"
                    >
                        +
                    </button>
                </div>
                {hint && <div className={styles.hint}>{hint}</div>}
            </div>
        </div>
    );
}

// ===== Модалка «Добавить ещё» =====
function AddMoreModal({ product, unitMode, onConfirm, onClose }) {
    const isPiece = product.unit === 'шт';
    const [value, setValue] = useState('');
    const currentKg = Number(product.currentStock) || 0;

    const handleConfirm = () => {
        const num = parseFloat(value.replace(',', '.'));
        if (!num || num <= 0) {
            alert('Введи число больше 0');
            return;
        }
        const addKg = isPiece ? num : unitMode === 'г' ? num / 1000 : num;
        onConfirm(product, addKg);
    };

    const currentDisplay = (() => {
        if (isPiece) return `${currentKg} шт`;
        if (currentKg === 0) return '0';
        if (unitMode === 'г') return `${Math.round(currentKg * 1000)} г`;
        return `${currentKg} кг`;
    })();

    const unitLabel = isPiece ? 'шт' : unitMode;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalTitle}>Добавить ещё</div>

                <div className={styles.modalProduct}>
                    <div className={styles.modalProductCode}>{product.code}</div>
                    <div className={styles.modalProductName}>{product.name}</div>
                    <div className={styles.modalCurrent}>
                        Текущий остаток: <strong>{currentDisplay}</strong>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Добавить ({unitLabel})</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={value}
                        onChange={e =>
                            setValue(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))
                        }
                        placeholder="100"
                        autoFocus
                    />
                </div>

                <div className={styles.modalActions}>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnSecondary}`}
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                        onClick={handleConfirm}
                    >
                        Добавить
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== Модалка добавления нового продукта =====
function AddProductModal({ type, unitMode, existingCategories, onSave, onClose }) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [unit, setUnit] = useState('кг');
    const [category, setCategory] = useState(existingCategories[0] || 'Прочее');
    const [stockValue, setStockValue] = useState('');

    const isPiece = unit === 'шт';

    // Какую единицу показывать для массы
    const massUnit = isPiece ? 'шт' : unitMode;

    const handleSubmit = () => {
        if (!name.trim()) {
            alert('Введи название');
            return;
        }

        // Переводим остаток в основную единицу (кг/шт/л)
        let currentStock = 0;
        if (stockValue) {
            const num = parseFloat(stockValue.replace(',', '.')) || 0;
            if (isPiece) {
                currentStock = num;
            } else if (massUnit === 'г') {
                currentStock = num / 1000;
            } else {
                currentStock = num;
            }
        }

        onSave({
            name: name.trim(),
            code: code.trim(),
            unit,
            category,
            currentStock,
        });
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalTitle}>
                    Добавить {type === 'product' ? 'товар' : 'П/Ф'}
                </div>

                <div className={styles.formGroup}>
                    <label>Название *</label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Например: Лосось филе"
                        autoFocus
                    />
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Код (необязательно)</label>
                        <input
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            placeholder="123"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Единица</label>
                        <select value={unit} onChange={e => setUnit(e.target.value)}>
                            <option value="кг">кг</option>
                            <option value="шт">шт</option>
                            <option value="л">л</option>
                        </select>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Остаток ({massUnit})</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={stockValue}
                        onChange={e =>
                            setStockValue(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))
                        }
                        placeholder="100"
                    />
                    {!isPiece && stockValue && (
                        <div className={styles.modalHint}>
                            {(() => {
                                const num = parseFloat(stockValue) || 0;
                                if (massUnit === 'г') {
                                    const kg = num / 1000;
                                    return `≈ ${kg.toFixed(kg < 1 ? 3 : 2).replace(/\.?0+$/, '')} кг`;
                                } else {
                                    const g = Math.round(num * 1000);
                                    if (g < 1000) return `≈ ${g} г`;
                                    const kg = Math.floor(g / 1000);
                                    const rem = g % 1000;
                                    return `≈ ${kg} кг${rem ? ' ' + rem + ' г' : ''}`;
                                }
                            })()}
                        </div>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label>Категория</label>
                    <input
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        placeholder="Например: Рыба"
                        list="categories-list"
                    />
                    <datalist id="categories-list">
                        {existingCategories.map(c => <option key={c} value={c} />)}
                    </datalist>
                </div>

                <div className={styles.modalActions}>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnSecondary}`}
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                        onClick={handleSubmit}
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
}