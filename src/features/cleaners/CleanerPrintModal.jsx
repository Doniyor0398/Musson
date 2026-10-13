import { useEffect, useState } from 'react';
import styles from './CleanerPrintModal.module.css';

const pad = n => String(n).padStart(2, '0');

const formatShortDate = date => {
    if (!date) return '—';
    const d = pad(date.getDate());
    const m = pad(date.getMonth() + 1);
    const y = String(date.getFullYear()).slice(-2);
    return `${d}.${m}.${y}`;
};

export function CleanerPrintModal({
    company,
    name,
    concentration,
    prepDate,
    expirationDate,
    onClose,
}) {
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const onEsc = e => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [onClose]);

    const handlePrint = () => {
        window.print();
        setTimeout(onClose, 600);
    };

    const LabelContent = () => (
        <>
            <div className="label-header">
                <h3>{company.name}</h3>
                <p>Рабочий раствор</p>
            </div>

            <div className="label-product">
                <h4>{name}</h4>
            </div>

            <div className="label-shelf">
                <p>
                    <strong>Концентрация:</strong> {concentration}%
                </p>
                <p>Дата приготовления: {formatShortDate(prepDate)}</p>
                <p>Срок годности до: {formatShortDate(expirationDate)}</p>
            </div>
        </>
    );

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.modalTitle}>Печать этикетки</div>
                    <div className={styles.modalSub}>
                        {name} · {quantity} шт.
                    </div>
                </div>

                <div className={styles.printerSlot} />

                {/* Предпросмотр */}
                <div className={styles.labelContainer}>
                    <div className="label-roll-wrap">
                        <div className="print-label">
                            <LabelContent />
                        </div>
                    </div>
                </div>

                {/* Печать N копий */}
                <div className="print-only-container">
                    {Array.from({ length: quantity }).map((_, i) => (
                        <div key={i} className="print-label">
                            <LabelContent />
                        </div>
                    ))}
                </div>

                {/* Счётчик копий */}
                <div className={styles.quantityRow}>
                    <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                        −
                    </button>
                    <span className={styles.qtyValue}>{quantity}</span>
                    <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => setQuantity(q => Math.min(50, q + 1))}
                    >
                        +
                    </button>
                </div>

                <div className={styles.actions}>
                    <button
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={onClose}
                    >
                        Закрыть
                    </button>
                    <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={handlePrint}
                    >
                        🖨️ Печать ({quantity})
                    </button>
                </div>
            </div>
        </div>
    );
}