import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useEmployees } from '../hooks/useEmployees';
import { COMPANY_INFO } from '../data/company';
import { Field } from '../components/ui/Field/Field';
import { Button } from '../components/ui/Button/Button';
import { ProductPicker } from '../features/label-form/ProductPicker';
import { EmployeePicker } from '../features/label-form/EmployeePicker';
import { StorageCondition, STORAGE_OPTIONS } from '../features/label-form/StorageCondition';
import { ModalHours } from '../features/label-form/ModalHours';
import { ModalQuantity } from '../features/label-form/ModalQuantity';
import { PrintModal } from '../features/label-preview/PrintModal';
import { LoadingScreen } from '../components/ui/LoadingScreen/LoadingScreen';
import { toDateTimeLocal } from '../utils/date';
import { Link } from 'react-router-dom';
import { getShelfLife } from '../data/shelfLife';
import styles from './ProductsPage.module.css';

export default function ProductsPage() {
    const { products, loading: loadingP } = useProducts();
    const { employees, loading: loadingE } = useEmployees();

    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [startDate, setStartDate] = useState(toDateTimeLocal(new Date()));
    const [storage, setStorage] = useState('');

    const [days, setDays] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [step, setStep] = useState(null);

    if (loadingP || loadingE) return <LoadingScreen text="Загружаем продукты..." />;

    const product = products.find(p => p.id === selectedProductId);
    const employee = employees.find(e => e.id === selectedEmployeeId);
    const canNext = product && employee && storage;

    const handleNext = () => {
        const initialDays = getShelfLife(product.category);
        setDays(initialDays);
        setStep('hours');
    };

    const handleHoursConfirm = (d) => { setDays(d); setStep('quantity'); };
    const handleQuantityConfirm = (q) => { setQuantity(q); setStep('print'); };

    const handleCloseAll = () => {
        setStep(null);
        setSelectedProductId('');
        setStorage('');
        setDays(null);
        setQuantity(1);
        setStartDate(toDateTimeLocal(new Date()));
    };

    const storageLabel = STORAGE_OPTIONS.find(s => s.id === storage)?.label || '';

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.titleBlock}>
                    <h1>🏷️ Продукты</h1>
                    <p>Заготовки и полуфабрикаты</p>
                </div>
                <Link to="/kitchen" className={styles.backBtn}>
                    ← Назад
                </Link>
            </div>
            <div className={styles.tabs}>
                <Link to="/kitchen/defrost" className={styles.tab}>
                    <span className={styles.tabTitle}>❄️ Разморозка</span>
                    <span className={styles.tabSub}>DEFROST</span>
                </Link>
                <Link
                    to="/kitchen/products"
                    className={`${styles.tab} ${styles.tabActive}`}
                >
                    <span className={styles.tabTitle}>🏷️ Продукты</span>
                    <span className={styles.tabSub}>PRODUCTS</span>
                </Link>
            </div>

            <div className={styles.section}>
                <ProductPicker
                    products={products}
                    selectedId={selectedProductId}
                    onSelect={setSelectedProductId}
                />
            </div>

            <div className={styles.section}>
                <span className={styles.sectionLabel}>Условие хранения</span>
                <StorageCondition value={storage} onChange={setStorage} />
            </div>

            <div className={styles.section}>
                <Field
                    label="Дата упаковки"
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                />
            </div>

            <div className={styles.section}>
                <span className={styles.sectionLabel}>Исполнитель</span>
                <EmployeePicker
                    employees={employees}
                    selectedId={selectedEmployeeId}
                    onSelect={setSelectedEmployeeId}
                />
            </div>

            <div className={styles.actions}>
                <Button
                    variant="primary"
                    disabled={!canNext}
                    onClick={handleNext}
                    style={{ padding: '16px 60px', fontSize: 17 }}
                >
                    Далее →
                </Button>
            </div>

            {!canNext && (
                <p className={styles.hint}>Выбери продукт, условие хранения и сотрудника</p>
            )}

            {step === 'hours' && (
                <ModalHours
                    initialValue={days}
                    productName={product.name}
                    onConfirm={handleHoursConfirm}
                    onCancel={() => setStep(null)}
                />
            )}

            {step === 'quantity' && (
                <ModalQuantity
                    initialValue={1}
                    productName={product.name}
                    onConfirm={handleQuantityConfirm}
                    onCancel={() => setStep('hours')}
                />
            )}

            {step === 'print' && (
                <PrintModal
                    company={COMPANY_INFO}
                    product={product}
                    employee={employee}
                    startDate={new Date(startDate)}
                    hours={days * 24}
                    days={days}
                    quantity={quantity}
                    storageLabel={storageLabel}
                    onClose={handleCloseAll}
                    onPrinted={handleCloseAll}
                />
            )}
        </div>
    );
}