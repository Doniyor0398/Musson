import { useState } from 'react';
import styles from './inventory.module.css';

export function AddMoreModal({ product, unitMode, onConfirm, onClose }) {
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
                            setValue(
                                e.target.value
                                    .replace(/[^\d.,]/g, '')
                                    .replace(',', '.')
                            )
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