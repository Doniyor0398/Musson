import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PageLayout } from '../components/layout/PageLayout';
import { Section } from '../components/layout/Section';
import { ProductsTab } from '../features/admin/ProductsTab';
import { EmployeesTab } from '../features/admin/EmployeesTab';
import { ModalEdit } from '../features/admin/ModalEdit';
import { ReportsTab } from './ReportsTab';
import styles from '../features/admin/admin.module.css';

export default function AdminPage() {
    const [tab, setTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [modal, setModal] = useState(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [pSnap, eSnap] = await Promise.all([
                    getDocs(collection(db, 'products')),
                    getDocs(collection(db, 'employees')),
                ]);
                setProducts(
                    pSnap.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter(p => p.isActive !== false),
                );
                setEmployees(
                    eSnap.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter(e => e.isActive !== false),
                );
            } catch (err) {
                console.error('Ошибка загрузки:', err);
                alert('Ошибка загрузки: ' + err.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filteredProducts = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return products;
        return products.filter(p => p.name.toLowerCase().includes(q));
    }, [products, query]);

    const filteredEmployees = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return employees;
        return employees.filter(e => e.name.toLowerCase().includes(q));
    }, [employees, query]);

    const handleSave = async (data) => {
        const collectionName = modal.type.startsWith('product')
            ? 'products'
            : 'employees';
        try {
            if (modal.item?.id) {
                await updateDoc(doc(db, collectionName, modal.item.id), data);
                if (collectionName === 'products') {
                    setProducts(prev =>
                        prev.map(p =>
                            p.id === modal.item.id ? { ...p, ...data } : p,
                        ),
                    );
                } else {
                    setEmployees(prev =>
                        prev.map(e =>
                            e.id === modal.item.id ? { ...e, ...data } : e,
                        ),
                    );
                }
            } else {
                const ref = await addDoc(collection(db, collectionName), {
                    ...data,
                    isActive: true,
                    createdAt: new Date(),
                });
                const newItem = { id: ref.id, ...data, isActive: true };
                if (collectionName === 'products') {
                    setProducts(prev => [...prev, newItem]);
                } else {
                    setEmployees(prev => [...prev, newItem]);
                }
            }
            setModal(null);
        } catch (err) {
            console.error(err);
            alert('Ошибка сохранения: ' + err.message);
        }
    };

    const handleDelete = async (type, id) => {
        if (!confirm('Точно удалить?')) return;
        const collectionName = type.startsWith('product') ? 'products' : 'employees';
        try {
            await updateDoc(doc(db, collectionName, id), { isActive: false });
            if (collectionName === 'products') {
                setProducts(prev => prev.filter(p => p.id !== id));
            } else {
                setEmployees(prev => prev.filter(e => e.id !== id));
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка удаления: ' + err.message);
        }
    };

    const openNew = () => {
        setModal({
            type: tab === 'products' ? 'product-new' : 'employee-new',
            item: null,
        });
    };

    return (
        <PageLayout
            title="⚙️ Админ-панель"
            subtitle="Управление продуктами и сотрудниками"
            backTo="/kitchen"
            maxWidth={900}
        >
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${tab === 'products' ? styles.tabActive : ''}`}
                    onClick={() => { setTab('products'); setQuery(''); }}
                >
                    📦 Продукты ({products.length})
                </button>
                <button
                    className={`${styles.tab} ${tab === 'employees' ? styles.tabActive : ''}`}
                    onClick={() => { setTab('employees'); setQuery(''); }}
                >
                    👥 Сотрудники ({employees.length})
                </button>
                <button
                    className={`${styles.tab} ${tab === 'reports' ? styles.tabActive : ''}`}
                    onClick={() => { setTab('reports'); setQuery(''); }}
                >
                    📊 Отчёты
                </button>
            </div>

            {tab === 'reports' ? (
                <Section>
                    <ReportsTab />
                </Section>
            ) : (
                <Section>
                    <div className={styles.sectionHeader}>
                        <input
                            className={styles.search}
                            type="search"
                            placeholder="🔍 Поиск..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        <button className={styles.addBtn} onClick={openNew}>
                            + Добавить
                        </button>
                    </div>

                    {loading ? (
                        <div className={styles.empty}>Загрузка...</div>
                    ) : tab === 'products' ? (
                        <ProductsTab
                            products={filteredProducts}
                            onEdit={p => setModal({ type: 'product-edit', item: p })}
                            onDelete={id => handleDelete('product', id)}
                        />
                    ) : (
                        <EmployeesTab
                            employees={filteredEmployees}
                            onEdit={e => setModal({ type: 'employee-edit', item: e })}
                            onDelete={id => handleDelete('employee', id)}
                        />
                    )}
                </Section>
            )}

            {modal && (
                <ModalEdit
                    modal={modal}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
        </PageLayout>
    );
}