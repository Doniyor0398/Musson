import { Link } from 'react-router-dom';
import { ZONES } from '../data/zones';
import { PageLayout } from '../components/layout/PageLayout';
import styles from './InventoryPage.module.css';

export default function InventoryPage() {
    return (
        <PageLayout
            title="Инвентаризация"
            subtitle="Выбери зону"
            backTo="/kitchen"
        >
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
        </PageLayout>
    );
}