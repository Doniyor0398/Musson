import styles from './StorageCondition.module.css';

export const STORAGE_OPTIONS = [
    { id: 'fridge', icon: '🧊', name: 'Холодильник', temp: 't +2…+6 °C', label: 'при t +2…+6 °C' },
    { id: 'freezer', icon: '❄️', name: 'Морозильник', temp: 'не выше −18 °C', label: 'при t не выше −18 °C' },
];

export function StorageCondition({ value, onChange }) {
    return (
        <div className={styles.group}>
            {STORAGE_OPTIONS.map(opt => (
                <div
                    key={opt.id}
                    className={`${styles.option} ${value === opt.id ? styles.optionActive : ''}`}
                    onClick={() => onChange(opt.id)}
                >
                    <div className={styles.icon}>{opt.icon}</div>
                    <div className={styles.name}>{opt.name}</div>
                    <div className={styles.temp}>{opt.temp}</div>
                </div>
            ))}
        </div>
    );
}