import { useState } from 'react';
import { Link } from 'react-router-dom';
import { NumPad } from '../../components/ui/NumPad/NumPad';
import styles from './PinGate.module.css';

const PINS = {
    kitchen: import.meta.env.VITE_KITCHEN_PIN || '1234',
    bar: import.meta.env.VITE_BAR_PIN || '5678',
};

export function PinGate({ children, section = 'kitchen', backTo = '/' }) {
    const [authed, setAuthed] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const expectedPin = PINS[section] || '';
    const sectionLabel = section === 'kitchen' ? 'Кухня' : 'Бар';

    const handleOk = () => {
        if (expectedPin && pin === expectedPin) {
            setAuthed(true);
            setError('');
        } else {
            setError('Неверный PIN-код');
            setPin('');
        }
    };

    if (authed) return children;

    return (
        <div className={styles.screen}>
            <Link to={backTo} className={styles.backTop}>
                ← Назад
            </Link>

            <div className={styles.card}>
                <div className={styles.icon}>🔐</div>
                <div className={styles.title}>Админ: {sectionLabel}</div>
                <div className={styles.subtitle}>Введите PIN-код</div>

                <div className={styles.display}>
                    {pin ? '•'.repeat(pin.length) : '••••'}
                </div>

                <NumPad asString value={pin} onChange={setPin} maxLength={4} />

                <div className={styles.error}>{error}</div>

                <button className={styles.okBtn} onClick={handleOk}>
                    Войти
                </button>

                <Link to={backTo} className={styles.backBottom}>
                    ← Назад
                </Link>
            </div>
        </div>
    );
}