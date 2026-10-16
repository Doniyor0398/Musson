import { Link } from 'react-router-dom';
import styles from './PageLayout.module.css';

export function PageLayout({
    title,
    subtitle,
    backTo = '/kitchen',
    backLabel = '← Назад',
    actions = null,
    maxWidth = 720,
    children,
}) {
    return (
        <div
            className={styles.page}
            style={{ maxWidth: `${maxWidth}px` }}
        >
            <div className={styles.topBar}>
                <div className={styles.titleBlock}>
                    <h1>{title}</h1>
                    {subtitle && <p>{subtitle}</p>}
                </div>

                <div className={styles.topActions}>
                    {actions}
                    <Link to={backTo} className={styles.backBtn}>
                        {backLabel}
                    </Link>
                </div>
            </div>

            {children}
        </div>
    );
}