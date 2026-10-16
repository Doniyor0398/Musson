import { useState } from 'react';
import styles from './inventory.module.css';

export function AddProductModal({
    type,
    unitMode,
    existingCategories,
    onSave,
    onClose,
}) {
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
                            setStockValue(
                                e.target.value
                                    .replace(/[^\d.,]/g, '')
                                    .replace(',', '.')
                            )
                        }
                        placeholder="100"
                    />
                    {!isPiece && stockValue && (
                        <div className={styles.modalHint}>
                            {(() => {
                                const num = parseFloat(stockValue) || 0;
                                if (massUnit === 'г') {
                                    const kg = num / 1000;
                                    return `≈ ${kg
                                        .toFixed(kg < 1 ? 3 : 2)
                                        .replace(/\.?0+$/, '')} кг`;
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
                        {existingCategories.map(c => (
                            <option key={c} value={c} />
                        ))}
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