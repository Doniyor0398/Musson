import styles from './Select.module.css';

export function Select({ label, id, children, ...props }) {
    return (
        <div className={styles.wrapper}>
            {label && (
                <label className={styles.label} htmlFor={id}>
                    {label}
                </label>
            )}
            <select className={styles.select} id={id} {...props}>
                {children}
            </select>
        </div>
    );
}