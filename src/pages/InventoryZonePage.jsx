import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getZoneById } from '../data/zones';
import { useEmployees } from '../hooks/useEmployees';
import {
    fetchProductsByZone,
    ensureSession,
    saveItem,
    completeSession,
    getActiveSession,
    fetchSessionItems,
} from '../firebase/inventory';
import { LoadingScreen } from '../components/ui/LoadingScreen/LoadingScreen';
import styles from './InventoryZonePage.module.css';

export default function InventoryZonePage() {
    const { zone } = useParams();
    const zoneData = getZoneById(zone);

    const [type, setType] = useState('product');
    const [unitMode, setUnitMode] = useState('кг');
    const [lists, setLists] = useState({ product: [], semi: [] });
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [showOnlyFilled, setShowOnlyFilled] = useState(false);
    const [showOnlyEmpty, setShowOnlyEmpty] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [addMoreProduct, setAddMoreProduct] = useState(null);
    const [sessionIds, setSessionIds] = useState({ product: null, semi: null });

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                const [prods, semis] = await Promise.all([
                    fetchProductsByZone('product', zone),
                    fetchProductsByZone('semi', zone),
                ]);

                const [sidP, sidS] = await Promise.all([
                    getActiveSession(zone, 'product'),
                    getActiveSession(zone, 'semi'),
                ]);

                const [itemsP, itemsS] = await Promise.all([
                    sidP ? fetchSessionItems(sidP) : Promise.resolve([]),
                    sidS ? fetchSessionItems(sidS) : Promise.resolve([]),
                ]);

                const applyItems = (arr, items) => {
                    const map = new Map(items.map(it => [it.id, it.value]));
                    return arr.map(p => ({
                        ...p,
                        currentStock: map.has(p.id)
                            ? map.get(p.id)
                            : (p.lastActual || 0),
                    }));
                };

                if (!mounted) return;
                setLists({
                    product: applyItems(prods, itemsP),
                    semi: applyItems(semis, itemsS),
                });
                setSessionIds({ product: sidP, semi: sidS });
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
        () => products.filter(p => (p.currentStock || 0) > 0).length,
        [products]
    );
    const totalCount = products.length;
    const progress = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

    const filtered = useMemo(() => {
        let list = products;
        if (showOnlyFilled) list = list.filter(p => (p.currentStock || 0) > 0);
        if (showOnlyEmpty) list = list.filter(p => (p.currentStock || 0) === 0);
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

    const updateStock = async (id, value) => {
        setLists(prev => ({
            ...prev,
            [type]: prev[type].map(p => (p.id === id ? { ...p, currentStock: value } : p)),
        }));

        try {
            let sid = sessionIds[type];
            if (!sid) {
                const responsible = sessionStorage.getItem('inventory.responsible') || null;
                sid = await ensureSession(zone, type, responsible);
                setSessionIds(prev => ({ ...prev, [type]: sid }));
            }

            const product = lists[type].find(p => p.id === id);
            await saveItem(sid, id, value, {
                name: product?.name,
                code: product?.code,
                unit: product?.unit,
                category: product?.category,
            });
        } catch (err) {
            console.error('Ошибка сохранения:', err);
        }
    };

    const handleFinish = async () => {
        const sid = sessionIds[type];
        if (!sid) {
            alert('Ничего не введено — нечего завершать');
            return;
        }
        if (!confirm(`Завершить? Заполнено ${filledCount} из ${totalCount}.`)) return;
        try {
            await completeSession(sid);
            setSessionIds(prev => ({ ...prev, [type]: null }));
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
                currentStock: 0,
                lastActual: 0,
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

    const [responsible, setResponsible] = useState(
        () => sessionStorage.getItem('inventory.responsible') || ''
    );

    useEffect(() => {
        if (responsible) {
            sessionStorage.setItem('inventory.responsible', responsible);
        }
    }, [responsible]);

    // Загружаем сотрудников для выбора
    const { employees, loading: loadingEmp } = useEmployees();

    if (loading || loadingEmp) return <LoadingScreen text="Загрузка..." />;

    // ===== Шаг 1: выбор повара =====
    if (!responsible) {
        return (
            <div className={styles.page}>
                <div className={styles.topBar}>
                    <div className={styles.titleBlock}>
                        <h1>{zoneData.icon} {zoneData.name}</h1>
                        <p>Кто считает?</p>
                    </div>
                    <Link to="/kitchen/inventory" className={styles.backBtn}>
                        ← Назад
                    </Link>
                </div>

                {employees.length === 0 ? (
                    <div className={styles.empty}>
                        <p>Нет сотрудников. Добавь их в админке.</p>
                    </div>
                ) : (
                    <div className={styles.employeeGrid}>
                        {employees.map(e => (
                            <button
                                key={e.id}
                                type="button"
                                className={styles.employeeBtn}
                                onClick={() => setResponsible(e.name)}
                            >
                                {e.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.titleBlock}>
                    <h1>{zoneData.icon} {zoneData.name}</h1>
                    <p>Повар: <strong>{responsible}</strong> · Заполнено {filledCount} из {totalCount}</p>
                </div>
                <Link to="/kitchen/inventory" className={styles.backBtn}>
                    ← Назад
                </Link>
            </div>

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

            <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.progressText}>{progress}%</div>

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

    const [localValue, setLocalValue] = useState(() => {
        if (!currentKg) return '';
        if (isPiece) return String(currentKg);
        return unitMode === 'г'
            ? String(Math.round(currentKg * 1000))
            : String(currentKg);
    });

    const prevModeRef = useRef(unitMode);
    const lastSavedRef = useRef(localValue);

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
    };

    const handleBlur = () => {
        if (localValue === lastSavedRef.current) return;
        const num = parseFloat(localValue) || 0;
        onChange(product.id, toStorage(num));
        lastSavedRef.current = localValue;
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') e.target.blur();
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
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
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
    const massUnit = isPiece ? 'шт' : unitMode;

    const handleSubmit = () => {
        if (!name.trim()) {
            alert('Введи название');
            return;
        }

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