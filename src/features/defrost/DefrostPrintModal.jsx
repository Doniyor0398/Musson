import { useEffect, useState } from 'react';
import { formatDate } from '../../utils/date';
import styles from './DefrostPrintModal.module.css';

export function DefrostPrintModal({
    company,
    product,
    employee,
    startDate,
    endDate,
    methodLabel,
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
        <div className="label-inner label-inner--defrost">
            <div className="label-header">
                <h3>{company.name}</h3>
                <p>{company.legalName}</p>
                <p>{company.factAddress}</p>
            </div>

            <div className="label-body">
                <div className="label-product">
                    <h4>{product.name}</h4>
                </div>
                <div className="label-info-block">
                    <p><strong>РАЗМОРОЗКА</strong></p>
                    <p>Начало: {formatDate(startDate)}</p>
                    <p>Окончание: {formatDate(endDate)}</p>
                    <p>Способ: {methodLabel}</p>
                </div>
            </div>

            <div className="label-footer">
                <div className="label-executor">
                    <p className="label-footer-title">Исполнитель:</p>
                    <p className="label-footer-name">
                        {employee?.name || '—'}
                    </p>
                </div>
                <span className="label-eac">EAC</span>
            </div>
        </div>
    );

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.modalTitle}>Печать этикетки</div>
                    <div className={styles.modalSub}>
                        {product.name} · {quantity} шт.
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