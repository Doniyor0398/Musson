import { formatDate } from '../../utils/date';
import labelStyles from './PrintLabel.module.css';

export default LabelContent = () => (
    <div className={labelStyles.lbl}>
        <div className={labelStyles.brand}>{company.name}</div>

        <div className={labelStyles.legal}>
            <div>{company.legalName}</div>
            <div>Факт. адрес: {company.factAddress}</div>
        </div>

        <div className={labelStyles.name}>{product.name}</div>

        <div className={labelStyles.info}>
            Условия хранения: <b>{storageLabel}</b>
        </div>

        <div className={labelStyles.dates}>
            <div>Срок: <b>{days} сут.</b></div>
            <div>Упаковано <b>{formatDate(startDate)}</b></div>
            <div>Годен до <b>{formatDate(expirationDate)}</b></div>
        </div>

        <div className={labelStyles.foot}>
            <div>
                <span className={labelStyles.footLabel}>Исполнитель</span>
                <span className={labelStyles.footName}>{employee?.name || '—'}</span>
            </div>
            <div className={labelStyles.eac}>EAC</div>
        </div>
    </div>
);