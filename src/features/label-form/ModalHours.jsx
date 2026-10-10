import { useState } from 'react';
import { NumPad } from '../../components/ui/NumPad/NumPad';
import styles from './ModalNumber.module.css';

export function ModalHours({ initialValue, productName, onConfirm, onCancel }) {
  const [days, setDays] = useState(initialValue || 1);

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.title}>Срок годности (сутки)</div>
        <div className={styles.product}>{productName}</div>

        <div className={styles.value}>{days}</div>
        <NumPad value={days} onChange={setDays} max={365} />

        <button className={styles.okBtn} onClick={() => days > 0 && onConfirm(days)}>
          ОК
        </button>
      </div>
    </div>
  );
}