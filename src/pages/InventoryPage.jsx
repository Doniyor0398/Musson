import { Link } from 'react-router-dom';
import { ZONES } from '../data/zones';
import styles from './InventoryPage.module.css';

export default function InventoryPage() {
    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.titleBlock}>
                    <h1>Инвентаризация</h1>
                    <p>Выбери зону</p>
                </div>
                <Link to="/kitchen" className={styles.backBtn}>
                    ← Назад
                </Link>
            </div>

            <div className={styles.grid}>
                {ZONES.map(zone => (
                    <Link
                        key={zone.id}
                        to={`/kitchen/inventory/${zone.id}`}
                        className={styles.zone}
                    >
                        <div className={styles.zoneIcon}>{zone.icon}</div>
                        <div className={styles.zoneName}>{zone.name}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}