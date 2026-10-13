import styles from './NumPad.module.css';

export function NumPad({ value, onChange, max = 99999, asString = false, maxLength = 4 }) {
    const press = (digit) => {
        const next = String(value || '') + digit;
        if (asString) {
            if (next.length <= maxLength) onChange(next);
        } else if (Number(next) <= max) {
            onChange(Number(next));
        }
    };

    const clear = () => onChange(asString ? '' : 0);

    const backspace = () => {
        const str = String(value || '').slice(0, -1);
        onChange(asString ? str : Number(str) || 0);
    };

    return (
        <div className={styles.pad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button key={n} className={styles.btn} type="button" onClick={() => press(n)}>{n}</button>
            ))}
            <button className={`${styles.btn} ${styles.btnAction}`} type="button" onClick={clear}>✕</button>
            <button className={styles.btn} type="button" onClick={() => press(0)}>0</button>
            <button className={`${styles.btn} ${styles.btnAction}`} type="button" onClick={backspace}>⌫</button>
        </div>
    );
}