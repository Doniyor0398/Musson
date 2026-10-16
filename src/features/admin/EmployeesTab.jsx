import styles from './admin.module.css';

export function EmployeesTab({ employees, onEdit, onDelete }) {
    if (employees.length === 0) {
        return <div className={styles.empty}>Ничего не найдено</div>;
    }

    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>ФИО</th>
                    <th>Роль</th>
                    <th style={{ width: 100 }}></th>
                </tr>
            </thead>
            <tbody>
                {employees.map(e => (
                    <tr key={e.id}>
                        <td>{e.name}</td>
                        <td>{e.role || '—'}</td>
                        <td>
                            <div className={styles.actionsCell}>
                                <button
                                    className={styles.iconBtn}
                                    onClick={() => onEdit(e)}
                                >
                                    ✏️
                                </button>
                                <button
                                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                    onClick={() => onDelete(e.id)}
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