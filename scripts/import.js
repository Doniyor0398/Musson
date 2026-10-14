import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parseInventory } from './parseInventory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===== Firebase =====
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ===== Очистка коллекции =====
async function clearCollection(name) {
  const snap = await db.collection(name).get();
  if (snap.empty) {
    console.log(`  Коллекция ${name} уже пуста`);
    return;
  }
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`  🗑️  Удалено ${snap.size} документов`);
}

// ===== Загрузка =====
async function upload(items) {
  let uploaded = 0;
  for (let i = 0; i < items.length; i += 500) {
    const chunk = items.slice(i, i + 500);
    const batch = db.batch();
    chunk.forEach((item) => {
      const ref = db.collection('products').doc();
      batch.set(ref, {
        code: item.code,
        name: item.name,
        unit: item.unit || 'кг',
        type: item.type,
        category: item.category,
        zone: item.zone,
        currentStock: 0,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    uploaded += chunk.length;
    console.log(`  ✅ ${uploaded} / ${items.length}`);
  }
}

// ===== MAIN =====
async function main() {
  console.log('🚀 Старт импорта...\n');

  const { products, semi } = parseInventory(join(__dirname, 'inventory.xlsx'));

  console.log(`📦 Товары: ${products.items.length}`);
  console.log(`🥣 ПФ: ${semi.items.length}`);

  console.log('\n📋 Категории товаров:', products.categories.join(', '));
  console.log('📋 Категории ПФ:', semi.categories.join(', '));

  if (products.skipped.length) {
    console.log('\n⚠️  Пропущено в Товарах:');
    console.table(products.skipped);
  }
  if (semi.skipped.length) {
    console.log('\n⚠️  Пропущено в ПФ:');
    console.table(semi.skipped);
  }
  if (semi.multiCategory.length) {
    console.log('\n⚠️  Коды в нескольких категориях:');
    console.table(semi.multiCategory);
  }

  // Проверка маппинга зон
  const withoutZone = [...products.items, ...semi.items].filter((it) => !it.zone);
  if (withoutZone.length) {
    console.log('\n❌ Продукты без зоны (не найдены в маппинге):');
    console.table(
      withoutZone.map((it) => ({ code: it.code, name: it.name, category: it.category })),
    );
  }

  const all = [...products.items, ...semi.items];

  console.log('\n🗑️  Очищаю старую коллекцию products...');
  await clearCollection('products');

  console.log('\n⬆️  Загружаю...');
  await upload(all);

  const finalCount = (await db.collection('products').get()).size;
  console.log(`\n🎉 Готово! Всего в Firestore: ${finalCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
