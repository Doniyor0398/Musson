// scripts/migrate-stock.js
// Миграция: currentStock → lastActual
// Запуск: node scripts/migrate-stock.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  console.log('🚀 Миграция currentStock → lastActual\n');

  const snap = await db.collection('products').get();
  console.log(`📦 Всего продуктов: ${snap.size}\n`);

  let updated = 0;
  let alreadyDone = 0;
  let skipped = 0;

  const batchSize = 500;
  let batch = db.batch();
  let inBatch = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();

    if (data.lastActual !== undefined) {
      alreadyDone++;
      continue;
    }

    const stock = data.currentStock;

    if (stock === undefined || stock === null) {
      skipped++;
      continue;
    }

    batch.update(docSnap.ref, { lastActual: stock });
    updated++;
    inBatch++;

    if (inBatch >= batchSize) {
      await batch.commit();
      batch = db.batch();
      inBatch = 0;
    }
  }

  if (inBatch > 0) {
    await batch.commit();
  }

  console.log('📊 Результат:');
  console.log(`  ✅ Обновлено:         ${updated}`);
  console.log(`  ⏭️  Уже с lastActual:  ${alreadyDone}`);
  console.log(`  ⚪ Без currentStock:   ${skipped}`);
  console.log(`\n🎉 Готово. currentStock НЕ удалён — удалим отдельным шагом.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
