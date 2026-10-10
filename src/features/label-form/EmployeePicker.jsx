import { useState } from 'react';
import styles from './EmployeePicker.module.css';

export function EmployeePicker({ employees, selectedId, onSelect }) {
    const [open, setOpen] = useState(false);
    const selected = employees.find(e => e.id === selectedId);

    return (
        <>
            <button
                type="button"
                className={`${styles.trigger} ${selected ? styles.triggerSelected : ''}`}
                onClick={() => setOpen(true)}
            >
                {selected ? `👨‍🍳 ${selected.name}` : '— Выбрать сотрудника —'}
            </button>

            {open && (
                <div className={styles.overlay} onClick={() => setOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.title}>Выбери сотрудника</div>
                        <div className={styles.list}>
                            {employees.map(e => (
                                <button
                                    key={e.id}
                                    type="button"
                                    className={`${styles.item} ${selectedId === e.id ? styles.itemActive : ''}`}
                                    onClick={() => { onSelect(e.id); setOpen(false); }}
                                >
                                    {e.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}