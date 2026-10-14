// parseInventory.js — разбор бланка инвентаризации (вкладки «Товар» и «ПФ»)
// Зависимость: npm i xlsx
import XLSX from 'xlsx';

// Значения, которые Excel пишет вместо названия, когда формула сломана
const BAD = /^#(ERROR!|NAME\?|VALUE!|REF!|N\/A|DIV\/0!|NUM!|NULL!)$/;

// Служебный текст, который печатается на каждой странице листа
const SKIP_TEXT = new Set([
  'Товар',
  'Код',
  'Наименование',
  'Ед. изм.',
  'Остаток фактический',
  'Отметки',
]);
const FOOTER = /^(Дата печати|Ответственное лицо)/;

// Единицы: берём только текст из этого списка, чтобы не спутать с остатком
const UNITS = { кг: 'кг', шт: 'шт', литр: 'л', л: 'л' };

// Зона по категории. Заполни, когда пришлёшь маппинг: { 'Бакалея': 'pantry', ... }
export const ZONE_BY_CATEGORY = {
  // ТОВАРЫ
  Бакалея: 'pantry',
  Масло: 'pantry',
  Соуса: 'pantry',
  Специи: 'pantry',
  Сухофрукты: 'pantry',
  Заморозка: 'freezer',
  'Зелень,Салаты': 'fridge',
  Кондитерка: 'pantry',
  Консервация: 'pantry',
  'Молочные продукты': 'fridge',
  'Мясо,курица': 'fridge',
  Овощи: 'fridge',
  'Рыба,Морепродукты': 'fridge',
  Сыры: 'fridge',
  Фрукты: 'fridge',
  Ягоды: 'fridge',
  'Чай,Кофе': 'pantry',

  // ПФ
  'ПФ Гарниры': 'hot',
  'ПФ Зелень,Салаты': 'cold',
  'ПФ Кондитерка': 'prep',
  'ПФ Маринады': 'prep',
  'ПФ Мясо': 'hosper',
  'ПФ Намазки': 'prep',
  'ПФ Овощи': 'prep',
  'ПФ Рыба': 'sushi',
  'ПФ Салаты': 'cold',
  'ПФ СИРОП БАР': 'bar',
  'ПФ Соуса': 'hot',
  'ПФ Супы': 'hot',
  'ПФ Сыры': 'prep',
  'ПФ Тесто': 'prep',
  'ПФ Фреш': 'cold',
  'ПФ Фрукты': 'cold',
  'ПФ Хлеб': 'prep',
};

// 1. Читаем лист построчно. Если ячейка с ошибкой, берём текст формулы:
//    в файле `=+Кранч Киноа` — это и есть название, а значение ячейки #ERROR!.
export function readRows(ws) {
  if (!ws || !ws['!ref']) return [];
  const range = XLSX.utils.decode_range(ws['!ref']);
  const rows = [];
  for (let r = 0; r <= range.e.r; r++) {
    const row = [];
    for (let c = 0; c <= range.e.c; c++) {
      row.push(cellText(ws[XLSX.utils.encode_cell({ r, c })]));
    }
    rows.push(row);
  }
  return rows;
}

function cellText(cell) {
  if (!cell) return '';
  if (cell.t === 'e' || BAD.test(String(cell.w ?? cell.v ?? ''))) {
    return cleanFormula(cell.f) ?? '';
  }
  if (cell.t === 'n') return cell.v;
  if (cell.t === 'd') return ''; // даты в колонке остатка нам не нужны
  return typeof cell.v === 'string' ? cell.v.trim() : (cell.v ?? '');
}

// `=+Кранч Киноа` → `Кранч Киноа`. Ссылки на ячейки и другие листы не название.
function cleanFormula(f) {
  if (!f) return null;
  const s = String(f).trim().replace(/^=/, '').replace(/^\+/, '').trim();
  if (!s || s.includes('!') || /^\$?[A-Z]{1,3}\$?\d+$/.test(s)) return null;
  return s;
}

const isEmpty = (x) => x === '' || x == null;
const isText = (x) => typeof x === 'string' && x !== '' && !BAD.test(x);
const isCode = (x) =>
  (typeof x === 'number' && Number.isInteger(x)) ||
  (typeof x === 'string' && /^\d+$/.test(x));
const codeStr = (x) => String(Math.trunc(Number(x)));
const unitOf = (x) =>
  typeof x === 'string' ? (UNITS[x.trim().toLowerCase()] ?? null) : null;
const pickName = (...cands) => cands.find(isText)?.replace(/^=\+?/, '').trim() || null;

// 2. Разбор строк одного листа.
//    type: 'product' | 'semi'
//    Возвращает { items, skipped, multiCategory }
export function parseSheet(rows, type) {
  const items = [];
  const skipped = [];
  const seen = new Map(); // "код|категория" → название
  const categories = new Set();
  let category = null;

  // Данные начинаются под строкой «Код | Наименование»; шапку документа не трогаем
  const start = rows.findIndex((r) => r[1] === 'Код') + 1;

  rows.slice(start).forEach((row, i) => {
    const line = start + i + 1; // номер строки в Excel
    const [, B, C, D, E, F, G] = row; // A пропускаем, колонки начинаются с B

    if ([B, C, D, E, F, G].every(isEmpty)) return;
    if (isText(B) && (FOOTER.test(B) || SKIP_TEXT.has(B))) return;
    if (isText(C) && FOOTER.test(C)) return;

    // Код в B. Если B пусто, а код в C, значит строка сдвинута на колонку вправо.
    let code = null;
    let name = null;
    if (isCode(B)) {
      code = B;
      name = pickName(C, D);
    } else if (isCode(C) && isEmpty(B)) {
      code = C;
      name = pickName(D, E);
    }

    // Без кода: строка с категорией
    if (code === null) {
      if (isText(B) && !SKIP_TEXT.has(B)) {
        category = B.trim();
        categories.add(category);
      } else if (isEmpty(B) && isText(C) && isEmpty(D)) {
        // категория, которую Excel сдвинул в колонку C
        category = C.trim();
        categories.add(category);
      } else {
        skipped.push({ line, reason: 'не распознано', text: String(C || B || D) });
      }
      return;
    }

    if (!name) {
      skipped.push({ line, code: codeStr(code), reason: 'нет названия' });
      return;
    }

    // Единица: в колонке F, а если сдвинуто, то в G. Остаток (число) сюда не попадёт.
    const unit = unitOf(F) ?? unitOf(G);

    // Один код может быть в разных категориях — это разные позиции.
    // Точный дубль (тот же код, та же категория) пропускаем.
    const key = `${codeStr(code)}|${category}`;
    if (seen.has(key)) {
      skipped.push({
        line,
        code: codeStr(code),
        reason:
          seen.get(key) === name
            ? 'дубль строки (печать на 2 страницах)'
            : 'дубль кода в категории с другим названием',
      });
      return;
    }
    seen.set(key, name);

    items.push({
      code: codeStr(code),
      name,
      unit,
      type,
      category,
      zone: ZONE_BY_CATEGORY[category] ?? null,
      currentStock: 0,
      isActive: true,
      line,
    });
  });

  // Одна позиция в нескольких категориях: покажем, чтобы проверить руками
  const byCode = new Map();
  items.forEach((it) =>
    byCode.set(it.code, [...(byCode.get(it.code) ?? []), it.category]),
  );
  const multiCategory = [...byCode]
    .filter(([, cats]) => cats.length > 1)
    .map(([code, cats]) => ({ code, cats }));

  return { items, skipped, multiCategory, categories: [...categories] };
}

// 3. Файл целиком
export function parseInventory(path) {
  const wb = XLSX.readFile(path, { cellFormula: true });
  return {
    products: parseSheet(readRows(wb.Sheets['Товар']), 'product'),
    semi: parseSheet(readRows(wb.Sheets['ПФ']), 'semi'),
  };
}
