import { useState, useEffect, useRef } from 'react';
import styles from './inventory.module.css';

export function InventoryRow({ product, unitMode, onChange, onAddMore }) {
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
                    <span className={styles.unit}>{isPiece ? 'шт' : unitMode}</span>
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