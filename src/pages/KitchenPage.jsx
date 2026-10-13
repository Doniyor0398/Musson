import { Link } from 'react-router-dom';
import styles from './KitchenPage.module.css';

const KITCHEN_LINKS = [
    {
        id: 'products',
        icon: '🏷️',
        title: 'Продукты',
        subtitle: 'Заготовки и полуфабрикаты',
        to: '/kitchen/products',
        variant: 'primary',
    },
    {
        id: 'cleaners',
        icon: '🧴',
        title: 'Моющие средства',
        subtitle: 'Рабочие растворы в емкостях',
        to: '/kitchen/cleaners',
        variant: 'primary',
    },
    {
        id: 'goods',
        icon: '🧺',
        title: 'Хозтовары',
        subtitle: 'Маркировка хозяйственных товаров',
        to: '/kitchen/goods',
        variant: 'primary',
    },
];

const ACCOUNT_LINKS = [
    {
        id: 'inventory',
        icon: '📋',
        title: 'Инвентаризация',
        subtitle: '',
        to: '/kitchen/inventory',
        variant: 'default',
    },
    {
        id: 'health',
        icon: '🩺',
        title: 'Журнал Здоровья ХАССП',
        subtitle: '',
        to: '/kitchen/health',
        variant: 'default',
    },
    {
        id: 'menu',
        icon: '📖',
        title: 'Меню ресторана',
        subtitle: '',
        to: '/kitchen/menu',
        variant: 'default',
    },
];

export default function KitchenPage() {
    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <Link to="/" className={styles.backBtn}>
                    ← Назад
                </Link>
                <Link to="/kitchen/admin" className={styles.adminBtn}>
                    ⚙️ Админ
                </Link>
            </div>

            <div className={styles.header}>
                <h1>Кухня</h1>
                <p>Выбери раздел</p>
            </div>

            <section className={styles.section}>
                <div className={styles.sectionLabel}>Этикетки</div>
                <div className={styles.list}>
                    {KITCHEN_LINKS.map(item => (
                        <KitchenItem key={item.id} item={item} />
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionLabel}>Учёт и меню</div>
                <div className={styles.list}>
                    {ACCOUNT_LINKS.map(item => (
                        <KitchenItem key={item.id} item={item} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function KitchenItem({ item }) {
    const isDisabled = item.variant === 'disabled';

    const content = (
        <>
            <span className={styles.itemIcon}>{item.icon}</span>
            <span className={styles.itemText}>
                <span className={styles.itemTitle}>{item.title}</span>
                {item.subtitle && (
                    <span className={styles.itemSubtitle}>{item.subtitle}</span>
                )}
            </span>
            {item.badge && <span className={styles.itemBadge}>{item.badge}</span>}
        </>
    );

    if (isDisabled) {
        return <div className={`${styles.item} ${styles.itemDisabled}`}>{content}</div>;
    }

    return (
        <Link
            to={item.to}
            className={`${styles.item} ${item.variant === 'primary' ? styles.itemPrimary : styles.itemDefault}`}
        >
            {content}
        </Link>
    );
}