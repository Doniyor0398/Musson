import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { NumPad } from '../components/ui/NumPad/NumPad';
import styles from './AdminPage.module.css';

const PIN_CODE = '1234'; // ← потом заменим на чтение из Firestore

export default function AdminPage() {
    const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin') === 'ok');
    const [pin, setPin] = useState(0);
    const [pinError, setPinError] = useState('');

    const [tab, setTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    const [modal, setModal] = useState(null); // null | {type, item}

    // ===== PIN =====
    const handlePinOk = () => {
        if (String(pin) === PIN_CODE) {
            sessionStorage.setItem('admin', 'ok');
            setAuthed(true);
            setPinError('');
        } else {
            setPinError('Неверный PIN-код');
            setPin(0);
        }
    };

    // ===== ЗАГРУЗКА ДАННЫХ =====
    useEffect(() => {
        if (!authed) return;
        async function load() {
            setLoading(true);
            const [pSnap, eSnap] = await Promise.all([
                getDocs(collection(db, 'products')),
                getDocs(collection(db, 'employees')),
            ]);
            setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.isActive !== false));
            setEmployees(eSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => e.isActive !== false));
            setLoading(false);
        }
        load();
    }, [authed]);

    // ===== ФИЛЬТРАЦИЯ =====
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

    // ===== CRUD =====
    const handleSave = async (data) => {
        const collectionName = modal.type.startsWith('product') ? 'products' : 'employees';
        try {
            if (modal.item?.id) {
                await updateDoc(doc(db, collectionName, modal.item.id), data);
                if (collectionName === 'products') {
                    setProducts(prev => prev.map(p => p.id === modal.item.id ? { ...p, ...data } : p));
                } else {
                    setEmployees(prev => prev.map(e => e.id === modal.item.id ? { ...e, ...data } : e));
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

    // ===== PIN-ЭКРАН =====
    if (!authed) {
        return (
            <div className={styles.page}>
                <div className={styles.pinScreen}>
                    <div className={styles.pinCard}>
                        <div className={styles.pinIcon}>🔐</div>
                        <div className={styles.pinTitle}>Вход в админку</div>
                        <div className={styles.pinSubtitle}>Введите PIN-код</div>

                        <div className={styles.pinDisplay}>
                            {String(pin).padStart(4, '0')}
                        </div>

                        <NumPad value={pin} onChange={setPin} max={9999} />

                        <div className={styles.pinError}>{pinError}</div>

                        <button className={styles.modalBtnPrimary} style={{ width: '100%', marginTop: 8 }} onClick={handlePinOk}>
                            Войти
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ===== АДМИНКА =====
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>⚙️ Админ-панель</h1>
                    <p>Управление продуктами и сотрудниками</p>
                </div>
                <Link to="/" className={styles.backBtn}>← На главную</Link>
            </div>

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
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <input
                        className={styles.search}
                        type="search"
                        placeholder="🔍 Поиск..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button
                        className={styles.addBtn}
                        onClick={() => setModal({ type: tab === 'products' ? 'product-new' : 'employee-new', item: null })}
                    >
                        + Добавить
                    </button>
                </div>

                {loading ? (
                    <div className={styles.empty}>Загрузка...</div>
                ) : tab === 'products' ? (
                    filteredProducts.length === 0 ? (
                        <div className={styles.empty}>Ничего не найдено</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Срок (ч)</th>
                                    <th>Порция (г)</th>
                                    <th style={{ width: 100 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>{p.hours}</td>
                                        <td>{p.portion}</td>
                                        <td>
                                            <div className={styles.actionsCell}>
                                                <button
                                                    className={styles.iconBtn}
                                                    onClick={() => setModal({ type: 'product-edit', item: p })}
                                                    title="Редактировать"
                                                >✏️</button>
                                                <button
                                                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                                    onClick={() => handleDelete('product', p.id)}
                                                    title="Удалить"
                                                >🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    filteredEmployees.length === 0 ? (
                        <div className={styles.empty}>Ничего не найдено</div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ФИО</th>
                                    <th>Роль</th>
                                    <th style={{ width: 100 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map(e => (
                                    <tr key={e.id}>
                                        <td>{e.name}</td>
                                        <td>{e.role || '—'}</td>
                                        <td>
                                            <div className={styles.actionsCell}>
                                                <button
                                                    className={styles.iconBtn}
                                                    onClick={() => setModal({ type: 'employee-edit', item: e })}
                                                >✏️</button>
                                                <button
                                                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                                    onClick={() => handleDelete('employee', e.id)}
                                                >🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>

            {modal && (
                <ModalEdit
                    modal={modal}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}

// ===== МОДАЛКА РЕДАКТИРОВАНИЯ =====
function ModalEdit({ modal, onSave, onClose }) {
    const isProduct = modal.type.startsWith('product');
    const item = modal.item;

    const [form, setForm] = useState(() => isProduct ? {
        name: item?.name || '',
        hours: item?.hours || 24,
        portion: item?.portion || 100,
        ingredients: item?.ingredients || '',
        protein: item?.protein || 0,
        fat: item?.fat || 0,
        carbs: item?.carbs || 0,
        calories: item?.calories || 0,
        quantity: item?.quantity || '1 Кг',
    } : {
        name: item?.name || '',
        role: item?.role || 'cook',
    });

    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = () => {
        if (!form.name.trim()) {
            alert('Заполни название');
            return;
        }
        onSave(form);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalTitle}>
                    {item ? 'Редактировать' : 'Добавить'} {isProduct ? 'продукт' : 'сотрудника'}
                </div>

                <div className={styles.formGroup}>
                    <label>{isProduct ? 'Название продукта' : 'ФИО сотрудника'}</label>
                    <input
                        value={form.name}
                        onChange={e => setField('name', e.target.value)}
                        placeholder={isProduct ? 'Лосось филе П/Ф' : 'Иванов Иван'}
                    />
                </div>

                {isProduct ? (
                    <>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Срок годности (часы)</label>
                                <input
                                    type="number"
                                    value={form.hours}
                                    onChange={e => setField('hours', Number(e.target.value))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Порция (г)</label>
                                <input
                                    type="number"
                                    value={form.portion}
                                    onChange={e => setField('portion', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Количество (упаковка)</label>
                            <input
                                value={form.quantity}
                                onChange={e => setField('quantity', e.target.value)}
                                placeholder="1 Кг"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Состав</label>
                            <textarea
                                value={form.ingredients}
                                onChange={e => setField('ingredients', e.target.value)}
                                placeholder="Лосось, соль"
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.formGroup}>
                        <label>Роль</label>
                        <select value={form.role} onChange={e => setField('role', e.target.value)}>
                            <option value="chef">Шеф-повар</option>
                            <option value="sous_chef">Су-шеф</option>
                            <option value="cook">Повар</option>
                            <option value="helper">Помощник</option>
                        </select>
                    </div>
                )}

                <div className={styles.modalActions}>
                    <button className={`${styles.modalBtn} ${styles.modalBtnSecondary}`} onClick={onClose}>
                        Отмена
                    </button>
                    <button className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={handleSubmit}>
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
}