import restaurantBg from '../../../assets/restaurant.webp';
import styles from './LoadingScreen.module.css';

export function LoadingScreen({ text = 'Загрузка...' }) {
    return (
        <div
            className={styles.screen}
            style={{ backgroundImage: `url(${restaurantBg})` }}
        >
            <div className={styles.overlay} />

            <div className={styles.content}>
                <div className={styles.logo}>MUSSON</div>
                <div className={styles.subtitle}>Restaurant</div>

                <div className={styles.dots}>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                </div>

                <div className={styles.progressBar}>
                    <div className={styles.progressFill}></div>
                </div>

                <div className={styles.text}>{text}</div>
            </div>
        </div>
    );
}