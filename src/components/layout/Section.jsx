import styles from './Section.module.css';

export function Section({ children, label, className = '' }) {
    return (
        <div className={`${styles.section} ${className}`}>
            {label && <div className={styles.sectionLabel}>{label}</div>}
            {children}
        </div>
    );
}