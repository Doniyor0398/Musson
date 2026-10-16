import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useEmployees } from '../hooks/useEmployees';
import { COMPANY_INFO } from '../data/company';
import { ProductPicker } from '../features/label-form/ProductPicker';
import { EmployeePicker } from '../features/label-form/EmployeePicker';
import { DefrostPrintModal } from '../features/defrost/DefrostPrintModal';
import { LoadingScreen } from '../components/ui/LoadingScreen/LoadingScreen';
import { toDateTimeLocal } from '../utils/date';
import styles from './DefrostPage.module.css';

const METHODS = [
    {
        id: 'fridge',
        label: '🧊 Холодильник',
        text: 'в холодильнике',
        hint: 'при t +2…+6 °C',
        hours: 24,
    },
    {
        id: 'water',
        label: '💧 Вода',
        text: 'в холодной воде',
        hint: 'вода не выше +20 °C',
        hours: 2,
    },
    {
        id: 'microwave',
        label: '📡 СВЧ',
        text: 'в микроволновке',
        hint: 'сверхвысокочастотное излучение',
        hours: 0,
    },
];

export default function DefrostPage() {
    const { products, loading: loadingP } = useProducts();
    const { employees, loading: loadingE } = useEmployees();

    const [productId, setProductId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [startDate, setStartDate] = useState(() => toDateTimeLocal(new Date()));
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setHours(d.getHours() + 24);
        return toDateTimeLocal(d);
    });
    const [endEdited, setEndEdited] = useState(false);
    const [method, setMethod] = useState('fridge');
    const [customMethod, setCustomMethod] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Пересчёт окончания когда меняется способ или старт,
    // если повар сам не правил поле окончания
    useEffect(() => {
        if (endEdited) return;
        const m = METHODS.find(x => x.id === method);
        if (!m) return;
        const d = new Date(startDate);
        if (isNaN(d)) return;
        d.setHours(d.getHours() + m.hours);
        setEndDate(toDateTimeLocal(d));
    }, [method, startDate, endEdited]);

    if (loadingP || loadingE) return <LoadingScreen text="Загрузка..." />;

    const product = products.find(p => p.id === productId);
    const employee = employees.find(e => e.id === employeeId);
    const isCustom = method === '__custom__';
    const canShow =
        product &&
        employee &&
        startDate &&
        endDate &&
        (!isCustom || customMethod.trim());

    const methodLabel = isCustom
        ? customMethod
        : METHODS.find(m => m.id === method)?.text || '';

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.titleBlock}>
                    <h1>❄️ Разморозка</h1>
                    <p>Маркировка размороженных продуктов</p>
                </div>
                <Link to="/kitchen" className={styles.backBtn}>
                    ← Назад
                </Link>
            </div>

            {/* Таб-бар разделов. Активная — первая. */}
            <div className={styles.tabs}>
                <Link
                    to="/kitchen/defrost"
                    className={`${styles.tab} ${styles.tabActive}`}
                >
                    <span className={styles.tabTitle}>❄️ Разморозка</span>
                    <span className={styles.tabSub}>DEFROST</span>
                </Link>
                <Link to="/kitchen/products" className={styles.tab}>
                    <span className={styles.tabTitle}>🏷️ Продукты</span>
                    <span className={styles.tabSub}>PRODUCTS</span>
                </Link>
            </div>

            <div className={styles.section}>
                <ProductPicker
                    products={products}
                    selectedId={productId}
                    onSelect={setProductId}
                />
            </div>

            <div className={styles.section}>
                <div className={styles.sectionLabel}>Начало разморозки</div>
                <input
                    className={styles.input}
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                />
            </div>

            <div className={styles.section}>
                <div className={styles.sectionLabel}>Окончание разморозки</div>
                <input
                    className={styles.input}
                    type="datetime-local"
                    value={endDate}
                    onChange={e => {
                        setEndDate(e.target.value);
                        setEndEdited(true);
                    }}
                />
                {endEdited && (
                    <button
                        type="button"
                        className={styles.resetBtn}
                        onClick={() => setEndEdited(false)}
                    >
                        ↻ Пересчитать по способу
                    </button>
                )}
            </div>

            <div className={styles.section}>
                <div className={styles.sectionLabel}>Способ разморозки</div>
                <div className={styles.methodButtons}>
                    {METHODS.map(m => (
                        <button
                            key={m.id}
                            type="button"
                            className={`${styles.methodBtn} ${method === m.id ? styles.methodBtnActive : ''}`}
                            onClick={() => setMethod(m.id)}
                            title={m.hint}
                        >
                            <span className={styles.methodLabel}>{m.label}</span>
                            <span className={styles.methodHint}>{m.hint}</span>
                        </button>
                    ))}
                    <button
                        type="button"
                        className={`${styles.methodBtn} ${isCustom ? styles.methodBtnActive : ''}`}
                        onClick={() => setMethod('__custom__')}
                    >
                        + Другое
                    </button>
                </div>
                {isCustom && (
                    <input
                        className={styles.customInput}
                        type="text"
                        value={customMethod}
                        onChange={e => setCustomMethod(e.target.value)}
                        placeholder="Введи способ"
                        autoFocus
                    />
                )}
            </div>

            <div className={styles.section}>
                <div className={styles.sectionLabel}>Исполнитель</div>
                <EmployeePicker
                    employees={employees}
                    selectedId={employeeId}
                    onSelect={setEmployeeId}
                />
            </div>

            <div className={styles.actions}>
                <button
                    className={styles.showBtn}
                    disabled={!canShow}
                    onClick={() => setShowModal(true)}
                >
                    🖨️ Показать этикетку
                </button>
            </div>

            {!canShow && (
                <p className={styles.hint}>
                    Выбери продукт, способ и исполнителя
                </p>
            )}

            {showModal && (
                <DefrostPrintModal
                    company={COMPANY_INFO}
                    product={product}
                    employee={employee}
                    startDate={new Date(startDate)}
                    endDate={new Date(endDate)}
                    methodLabel={methodLabel}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}