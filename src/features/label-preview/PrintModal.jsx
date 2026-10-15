import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatDate } from '../../utils/date';
import styles from './PrintModal.module.css';

export function PrintModal({
    company,
    product,
    employee,
    startDate,
    days,
    quantity,
    storageLabel,
    onClose,
    onPrinted,
}) {
    useEffect(() => {
        const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [onClose]);

    const expirationDate = (() => {
        const d = new Date(startDate);
        d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
        return d;
    })();

    const handlePrint = () => {
        window.print();
        setTimeout(onPrinted, 600);
    };

    const LabelContent = () => (
        <div className="label-inner">
            {/* 1. ШАПКА */}
            <div className="label-header">
                <h3>{company.name}</h3>
                <p>{company.legalName}</p>
                <p>{company.factAddress}</p>
            </div>

            {/* 2. ТЕЛО ЧЕКА */}
            <div className="label-body">
                <div className="label-product">
                    <h4>{product.name}</h4>
                </div>
                <div className="label-info-block">
                    <p><strong>Условия хранения:</strong> {storageLabel}</p>
                    <p><strong>Срок:</strong> {days} сут.</p>
                    <p>Упаковано: {formatDate(startDate)}</p>
                    <p>Годен до: {formatDate(expirationDate)}</p>
                </div>
            </div>

            {/* 3. ПОДВАЛ */}
            <div className="label-footer">
                <div className="label-executor">
                    <p className="label-footer-title">Исполнитель:</p>
                    <p className="label-footer-name">{employee?.name || '—'}</p>
                </div>
                <span className="label-eac">EAC</span>
            </div>
        </div>
    );

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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

                {createPortal(
                    <div className="print-only-container">
                        {Array.from({ length: quantity }).map((_, i) => (
                            <div key={i} className="print-label">
                                <LabelContent />
                            </div>
                        ))}
                    </div>,
                    document.body
                )}

                <div className={styles.actions}>
                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
                        Закрыть
                    </button>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handlePrint}>
                        🖨️ Печать ({quantity})
                    </button>
                </div>
            </div>
        </div>
    );
}
