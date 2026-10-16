import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getZoneById } from '../data/zones';
import { subscribeToSessions, deleteSession } from '../firebase/inventory';
import styles from './ReportsTab.module.css';

const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function getSessionMonth(session) {
    if (session.date && /^\d{4}-\d{2}/.test(session.date)) {
        return session.date.slice(0, 7);
    }
    if (session.startedAt) {
        const d = session.startedAt.toDate
            ? session.startedAt.toDate()
            : new Date(session.startedAt.seconds * 1000);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }
    return null;
}

function formatMonth(key) {
    if (!key) return '—';
    const [y, m] = key.split('-');
    return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

export function ReportsTab() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [deletingAll, setDeletingAll] = useState(false);

    useEffect(() => {
        let firstLoad = true;

        const unsub = subscribeToSessions(
            (data) => {
                setSessions(data);
                if (firstLoad) {
                    setLoading(false);
                    firstLoad = false;
                }
            },
            (err) => {
                console.error(err);
                if (firstLoad) {
                    alert('Ошибка загрузки: ' + err.message);
                    setLoading(false);
                }
            },
        );

        return () => unsub();
    }, []);

    const months = useMemo(() => {
        const set = new Set();
        sessions.forEach(s => {
            const m = getSessionMonth(s);
            if (m) set.add(m);
        });
        return Array.from(set).sort().reverse();
    }, [sessions]);

    const filtered = useMemo(() => {
        let list = sessions;
        if (filter !== 'all') {
            list = list.filter(s => s.status === filter);
        }
        if (selectedMonth !== 'all') {
            list = list.filter(s => getSessionMonth(s) === selectedMonth);
        }
        return list;
    }, [sessions, filter, selectedMonth]);

    const activeCount = sessions.filter(s => s.status === 'in_progress').length;
    const completedCount = sessions.filter(s => s.status === 'completed').length;

    const handleDeleted = (id) => {
        setSessions(prev => prev.filter(s => s.id !== id));
    };

    const handleDeleteFiltered = async () => {
        if (filtered.length === 0) return;

        const ok = confirm(
            `Удалить ${filtered.length} сессий?\n\nЭто то, что сейчас на экране (с учётом фильтров).\n\nЭто действие нельзя отменить.`
        );
        if (!ok) return;

        setDeletingAll(true);
        const ids = filtered.map(s => s.id);
        let okCount = 0;
        let errCount = 0;

        for (const id of ids) {
            try {
                await deleteSession(id);
                okCount++;
            } catch (err) {
                console.error('Ошибка удаления', id, err);
                errCount++;
            }
        }

        const deletedSet = new Set(ids);
        setSessions(prev => prev.filter(s => !deletedSet.has(s.id)));
        setDeletingAll(false);

        if (errCount === 0) {
            alert(`✅ Удалено ${okCount} сессий`);
        } else {
            alert(`Удалено ${okCount}, ошибок: ${errCount}`);
        }
    };

    return (
        <div>
            <div className={styles.tabs}>
                <button
                    type="button"
                    className={`${styles.tab} ${filter === 'in_progress' ? styles.tabActive : ''}`}
                    onClick={() => setFilter('in_progress')}
                >
                    🕓 Активные ({activeCount})
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${filter === 'completed' ? styles.tabActive : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    ✅ Завершённые ({completedCount})
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${filter === 'all' ? styles.tabActive : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Все ({sessions.length})
                </button>
            </div>

            <div className={styles.filterRow}>
                {months.length > 0 ? (
                    <select
                        className={styles.monthSelect}
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                    >
                        <option value="all">Все месяцы</option>
                        {months.map(m => (
                            <option key={m} value={m}>
                                {formatMonth(m)}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div style={{ flex: 1 }} />
                )}

                {filtered.length > 0 && (
                    <button
                        type="button"
                        className={styles.deleteAllBtn}
                        onClick={handleDeleteFiltered}
                        disabled={deletingAll}
                    >
                        {deletingAll
                            ? '…'
                            : `🗑️ Удалить все (${filtered.length})`}
                    </button>
                )}
            </div>

            {loading ? (
                <div className={styles.empty}>Загрузка...</div>
            ) : filtered.length === 0 ? (
                <div className={styles.empty}>Нет инвентаризаций</div>
            ) : (
                <div className={styles.list}>
                    {filtered.map(session => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            onDeleted={handleDeleted}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function SessionCard({ session, onDeleted }) {
    const zone = getZoneById(session.zone);
    const isActive = session.status === 'in_progress';
    const typeLabel = session.type === 'product' ? 'Товары' : 'П/Ф';
    const [deleting, setDeleting] = useState(false);

    const dateStr = (() => {
        if (!session.startedAt) return session.date || '—';
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
    })();

    const handleDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (deleting) return;

        const label = zone ? zone.name : session.zone;
        const statusLabel = isActive ? 'в процессе' : 'завершена';
        const ok = confirm(
            `Удалить сессию?\n\n${label} · ${typeLabel}\n${dateStr}\nСтатус: ${statusLabel}\n\nЭто действие нельзя отменить.`
        );
        if (!ok) return;

        setDeleting(true);
        try {
            await deleteSession(session.id);
            onDeleted(session.id);
        } catch (err) {
            console.error(err);
            alert('Ошибка удаления: ' + err.message);
            setDeleting(false);
        }
    };

    return (
        <div className={styles.cardWrap}>
            <Link
                to={`/kitchen/admin/report/${session.id}`}
                className={`${styles.card} ${isActive ? styles.cardActive : styles.cardCompleted}`}
            >
                <div className={styles.cardIcon}>{isActive ? '🕓' : '✅'}</div>

                <div className={styles.cardContent}>
                    <div className={styles.cardTitle}>
                        {zone ? `${zone.icon} ${zone.name}` : session.zone}
                    </div>
                    <div className={styles.cardSub}>
                        {typeLabel} · {dateStr}
                    </div>
                    {session.responsible && (
                        <div className={styles.cardResponsible}>
                            👤 {session.responsible}
                        </div>
                    )}
                </div>

                <div className={styles.cardStatus}>
                    {isActive ? 'В процессе' : 'Завершено'}
                </div>

                <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={handleDelete}
                    disabled={deleting}
                    title="Удалить"
                    aria-label="Удалить"
                >
                    {deleting ? '…' : '🗑️'}
                </button>
            </Link>
        </div>
    );
}