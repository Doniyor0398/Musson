import styles from './admin.module.css';

export function ProductsTab({ products, onEdit, onDelete }) {
    if (products.length === 0) {
        return <div className={styles.empty}>Ничего не найдено</div>;
    }

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Название</th>
                    <th className={styles.hideMobile}>Срок (ч)</th>
                    <th className={styles.hideMobile}>Порция (г)</th>
                    <th style={{ width: 100 }}></th>
                </tr>
            </thead>
            <tbody>
                {products.map(p => (
                    <tr key={p.id}>
                        <td>{p.name}</td>
                        <td className={styles.hideMobile}>{p.hours}</td>
                        <td className={styles.hideMobile}>{p.portion}</td>
                        <td>
                            <div className={styles.actionsCell}>
                                <button
                                    className={styles.iconBtn}
                                    onClick={() => onEdit(p)}
                                    title="Редактировать"
                                >
                                    ✏️
                                </button>
                                <button
                                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                    onClick={() => onDelete(p.id)}
                                    title="Удалить"
                                >
                                    🗑️
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}