import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useEmployees } from '../hooks/useEmployees';
import { COMPANY_INFO } from '../data/company';
import { Field } from '../components/ui/Field/Field';
import { Select } from '../components/ui/Select/Select';
import { Button } from '../components/ui/Button/Button';
import { LabelPreview } from '../features/label-preview/LabelPreview';
import { calculateExpiration, toDateTimeLocal } from '../utils/date';
import { ProductPicker } from '../features/label-form/ProductPicker';
import styles from './HomePage.module.css';

export default function HomePage() {
    const { products, loading: loadingP } = useProducts();
    const { employees, loading: loadingE } = useEmployees();

    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [startDate, setStartDate] = useState(toDateTimeLocal(new Date()));
    const [temperature, setTemperature] = useState('+2');

    if (loadingP || loadingE) return <div className={styles.page}>Загрузка...</div>;

    const product = products.find(p => p.id === selectedProductId);
    const employee = employees.find(e => e.id === selectedEmployeeId);
    const expirationDate = product ? calculateExpiration(startDate, product.hours) : null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>🏷️ {COMPANY_INFO.name}</h1>
                <p>{COMPANY_INFO.legalName}</p>
            </div>

            <div className={styles.layout}>
                <div className={styles.card}>
                    <h2>Данные этикетки</h2>

                    <div className={styles.formGroup}>
                        <label style={{ fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6, display: 'block' }}>
                            Продукт
                        </label>
                        <ProductPicker
                            products={products}
                            selectedId={selectedProductId}
                            onSelect={setSelectedProductId}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <Field
                            label="Упаковано"
                            id="startDate"
                            type="datetime-local"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <Select
                            label="Исполнитель"
                            id="employee"
                            value={selectedEmployeeId}
                            onChange={e => setSelectedEmployeeId(e.target.value)}
                        >
                            <option value="">— Выбери сотрудника —</option>
                            {employees.map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </Select>
                    </div>

                    <div className={styles.formGroup}>
                        <Field
                            label="Температура хранения"
                            id="temperature"
                            value={temperature}
                            onChange={e => setTemperature(e.target.value)}
                        />
                    </div>

                    <Button variant="secondary" fullWidth onClick={handlePrint}>
                        🖨️ Напечатать этикетку
                    </Button>

                    <p className={styles.hint}>
                        Кнопка откроет диалог печати. Размер: 58×80 мм.
                    </p>
                </div>

                <div className={styles.card}>
                    <h2>Предпросмотр</h2>
                    <LabelPreview
                        company={COMPANY_INFO}
                        product={product}
                        employee={employee}
                        startDate={new Date(startDate)}
                        expirationDate={expirationDate}
                        temperature={temperature}
                    />
                </div>
            </div>
        </div>
    );
}