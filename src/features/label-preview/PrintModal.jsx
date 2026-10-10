import { useEffect } from 'react';
import { formatDate } from '../../utils/date';
import styles from './PrintModal.module.css';

export function PrintModal({ company, product, employee, startDate, days, quantity, storageLabel, onClose, onPrinted }) {
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

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalTitle}>🖨️ Печать этикетки</div>
                <div className={styles.printerSlot} />

                <div className={styles.labelContainer}>
                    <div className={`${styles.labelPaper} print-label`}>
                        <div className={styles.header}>
                            <h3>{company.name}</h3>
                            <p>{company.legalName}</p>
                            <p>{company.factAddress}</p>
                        </div>
                        <div className={styles.product}>
                            <h4>{product.name} п/ф 1 пор={product.portion} гр</h4>
                            <p>Состав: {product.ingredients}</p>
                            <p>Б: {product.protein} Ж: {product.fat} У: {product.carbs} Ккал: {product.calories}</p>
                            <p>Кол-во: {product.quantity}</p>
                            <p>Хранение: {storageLabel}</p>
                        </div>
                        <div className={styles.dates}>
                            Упак: {formatDate(startDate)} | Годен: {formatDate(expirationDate)}
                        </div>
                        <div className={styles.footer}>
                            <div>
                                <p>Исполнитель</p>
                                <p>{employee?.name || '—'}</p>
                            </div>
                            <div className={styles.eac}>EAC</div>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>Закрыть</button>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handlePrint}>🖨️ Печать ({quantity})</button>
                </div>
            </div>
        </div>
    );
}