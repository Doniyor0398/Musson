import { useEffect } from 'react';
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

    // Один компонент этикетки для переиспользования
    const LabelContent = () => (
        <>
            <div className="label-header">
                <h3>{company.name}</h3>
                <p>{company.legalName}</p>
                <p>{company.factAddress}</p>
            </div>

            <div className="label-product">
                <h4>{product.name}</h4>
            </div>

            <div className="label-storage">
                <p><strong>Условия хранения:</strong> {storageLabel}</p>
            </div>

            <div className="label-shelf">
                <p><strong>Срок:</strong> {days} сут.</p>
                <p>Упаковано: {formatDate(startDate)}</p>
                <p>Годен до: {formatDate(expirationDate)}</p>
            </div>

            <div className="label-footer">
                <p><strong>Исполнитель:</strong> {employee?.name || '—'}</p>
                <span className="label-eac">EAC</span>
            </div>
        </>
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

                {/* ПРЕДПРОСМОТР — только 1 этикетка, только на экране */}
                <div className={styles.labelContainer}>
                    <div className="label-roll-wrap">
                        <div className="print-label">
                            <LabelContent />
                        </div>
                    </div>
                </div>

                {/* ПЕЧАТЬ — N этикеток, только для принтера */}
                <div className="print-only-container">
                    {Array.from({ length: quantity }).map((_, i) => (
                        <div key={i} className="print-label">
                            <LabelContent />
                        </div>
                    ))}
                </div>

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