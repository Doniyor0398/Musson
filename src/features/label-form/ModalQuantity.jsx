import { useState } from 'react';
import { NumPad } from '../../components/ui/NumPad/NumPad';
import styles from './ModalNumber.module.css';

export function ModalQuantity({ initialValue = 1, productName, onConfirm, onCancel }) {
    const [qty, setQty] = useState(initialValue);

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.title}>Количество этикеток</div>
                <div className={styles.product}>{productName}</div>

                <div className={styles.value}>{qty}</div>
                <NumPad value={qty} onChange={setQty} max={99} />

                <button className={styles.okBtn} onClick={() => qty > 0 && onConfirm(qty)}>
                    ОК
                </button>
            </div>
        </div>
    );
}