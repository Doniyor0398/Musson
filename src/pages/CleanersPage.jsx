import { useState } from 'react';
import { COMPANY_INFO } from '../data/company';
import { PRESET_CLEANERS } from '../data/cleaners';
import { CleanerPrintModal } from '../features/cleaners/CleanerPrintModal';
import { PageLayout } from '../components/layout/PageLayout';
import { Section } from '../components/layout/Section';
import { toDateTimeLocal, calculateExpiration } from '../utils/date';
import styles from './CleanersPage.module.css';

const RESPONSIBLES = ['Марина Игоревна'];

export default function CleanersPage() {
    const [cleanerName, setCleanerName] = useState(PRESET_CLEANERS[0]);
    const [customName, setCustomName] = useState('');
    const [category, setCategory] = useState('ДЕЗИНФЕКЦИЯ / ХИМИЯ');
    const [concentration, setConcentration] = useState('0,3%');
    const [purpose, setPurpose] = useState('');
    const [days, setDays] = useState('5');
    const [prepDate, setPrepDate] = useState(() => toDateTimeLocal(new Date()));
    const [responsible, setResponsible] = useState(RESPONSIBLES[0]);
    const [showModal, setShowModal] = useState(false);

    const isCustom = cleanerName === '__custom__';
    const finalName = isCustom ? customName : cleanerName;
    const canShow = finalName.trim() && concentration && days && prepDate;

    const expirationDate = (() => {
        if (!prepDate || !days) return null;
        return calculateExpiration(new Date(prepDate), Number(days) * 24);
    })();

    return (
        <PageLayout
            title="Моющие средства"
            subtitle="Маркировка емкостей с рабочими растворами"
            backTo="/kitchen"
            maxWidth={640}
        >
            <Section label="Средство">
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
            </Section>

            <div className={styles.row}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Категория</label>
                    <input
                        className={styles.input}
                        type="text"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        placeholder="ДЕЗИНФЕКЦИЯ / ХИМИЯ"
                    />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Назначение</label>
                    <input
                        className={styles.input}
                        type="text"
                        value={purpose}
                        onChange={e => setPurpose(e.target.value)}
                        placeholder="Гигиена рук"
                    />
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Концентрация</label>
                    <input
                        className={styles.input}
                        type="text"
                        value={concentration}
                        onChange={e => setConcentration(e.target.value)}
                        placeholder="0,3% или Готовый раствор"
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
                <label className={styles.label}>Вскрыто / Приготовлено</label>
                <input
                    className={styles.input}
                    type="datetime-local"
                    value={prepDate}
                    onChange={e => setPrepDate(e.target.value)}
                />
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Ответственный</label>
                <select
                    className={styles.input}
                    value={responsible}
                    onChange={e => setResponsible(e.target.value)}
                >
                    {RESPONSIBLES.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
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
                    category={category}
                    name={finalName}
                    concentration={concentration}
                    purpose={purpose}
                    prepDate={new Date(prepDate)}
                    expirationDate={expirationDate}
                    responsible={responsible}
                    onClose={() => setShowModal(false)}
                />
            )}
        </PageLayout>
    );
}