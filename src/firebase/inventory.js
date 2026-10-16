import {
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    writeBatch,
} from 'firebase/firestore';
import { db } from './config';

// Локальная дата YYYY-MM-DD (не UTC!)
const todayLocal = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// ============================================
// ПРОДУКТЫ
// ============================================

// Получить продукты по типу и зоне
export async function fetchProductsByZone(type, zone) {
    const q = query(
        collection(db, 'products'),
        where('type', '==', type),
        where('zone', '==', zone),
        where('isActive', '==', true),
    );
    const snap = await getDocs(q);
    return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
            if (a.category !== b.category) return a.category.localeCompare(b.category);
            return a.name.localeCompare(b.name);
        });
}

// ============================================
// СЕССИИ
// ============================================

// Гарантировать сессию. ID детерминированный:
// "YYYY-MM-DD_zone_type" — например "2026-10-16_fridge_product"
export async function ensureSession(zone, type, responsible = null) {
    const date = todayLocal();
    const id = `${date}_${zone}_${type}`;
    const ref = doc(db, 'inventory_sessions', id);

    const snap = await getDoc(ref);
    if (snap.exists()) {
        return id;
    }

    await setDoc(ref, {
        date,
        zone,
        type,
        responsible,
        status: 'in_progress',
        startedAt: serverTimestamp(),
        completedAt: null,
    });

    return id;
}

// Получить все сессии
export async function fetchAllSessions() {
    const snap = await getDocs(collection(db, 'inventory_sessions'));
    return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
            const aTime = a.startedAt?.seconds || 0;
            const bTime = b.startedAt?.seconds || 0;
            return bTime - aTime;
        });
}

// Получить одну сессию
export async function fetchSession(sessionId) {
    const ref = doc(db, 'inventory_sessions', sessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

// ============================================
// ITEMS (подколлекция сессии)
// ============================================

// Сохранить значение позиции
// meta: { name, code, unit, category }
export async function saveItem(sessionId, productId, value, meta = {}) {
    const ref = doc(db, 'inventory_sessions', sessionId, 'items', productId);
    await setDoc(
        ref,
        {
            value,
            name: meta.name || '',
            code: meta.code || '',
            unit: meta.unit || '',
            category: meta.category || '',
            enteredAt: serverTimestamp(),
        },
        { merge: true },
    );
}

// Получить все items сессии
export async function fetchSessionItems(sessionId) {
    const snap = await getDocs(collection(db, 'inventory_sessions', sessionId, 'items'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ============================================
// ЗАВЕРШЕНИЕ
// ============================================

// Завершить сессию:
// 1. Все значения items → в products.lastActual
// 2. Статус сессии → completed
export async function completeSession(sessionId) {
    const items = await fetchSessionItems(sessionId);

    // Батчами по 500 обновляем lastActual
    const batchSize = 500;
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = items.slice(i, i + batchSize);
        chunk.forEach((item) => {
            const pref = doc(db, 'products', item.id);
            batch.update(pref, {
                lastActual: item.value,
                updatedAt: serverTimestamp(),
            });
        });
        await batch.commit();
    }

    // Помечаем сессию завершённой
    await updateDoc(doc(db, 'inventory_sessions', sessionId), {
        status: 'completed',
        completedAt: serverTimestamp(),
    });
}

// Найти активную сессию (in_progress) для зоны+типа. Вернёт id или null.
export async function getActiveSession(zone, type) {
    const q = query(
        collection(db, 'inventory_sessions'),
        where('zone', '==', zone),
        where('type', '==', type),
        where('status', '==', 'in_progress'),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].id;
}

// Удалить сессию: сначала items, потом саму сессию
export async function deleteSession(sessionId) {
    const itemsSnap = await getDocs(collection(db, 'inventory_sessions', sessionId, 'items'));
    if (!itemsSnap.empty) {
        const batch = writeBatch(db);
        itemsSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
    await deleteDoc(doc(db, 'inventory_sessions', sessionId));
}

// Realtime-подписка на сессии. Возвращает функцию отписки.
export function subscribeToSessions(onData, onError) {
    const ref = collection(db, 'inventory_sessions');
    return onSnapshot(
        ref,
        (snap) => {
            const list = snap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => {
                    const aTime = a.startedAt?.seconds || 0;
                    const bTime = b.startedAt?.seconds || 0;
                    return bTime - aTime;
                });
            onData(list);
        },
        (err) => {
            if (onError) onError(err);
            else console.error('[subscribeToSessions]', err);
        },
    );
}
