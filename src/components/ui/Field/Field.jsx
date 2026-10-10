import styles from './Field.module.css';

export function Field({ label, id, ...props }) {
    return (
        <div className={styles.wrapper}>
            {label && (
                <label className={styles.label} htmlFor={id}>
                    {label}
                </label>
            )}
            <input className={styles.input} id={id} {...props} />
        </div>
    );
}