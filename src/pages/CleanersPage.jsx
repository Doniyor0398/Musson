import { useState } from 'react';
import { Link } from 'react-router-dom';
import { COMPANY_INFO } from '../data/company';
import { PRESET_CLEANERS } from '../data/cleaners';
import { CleanerPrintModal } from '../features/cleaners/CleanerPrintModal';
import styles from './CleanersPage.module.css';

export default function CleanersPage() {
    const [cleanerName, setCleanerName] = useState(PRESET_CLEANERS[0]);
    const [customName, setCustomName] = useState('');
    const [concentration, setConcentration] = useState('0,3');
    const [days, setDays] = useState('5');
    const [prepDate, setPrepDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [showModal, setShowModal] = useState(false);

    const isCustom = cleanerName === '__custom__';
    const finalName = isCustom ? customName : cleanerName;

    const canShow = finalName.trim() && concentration && days;

    const expirationDate = (() => {
        if (!prepDate || !days) return null;
        const d = new Date(prepDate);
        d.setDate(d.getDate() + Number(days));
        return d;
    })();

    return (
        <div className={styles.page}>
            <Link to="/kitchen" className={styles.backBtn}>
                ← Назад
            </Link>

            <div className={styles.header}>
                <h1>Моющие средства</h1>
                <p>Маркировка емкостей с рабочими растворами</p>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionLabel}>Средство</div>
                <div className={styles.cleanerButtons}>
                    {PRESET_CLEANERS.map(name => (
                        <button
                            key={name}
                            type="button"
                            className={`${styles.cleanerBtn} ${cleanerName === name ? styles.cleanerBtnActive : ''
                                }`}
                            onClick={() => setCleanerName(name)}
                        >
                            {name}
                        </button>
                    ))}
                    <button
                        type="button"
                        className={`${styles.cleanerBtn} ${isCustom ? styles.cleanerBtnActive : ''
                            }`}
                        onClick={() => setCleanerName('__custom__')}
                    >
                        + Другое
                    </button>
                </div>

                {isCustom && (
                    <input
                        className={styles.customInput}
                        type="text"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        placeholder="Введите название средства"
                        autoFocus
                    />
                )}
            </div>

            <div className={styles.row}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Концентрация, %</label>
                    <input
                        className={styles.input}
                        type="text"
                        value={concentration}
                        onChange={e => setConcentration(e.target.value)}
                        placeholder="0,3"
                    />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Срок, сутки</label>
                    <input
                        className={styles.input}
                        type="number"
                        value={days}
                        onChange={e => setDays(e.target.value)}
                        placeholder="5"
                    />
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Дата приготовления</label>
                <input
                    className={styles.input}
                    type="date"
                    value={prepDate}
                    onChange={e => setPrepDate(e.target.value)}
                />
            </div>

            <div className={styles.actions}>
                <button
                    className={styles.showBtn}
                    disabled={!canShow}
                    onClick={() => setShowModal(true)}
                >
                    Показать этикетку
                </button>
            </div>

            {showModal && (
                <CleanerPrintModal
                    company={COMPANY_INFO}
                    name={finalName}
                    concentration={concentration}
                    prepDate={new Date(prepDate)}
                    expirationDate={expirationDate}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}