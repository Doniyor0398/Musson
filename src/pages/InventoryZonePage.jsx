import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
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
import { PageLayout } from '../components/layout/PageLayout';
import { InventoryRow } from '../features/inventory/InventoryRow';
import { AddMoreModal } from '../features/inventory/AddMoreModal';
import { AddProductModal } from '../features/inventory/AddProductModal';
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
    const [responsible, setResponsible] = useState(
        () => sessionStorage.getItem('inventory.responsible') || ''
    );
    const [showFinishModal, setShowFinishModal] = useState(false);

    const { employees, loading: loadingEmp } = useEmployees();

    useEffect(() => {
        if (responsible) {
            sessionStorage.setItem('inventory.responsible', responsible);
        }
    }, [responsible]);

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
                            : p.lastActual || 0,
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
        return () => {
            mounted = false;
        };
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
            [type]: prev[type].map(p =>
                p.id === id ? { ...p, currentStock: value } : p
            ),
        }));

        try {
            let sid = sessionIds[type];
            if (!sid) {
                sid = await ensureSession(zone, type, responsible || null);
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

    const handleFinishClick = () => {
        const sid = sessionIds[type];
        if (!sid) {
            alert('Ничего не введено — нечего завершать');
            return;
        }
        setShowFinishModal(true);
    };

    const handleFinishConfirm = async () => {
        const sid = sessionIds[type];
        if (!sid) return;
        try {
            await completeSession(sid);
            setSessionIds(prev => ({ ...prev, [type]: null }));
            setShowFinishModal(false);
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
            setLists(prev => ({ ...prev, [type]: [...prev[type], newItem] }));
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

    if (loading || loadingEmp) return <LoadingScreen text="Загрузка..." />;

    // ===== Шаг 1: выбор повара =====
    if (!responsible) {
        return (
            <PageLayout
                title={`${zoneData.icon} ${zoneData.name}`}
                subtitle="Кто считает?"
                backTo="/kitchen/inventory"
            >
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
            </PageLayout>
        );
    }

    // ===== Шаг 2: инвентаризация =====
    return (
        <PageLayout
            title={`${zoneData.icon} ${zoneData.name}`}
            subtitle={`Повар: ${responsible} · Заполнено ${filledCount} из ${totalCount}`}
            backTo="/kitchen/inventory"
            actions={
                <button
                    type="button"
                    className={styles.changeBtn}
                    onClick={() => {
                        sessionStorage.removeItem('inventory.responsible');
                        setResponsible('');
                    }}
                >
                    🔄 Сменить
                </button>
            }
        >
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
                <div
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                />
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
                <button className={styles.finishBtn} onClick={handleFinishClick}>
                    ✓ Завершить инвентаризацию
                </button>
            </div>

            {addModalOpen && (
                <AddProductModal
                    type={type}
                    unitMode={unitMode}
                    existingCategories={[
                        ...new Set(products.map(p => p.category)),
                    ].filter(Boolean)}
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

            {showFinishModal && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setShowFinishModal(false)}
                >
                    <div
                        className={styles.finishModal}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={styles.finishIcon}>⚠️</div>
                        <div className={styles.finishTitle}>ВАЖНО — ПРОВЕРЬ!</div>
                        <div className={styles.finishText}>
                            После завершения изменить данные будет нельзя.
                        </div>
                        <div className={styles.finishInfo}>
                            <div>
                                Заполнено: <strong>{filledCount}</strong> из {totalCount}
                            </div>
                            <div>
                                Повар: <strong>{responsible}</strong>
                            </div>
                        </div>
                        <div className={styles.finishActions}>
                            <button
                                type="button"
                                className={styles.finishCancel}
                                onClick={() => setShowFinishModal(false)}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className={styles.finishConfirm}
                                onClick={handleFinishConfirm}
                            >
                                ✓ Завершить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}