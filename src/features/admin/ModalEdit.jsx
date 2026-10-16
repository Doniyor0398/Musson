import { useState } from 'react';
import styles from './admin.module.css';

export function ModalEdit({ modal, onSave, onClose }) {
    const isProduct = modal.type.startsWith('product');
    const item = modal.item;

    const [form, setForm] = useState(() =>
        isProduct
            ? {
                name: item?.name || '',
                hours: item?.hours || 24,
                portion: item?.portion || 100,
                ingredients: item?.ingredients || '',
                protein: item?.protein || 0,
                fat: item?.fat || 0,
                carbs: item?.carbs || 0,
                calories: item?.calories || 0,
                quantity: item?.quantity || '1 Кг',
            }
            : {
                name: item?.name || '',
                role: item?.role || 'cook',
            }
    );

    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = () => {
        if (!form.name.trim()) {
            alert('Заполни название');
            return;
        }
        onSave(form);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalTitle}>
                    {item ? 'Редактировать' : 'Добавить'}{' '}
                    {isProduct ? 'продукт' : 'сотрудника'}
                </div>

                <div className={styles.formGroup}>
                    <label>{isProduct ? 'Название продукта' : 'ФИО сотрудника'}</label>
                    <input
                        value={form.name}
                        onChange={e => setField('name', e.target.value)}
                        placeholder={isProduct ? 'Лосось филе П/Ф' : 'Иванов Иван'}
                    />
                </div>

                {isProduct ? (
                    <>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Срок годности (часы)</label>
                                <input
                                    type="number"
                                    value={form.hours}
                                    onChange={e => setField('hours', Number(e.target.value))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Порция (г)</label>
                                <input
                                    type="number"
                                    value={form.portion}
                                    onChange={e => setField('portion', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Количество (упаковка)</label>
                            <input
                                value={form.quantity}
                                onChange={e => setField('quantity', e.target.value)}
                                placeholder="1 Кг"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Состав</label>
                            <textarea
                                value={form.ingredients}
                                onChange={e => setField('ingredients', e.target.value)}
                                placeholder="Лосось, соль"
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.formGroup}>
                        <label>Роль</label>
                        <select
                            value={form.role}
                            onChange={e => setField('role', e.target.value)}
                        >
                            <option value="chef">Шеф-повар</option>
                            <option value="sous_chef">Су-шеф</option>
                            <option value="cook">Повар</option>
                            <option value="helper">Помощник</option>
                        </select>
                    </div>
                )}

                <div className={styles.modalActions}>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnSecondary}`}
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                        onClick={handleSubmit}
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
}