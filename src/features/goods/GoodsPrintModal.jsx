import { useEffect, useState } from 'react';
import styles from './GoodsPrintModal.module.css';

const pad = n => String(n).padStart(2, '0');

const formatShortDate = date => {
    if (!date) return '—';
    const d = pad(date.getDate());
    const m = pad(date.getMonth() + 1);
    const y = String(date.getFullYear()).slice(-2);
    return `${d}.${m}.${y}`;
};

export function GoodsPrintModal({
    company,
    name,
    quantity,
    receivedDate,
    responsible,
    onClose,
}) {
    const [copies, setCopies] = useState(1);

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
                <p>Хозтовары</p>
            </div>

            <div className="label-product">
                <h4>{name}</h4>
            </div>

            <div className="label-shelf">
                <p>
                    <strong>Количество:</strong> {quantity}
                </p>
                <p>Дата получения: {formatShortDate(receivedDate)}</p>
                <p>
                    <strong>Ответственный:</strong> {responsible}
                </p>
            </div>
        </>
    );

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.modalTitle}>Печать этикетки</div>
                    <div className={styles.modalSub}>
                        {name} · {copies} шт.
                    </div>
                </div>

                <div className={styles.printerSlot} />

                <div className={styles.labelContainer}>
                    <div className="label-roll-wrap">
                        <div className="print-label">
                            <LabelContent />
                        </div>
                    </div>
                </div>

                <div className="print-only-container">
                    {Array.from({ length: copies }).map((_, i) => (
                        <div key={i} className="print-label">
                            <LabelContent />
                        </div>
                    ))}
                </div>

                <div className={styles.quantityRow}>
                    <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => setCopies(c => Math.max(1, c - 1))}
                    >
                        −
                    </button>
                    <span className={styles.qtyValue}>{copies}</span>
                    <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => setCopies(c => Math.min(50, c + 1))}
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
                        🖨️ Печать ({copies})
                    </button>
                </div>
            </div>
        </div>
    );
}