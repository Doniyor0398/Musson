import { Link, useNavigate } from 'react-router-dom';
import { COMPANY_INFO } from '../data/company';
import styles from './HomePage.module.css';

export default function HomePage() {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('auth');
        navigate('/login');
    };

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                    Выйти
                </button>
            </div>

            <div className={styles.header}>
                <h1>МУССОН</h1>
                <p>{COMPANY_INFO.legalName}</p>
            </div>

            <div className={styles.cards}>
                <Link to="/kitchen" className={`${styles.card} ${styles.cardActive}`}>
                    <div className={styles.cardIcon}>👨‍🍳</div>
                    <div className={styles.cardTitle}>Кухня</div>
                    <div className={styles.cardText}>
                        Этикетки для продуктов,<br />
                        моющих средств и хозтоваров
                    </div>
                </Link>

                <div className={`${styles.card} ${styles.cardDisabled}`}>
                    <div className={styles.cardBadge}>Скоро</div>
                    <div className={styles.cardIcon}>🍸</div>
                    <div className={styles.cardTitle}>Бар</div>
                    <div className={styles.cardText}>
                        Раздел в разработке
                    </div>
                </div>
            </div>
        </div>
    );
}