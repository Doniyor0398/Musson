import { useEffect, useState } from 'react';
import { formatDate } from '../../utils/date';
import styles from './CleanerPrintModal.module.css';

export function CleanerPrintModal({
    company,
    category,
    name,
    concentration,
    purpose,
    prepDate,
    expirationDate,
    responsible,
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
        <div className="label-inner label-inner--big">
            <div className="label-header">
                <h3>[ {company.name} ]</h3>
                <p>{company.legalName}</p>
            </div>

            <div className="label-body">
                <div className="label-category">{category}</div>
                <div className="label-product">
                    <h4>{name}</h4>
                </div>
                <div className="label-info-block">
                    <p><strong>Концентрация:</strong> {concentration}</p>
                    <p><strong>Назначение:</strong> {purpose || '—'}</p>
                </div>
                <div className="label-info-block">
                    <p><strong>Вскрыто/Приг:</strong> {prepDate ? formatDate(prepDate) : '—'}</p>
                    <p><strong>Годен до:</strong> {expirationDate ? formatDate(expirationDate) : '—'}</p>
                </div>
            </div>

            <div className="label-footer">
                <div className="label-executor">
                    <p className="label-footer-title">Ответственный:</p>
                    <p className="label-footer-name">{responsible}</p>
                </div>
            </div>
        </div>
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

                <div className={styles.labelContainer}>
                    <div className="label-roll-wrap">
                        <div className="print-label">
                            <LabelContent />
                        </div>
                    </div>
                </div>

                <div className="print-only-container">
                    {Array.from({ length: quantity }).map((_, i) => (
                        <div key={i} className="print-label">
                            <LabelContent />
                        </div>
                    ))}
                </div>

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