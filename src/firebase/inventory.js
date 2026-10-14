import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

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

// Создать сессию инвентаризации
export async function createSession(type, zone, responsible = null) {
  const ref = await addDoc(collection(db, 'inventory_sessions'), {
    date: new Date().toISOString().slice(0, 10),
    type,
    zone,
    responsible,
    status: 'in_progress',
    startedAt: serverTimestamp(),
    completedAt: null,
  });
  return ref.id;
}

// Сохранить остаток продукта
export async function saveProductStock(productId, value) {
  await updateDoc(doc(db, 'products', productId), {
    currentStock: value,
    updatedAt: serverTimestamp(),
  });
}

// Завершить сессию
export async function completeSession(sessionId) {
  await updateDoc(doc(db, 'inventory_sessions', sessionId), {
    status: 'completed',
    completedAt: serverTimestamp(),
  });
}

// Получить все сессии инвентаризации
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

// Получить все продукты для конкретной сессии (по типу + зоне)
export async function fetchSessionProducts(type, zone) {
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

// Найти активную сессию для зоны+типа или создать новую
export async function getOrCreateSession(type, zone, responsible = null) {
  const q = query(
    collection(db, 'inventory_sessions'),
    where('type', '==', type),
    where('zone', '==', zone),
    where('status', '==', 'in_progress'),
  );
  const snap = await getDocs(q);

  // Если есть хотя бы одна активная — берём последнюю
  if (!snap.empty) {
    const sorted = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.startedAt?.seconds || 0) - (a.startedAt?.seconds || 0));
    return sorted[0].id;
  }

  // Иначе создаём новую
  return createSession(type, zone, responsible);
}
