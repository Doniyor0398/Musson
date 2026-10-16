import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getZoneById } from '../data/zones';
import { fetchSession, fetchSessionItems } from '../firebase/inventory';
import { LoadingScreen } from '../components/ui/LoadingScreen/LoadingScreen';
import styles from './SessionDetailPage.module.css';

export default function SessionDetailPage() {
    const { sessionId } = useParams();
    const [session, setSession] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                const s = await fetchSession(sessionId);
                if (!mounted) return;
                setSession(s);

                if (s) {
                    const it = await fetchSessionItems(sessionId);
                    if (!mounted) return;
                    setItems(it);
                }
            } catch (err) {
                console.error(err);
                alert('Ошибка загрузки: ' + err.message);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [sessionId]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter(
            it =>
                (it.name || '').toLowerCase().includes(q) ||
                String(it.code || '').toLowerCase().includes(q),
        );
    }, [items, query]);

    const grouped = useMemo(() => {
        const map = new Map();
        filtered.forEach(it => {
            const cat = it.category || 'Без категории';
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat).push(it);
        });
        return Array.from(map.entries());
    }, [filtered]);

    const zone = session ? getZoneById(session.zone) : null;
    const isActive = session?.status === 'in_progress';
    const typeLabel = session?.type === 'product' ? 'Товары' : 'П/Ф';

    const dateStr = useMemo(() => {
        if (!session?.startedAt) return session?.date || '—';
        const d = session.startedAt.toDate
            ? session.startedAt.toDate()
            : new Date(session.startedAt.seconds * 1000);
        const pad = n => String(n).padStart(2, '0');
        const day = pad(d.getDate());
        const month = pad(d.getMonth() + 1);
        const year = d.getFullYear();
        const hh = pad(d.getHours());
        const mm = pad(d.getMinutes());
        return `${day}.${month}.${year}, ${hh}:${mm}`;
    }, [session]);

    // ===== ЭКСПОРТ EXCEL =====
    const handleExcel = async () => {
        try {
            const ExcelJS = (await import('exceljs')).default;
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Инвентаризация');

            // Настройка колонок
            ws.columns = [
                { header: 'Код', key: 'code', width: 10 },
                { header: 'Наименование', key: 'name', width: 40 },
                { header: 'Категория', key: 'category', width: 22 },
                { header: 'Остаток', key: 'value', width: 12 },
                { header: 'Ед.', key: 'unit', width: 6 },
            ];

            // Заголовок — шапка файла
            ws.mergeCells('A1:E1');
            ws.getCell('A1').value = 'МУССОН — Инвентаризация';
            ws.getCell('A1').font = { bold: true, size: 14 };
            ws.getCell('A1').alignment = { horizontal: 'center' };

            ws.mergeCells('A2:E2');
            ws.getCell('A2').value = `${zone?.name || session.zone} · ${typeLabel} · ${dateStr}`;
            ws.getCell('A2').alignment = { horizontal: 'center' };

            ws.mergeCells('A3:E3');
            ws.getCell('A3').value = `Ответственный: ${session.responsible || '—'}`;
            ws.getCell('A3').alignment = { horizontal: 'center' };

            // Пустая строка
            ws.addRow([]);

            // Строка заголовков колонок
            const headerRow = ws.addRow(['Код', 'Наименование', 'Категория', 'Остаток', 'Ед.']);
            headerRow.font = { bold: true };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' },
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFEAD5C8' },
                };
            });

            // Данные
            items.forEach(it => {
                const row = ws.addRow([
                    it.code || '',
                    it.name || '',
                    it.category || '',
                    it.value || 0,
                    it.unit || '',
                ]);
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
            });

            // Скачиваем
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${zone?.name || session.zone}_${typeLabel}_${session.date}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert('Ошибка экспорта: ' + err.message);
        }
    };

    // ===== ПЕЧАТЬ A4 =====
    const handlePrint = () => {
        document.body.classList.add('print-a4');
        setTimeout(() => {
            window.print();
            setTimeout(() => document.body.classList.remove('print-a4'), 500);
        }, 100);
    };

    if (loading) return <LoadingScreen text="Загружаем сессию..." />;

    if (!session) {
        return (
            <div className={styles.page}>
                <div className={styles.topBar}>
                    <div className={styles.titleBlock}>
                        <h1>Сессия не найдена</h1>
                    </div>
                    <Link to="/kitchen/admin" className={styles.backBtn}>
                        ← Назад
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Скрытая A4-версия для печати */}
            <div className="print-a4-only">
                <h1>МУССОН — Инвентаризация</h1>
                <p>{zone?.name || session.zone} · {typeLabel}</p>
                <p>{dateStr}</p>
                <p>Ответственный: {session.responsible || '—'}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Код</th>
                            <th>Наименование</th>
                            <th>Категория</th>
                            <th>Остаток</th>
                            <th>Ед.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(it => (
                            <tr key={it.id}>
                                <td>{it.code}</td>
                                <td>{it.name}</td>
                                <td>{it.category}</td>
                                <td>{it.value}</td>
                                <td>{it.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Обычная страница */}
            <div className="screen-only">
                <div className={styles.topBar}>
                    <div className={styles.titleBlock}>
                        <h1>{zone ? `${zone.icon} ${zone.name}` : session.zone}</h1>
                        <p>{typeLabel} · {dateStr}</p>
                        {session.responsible && (
                            <p className={styles.responsible}>👤 {session.responsible}</p>
                        )}
                    </div>
                    <Link to="/kitchen/admin" className={styles.backBtn}>
                        ← Назад
                    </Link>
                </div>

                <div className={styles.summary}>
                    <div className={`${styles.status} ${isActive ? styles.statusActive : styles.statusDone}`}>
                        {isActive ? '🕓 В процессе' : '✅ Завершено'}
                    </div>
                    <div className={styles.counter}>
                        Заполнено: <strong>{items.length}</strong>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.excelBtn}
                        onClick={handleExcel}
                    >
                        📥 Excel
                    </button>
                    <button
                        type="button"
                        className={styles.printBtn}
                        onClick={handlePrint}
                    >
                        🖨️ Печать A4
                    </button>
                </div>

                <input
                    className={styles.search}
                    type="search"
                    placeholder="🔍 Поиск по названию или коду..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoComplete="off"
                />

                {items.length === 0 ? (
                    <div className={styles.empty}>
                        В этой сессии ещё ничего не введено
                    </div>
                ) : grouped.length === 0 ? (
                    <div className={styles.empty}>Ничего не найдено</div>
                ) : (
                    <div className={styles.list}>
                        {grouped.map(([cat, list]) => (
                            <div key={cat} className={styles.category}>
                                <div className={styles.categoryTitle}>{cat}</div>
                                {list.map(it => (
                                    <ItemRow key={it.id} item={it} />
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ItemRow({ item }) {
    const value = Number(item.value) || 0;
    const unit = item.unit || '';

    const display = (() => {
        if (unit === 'шт') return `${value} шт`;
        if (unit === 'кг') {
            if (value === 0) return '0 кг';
            if (value < 1) return `${Math.round(value * 1000)} г`;
            return `${value} кг`;
        }
        if (unit === 'л') return `${value} л`;
        return `${value} ${unit}`.trim();
    })();

    return (
        <div className={styles.item}>
            <div className={styles.itemInfo}>
                <div className={styles.itemCode}>{item.code}</div>
                <div className={styles.itemName}>{item.name || '—'}</div>
            </div>
            <div className={styles.itemValue}>{display}</div>
        </div>
    );
}