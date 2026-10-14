import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getZoneById } from '../data/zones';
import { fetchAllSessions } from '../firebase/inventory';
import { LoadingScreen } from '../components/ui/LoadingScreen/LoadingScreen';
import styles from './InventoryHistoryPage.module.css';

export default function InventoryHistoryPage() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active'); // 'active' | 'completed' | 'all'

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                const data = await fetchAllSessions();
                if (!mounted) return;
                setSessions(data);
            } catch (err) {
                console.error(err);
                alert('Ошибка загрузки: ' + err.message);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, []);

    const filtered = useMemo(() => {
        if (filter === 'all') return sessions;
        return sessions.filter(s => s.status === filter);
    }, [sessions, filter]);

    const activeCount = sessions.filter(s => s.status === 'in_progress').length;
    const completedCount = sessions.filter(s => s.status === 'completed').length;

    if (loading) return <LoadingScreen text="Загружаем инвентаризации..." />;

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.titleBlock}>
                    <h1>📋 Инвентаризации</h1>
                    <p>Всего: {sessions.length}</p>
                </div>
                <Link to="/kitchen/inventory" className={styles.backBtn}>
                    ← Назад
                </Link>
            </div>

            {/* Табы */}
            <div className={styles.tabs}>
                <button
                    type="button"
                    className={`${styles.tab} ${filter === 'active' ? styles.tabActive : ''}`}
                    onClick={() => setFilter('active')}
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

            {/* Список */}
            <div className={styles.list}>
                {filtered.length === 0 && (
                    <div className={styles.empty}>
                        Нет инвентаризаций в этой категории
                    </div>
                )}
                {filtered.map(session => (
                    <SessionCard key={session.id} session={session} />
                ))}
            </div>
        </div>
    );
}

// ===== Карточка сессии =====
function SessionCard({ session }) {
    const zone = getZoneById(session.zone);
    const isActive = session.status === 'in_progress';
    const typeLabel = session.type === 'product' ? 'Товары' : 'П/Ф';

    // Форматирование даты
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

    return (
        <Link
            to={`/kitchen/inventory/history/${session.id}`}
            className={`${styles.card} ${isActive ? styles.cardActive : styles.cardCompleted}`}
        >
            <div className={styles.cardIcon}>
                {isActive ? '🕓' : '✅'}
            </div>

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
        </Link>
    );
}