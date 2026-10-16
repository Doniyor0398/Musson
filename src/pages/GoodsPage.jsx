import { useState } from 'react';
import { COMPANY_INFO } from '../data/company';
import { PRESET_GOODS } from '../data/goods';
import { GoodsPrintModal } from '../features/goods/GoodsPrintModal';
import { PageLayout } from '../components/layout/PageLayout';
import { Section } from '../components/layout/Section';
import styles from './GoodsPage.module.css';

export default function GoodsPage() {
    const [itemName, setItemName] = useState(PRESET_GOODS[0]);
    const [customName, setCustomName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [receivedDate, setReceivedDate] = useState(
        () => new Date().toISOString().slice(0, 10)
    );
    const [responsible, setResponsible] = useState('');
    const [showModal, setShowModal] = useState(false);

    const isCustom = itemName === '__custom__';
    const finalName = isCustom ? customName : itemName;
    const canShow = finalName.trim() && receivedDate && responsible.trim();

    return (
        <PageLayout
            title="Хозтовары"
            subtitle="Маркировка хозяйственных товаров"
            backTo="/kitchen"
            maxWidth={640}
        >
            <Section label="Наименование">
                <div className={styles.buttons}>
                    {PRESET_GOODS.map(name => (
                        <button
                            key={name}
                            type="button"
                            className={`${styles.btn} ${itemName === name ? styles.btnActive : ''
                                }`}
                            onClick={() => setItemName(name)}
                        >
                            {name}
                        </button>
                    ))}
                    <button
                        type="button"
                        className={`${styles.btn} ${isCustom ? styles.btnActive : ''
                            }`}
                        onClick={() => setItemName('__custom__')}
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
                        placeholder="Введите название"
                        autoFocus
                    />
                )}
            </Section>

            <div className={styles.row}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Количество</label>
                    <input
                        className={styles.input}
                        type="text"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        placeholder="1 упак"
                    />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Дата получения</label>
                    <input
                        className={styles.input}
                        type="date"
                        value={receivedDate}
                        onChange={e => setReceivedDate(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Ответственный</label>
                <input
                    className={styles.input}
                    type="text"
                    value={responsible}
                    onChange={e => setResponsible(e.target.value)}
                    placeholder="Иванов И."
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
                <GoodsPrintModal
                    company={COMPANY_INFO}
                    name={finalName}
                    quantity={quantity}
                    receivedDate={new Date(receivedDate)}
                    responsible={responsible}
                    onClose={() => setShowModal(false)}
                />
            )}
        </PageLayout>
    );
}