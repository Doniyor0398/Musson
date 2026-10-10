import { formatDate } from '../../utils/date';
import styles from './LabelPreview.module.css';

export function LabelPreview({ company, product, employee, startDate, expirationDate, temperature }) {
    if (!product) return <div className={styles.previewWrapper}>Выбери продукт</div>;

    return (
        <div className={styles.previewWrapper}>
            <div className={styles.label}>
                <div className={styles.header}>
                    <h3>{company.name}</h3>
                    <p>{company.legalName}</p>
                    <p>{company.urAddress}</p>
                    <p>{company.factAddress}</p>
                </div>

                <div className={styles.product}>
                    <h4>{product.name} п/ф 1 пор={product.portion} гр</h4>
                    <p>Состав: {product.ingredients}</p>
                    <p>
                        Белки: {product.protein}, Жиры: {product.fat}, Углеводы: {product.carbs}, Энерг. ценность: {product.calories} Ккал
                    </p>
                    <p>Стоимость: {product.cost}</p>
                    <p>Кол-во: {product.quantity}</p>
                </div>

                <div className={styles.dates}>
                    <span>Упаковано: {formatDate(startDate)}</span>
                    <span>Годен до: {expirationDate ? formatDate(expirationDate) : '—'}</span>
                </div>

                <div className={styles.footer}>
                    <div>
                        <p>Исполнитель</p>
                        <p>{employee?.name || '—'}</p>
                    </div>
                    <div className={styles.eac}>EAC</div>
                </div>
            </div>
        </div>
    );
}